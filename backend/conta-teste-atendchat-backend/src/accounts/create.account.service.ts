/* eslint-disable prettier/prettier */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAccountDto } from './dto/create.account.dto';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create.user.dto';
import { WhatsappService } from './whatsapp.service'; 
import { MailService } from './mail.service';

@Injectable()
export class createAccountService {
  private readonly logger = new Logger(createAccountService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly whatsappService: WhatsappService,
    private readonly mailService: MailService,
  ) {}

  async createChatWhootAccount(data: CreateAccountDto) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    try {
      this.logger.log(`Iniciando criação de conta Master: ${data.empresa}`);
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/accounts`, {
          name: data.empresa,
          locale: 'pt_BR',
          domain: data.mail,
          support_email: data.mail,
        }, {
          headers: { api_access_token: token },
        }),
      );
      return responseData;
    } catch (error) {
      this.logger.error('Erro ao criar conta', error.response?.data);
      throw new HttpException('Falha ao criar conta externa', HttpStatus.BAD_REQUEST);
    }
  }

  async createChatwootUser(data: CreateUserDto, empresa: string, telefone: string) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    let userId: number;

    // --- PASSO 1: TENTAR CRIAR OU LOCALIZAR ---
    try {
      this.logger.log(`Tentando criar usuário: ${data.email}`);
      const { data: userResponse } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/users`, {
          name: data.name,
          email: data.email,
          password: data.password,
        }, {
          headers: { api_access_token: token },
        }),
      );
      userId = userResponse.id;
    } catch (error) {
      if (error.response?.status === 422) {
        this.logger.warn(`Conflito: Usuário ${data.email} já existe. Iniciando varredura...`);
        
        try {
          // Buscamos a lista (aqui está o ajuste para lidar com diferentes formatos)
          const response = await lastValueFrom(
            this.httpService.get(`${apiUrl}/users`, {
              headers: { api_access_token: token },
            })
          );

          // O Chatwoot pode retornar a lista direto ou dentro de 'data' ou 'payload'
          const rawData = response.data;
          const usersList = Array.isArray(rawData) ? rawData : (rawData.data || rawData.payload || []);
          
          this.logger.debug(`Total de usuários recuperados para busca: ${usersList.length}`);

          // Busca ignorando maiúsculas/minúsculas
          const existingUser = usersList.find((u: any) => 
            u.email.toLowerCase() === data.email.toLowerCase()
          );

          if (!existingUser) {
             this.logger.error(`E-mail ${data.email} deu erro 422 mas não aparece na lista de usuários da plataforma.`);
             throw new Error('User missing from platform list');
          }

          userId = existingUser.id;
          this.logger.log(`ID recuperado com sucesso: ${userId}`);
        } catch (searchError) {
          this.logger.error('Erro crítico na busca de usuário', searchError.message);
          throw new HttpException('Este e-mail pertence a um usuário global que você não tem permissão para vincular.', HttpStatus.CONFLICT);
        }
      } else {
        this.logger.error('Erro desconhecido ao criar usuário', error.response?.data);
        throw new HttpException('Falha ao processar usuário', HttpStatus.BAD_REQUEST);
      }
    }

    // --- PASSO 2: VINCULAR À CONTA ---
    try {
      this.logger.log(`Vinculando ID ${userId} na conta ${data.accountId}...`);
      await lastValueFrom(
        this.httpService.post(
          `${apiUrl}/accounts/${data.accountId}/account_users`,
          { user_id: userId, role: 'administrator' },
          { headers: { api_access_token: token } },
        ),
      );

      // --- PASSO 3: NOTIFICAÇÕES ---
      const linkAcesso = 'https://chat.hotmobile.com.br';
      
      this.logger.debug('Enviando notificações...');
      await this.whatsappService.enviarMensagem(telefone, `Olá *${empresa}*! Sua conta Hotmobile está pronta. Acesse: ${linkAcesso}`);
      await this.mailService.enviarMailChimp(data.email, '🚀 Sua conta Hotmobile está pronta!', `Olá ${empresa}, seu acesso: ${data.email}`, linkAcesso);

      this.logger.log(`✅ Processo finalizado para ${data.email}`);
      return { success: true, user: { id: userId, email: data.email } };

    } catch (error) {
      // Caso o usuário já esteja vinculado, tratamos como sucesso
      const errorMsg = JSON.stringify(error.response?.data || '');
      if (errorMsg.includes('already exists') || errorMsg.includes('taken')) {
        this.logger.log('Usuário já estava vinculado a esta conta. Seguindo...');
        return { success: true, message: 'Já vinculado' };
      }

      this.logger.error('Erro final no vínculo', error.response?.data);
      throw new HttpException('Erro ao vincular usuário à conta master.', HttpStatus.BAD_REQUEST);
    }
  }
}