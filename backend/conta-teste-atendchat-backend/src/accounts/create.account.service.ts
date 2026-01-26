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
      this.logger.log(`[PASSO 1] Criando conta Master: ${data.empresa}`);
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/accounts`, {
          name: data.empresa,
          locale: 'pt_BR',
        }, {
          headers: { api_access_token: token },
        }),
      );
      return responseData;
    } catch (error) {
      this.logger.error('Erro ao criar conta no Chatwoot', error.response?.data);
      throw new HttpException('Falha ao criar conta master.', HttpStatus.BAD_REQUEST);
    }
  }

  async createChatwootUser(data: CreateUserDto, empresa: string, telefone: string) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    let userId: number;

    // --- PASSO 1: CRIAR OU LOCALIZAR USUÁRIO ---
    try {
      this.logger.log(`[PASSO 2] Tentando criar usuário: ${data.email}`);
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
        this.logger.warn(`E-mail ${data.email} já existe. Iniciando busca profunda...`);
        
        try {
          // Busca em todas as páginas se necessário ou via filtro
          // A Platform API costuma retornar uma lista. Vamos varrer as primeiras páginas.
          const searchResponse = await lastValueFrom(
            this.httpService.get(`${apiUrl}/users`, {
              headers: { api_access_token: token },
            })
          );

          // Lógica para extrair a lista independente do formato
          const rawData = searchResponse.data;
          const usersList = Array.isArray(rawData) ? rawData : (rawData.data || rawData.payload || []);
          
          const foundUser = usersList.find((u: any) => u.email.toLowerCase() === data.email.toLowerCase());

          if (foundUser) {
            userId = foundUser.id;
            this.logger.log(`Usuário localizado com sucesso! ID: ${userId}`);
          } else {
            // Se não achou na primeira página, o usuário pode estar em outra página ou o token não tem visão global
            this.logger.error(`O usuário ${data.email} existe (erro 422), mas o seu Token de Plataforma não permitiu localizá-lo na lista.`);
            throw new Error('User exists but is invisible to this token');
          }
        } catch (e) {
          throw new HttpException(
            'Este e-mail já está em uso em outra conta e seu token não tem permissão para vinculá-lo.',
            HttpStatus.CONFLICT
          );
        }
      } else {
        throw new HttpException('Falha ao processar usuário', HttpStatus.BAD_REQUEST);
      }
    }

    // --- PASSO 2: VINCULAR À CONTA ---
    try {
      this.logger.log(`[PASSO 3] Vinculando ID ${userId} à conta ${data.accountId}`);
      await lastValueFrom(
        this.httpService.post(
          `${apiUrl}/accounts/${data.accountId}/account_users`,
          { user_id: userId, role: 'administrator' },
          { headers: { api_access_token: token } },
        ),
      );

      // --- PASSO 4: NOTIFICAÇÕES ---
      const linkAcesso = 'https://chat.hotmobile.com.br';
      
      this.logger.log(`[PASSO 4] Disparando notificações para ${data.email}`);
      
      // WhatsApp (Tratamos erros individualmente para não quebrar o fluxo)
      try {
        await this.whatsappService.enviarMensagem(telefone, `Olá *${empresa}*! Sua conta Hotmobile está pronta. Acesse: ${linkAcesso}`);
      } catch (e) { this.logger.error('Falha ao enviar WhatsApp'); }

      // Mailchimp
      try {
        await this.mailService.enviarMailChimp(data.email, '🚀 Sua conta Hotmobile está pronta!', `Login: ${data.email}`, linkAcesso);
      } catch (e) { this.logger.error('Falha ao enviar Mailchimp'); }

      return { success: true, userId };

    } catch (error) {
      const errorData = error.response?.data;
      // Se o erro for que o usuário já é admin da conta, consideramos sucesso
      if (JSON.stringify(errorData).includes('already exists')) {
        this.logger.log('Usuário já era administrador desta conta.');
        return { success: true, userId };
      }
      
      this.logger.error('Erro no vínculo final', errorData);
      throw new HttpException('Erro ao vincular usuário à conta master.', HttpStatus.BAD_REQUEST);
    }
  }
}