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

  /**
   * 1. CRIA A CONTA MASTER NA PLATAFORMA
   */
  async createChatWhootAccount(data: CreateAccountDto) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL'); // URL da Platform API
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    const payload = {
      name: data.empresa,
      locale: 'pt_BR',
      domain: data.mail,
      support_email: data.mail,
      status: 'active',
    };

    try {
      this.logger.log(`Iniciando criação de conta Master para: ${data.empresa}`);
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/accounts`, payload, {
          headers: { api_access_token: token },
        }),
      );
      return responseData;
    } catch (error) {
      this.logger.error('Erro ao criar conta na plataforma Chatwoot', error.response?.data);
      throw new HttpException('Falha ao criar conta na plataforma externa', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 2. CRIA OU LOCALIZA O USUÁRIO E VINCULA À CONTA
   */
  async createChatwootUser(data: CreateUserDto, empresa: string, telefone: string) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    let userId: number;

    // --- PASSO 1: TENTAR CRIAR O USUÁRIO NA PLATAFORMA ---
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
      // Se o erro for 422, o usuário já existe na plataforma global
      if (error.response?.status === 422) {
        this.logger.warn(`Usuário ${data.email} já existe. Buscando ID existente...`);
        
        try {
          // BUSCAR USUÁRIO EXISTENTE PARA PEGAR O ID
          const { data: usersList } = await lastValueFrom(
            this.httpService.get(`${apiUrl}/users`, {
              headers: { api_access_token: token },
            })
          );
          
          const existingUser = usersList.find((u: any) => u.email === data.email);
          
          if (!existingUser) {
            throw new Error('Usuário não encontrado na lista apesar do erro 422');
          }
          
          userId = existingUser.id;
          this.logger.log(`ID do usuário existente localizado: ${userId}`);
        } catch (searchError) {
          this.logger.error('Não foi possível localizar o usuário existente', searchError.message);
          throw new HttpException('Usuário já existe, mas não foi possível vincular.', HttpStatus.CONFLICT);
        }
      } else {
        throw new HttpException('Falha ao criar usuário na plataforma', HttpStatus.BAD_REQUEST);
      }
    }

    // --- PASSO 2: VINCULAR O USUÁRIO À CONTA ESPECÍFICA ---
    try {
      this.logger.log(`Vinculando usuário ID ${userId} na conta ${data.accountId}...`);
      
      await lastValueFrom(
        this.httpService.post(
          `${apiUrl}/accounts/${data.accountId}/account_users`,
          { user_id: userId, role: 'administrator' },
          { headers: { api_access_token: token } },
        ),
      );

      // --- PASSO 3: DISPARAR NOTIFICAÇÕES ---
      const linkAcesso = 'https://chat.hotmobile.com.br';
      
      // WhatsApp
      const msgZap = `Olá *${empresa}*! 👋\n\nSua conta na plataforma *Hotmobile* foi configurada com sucesso!\n\n📧 *Login:* ${data.email}\n🔐 *Senha:* (A definida no formulário)\n\n🔗 Acesse agora:\n${linkAcesso}`;
      await this.whatsappService.enviarMensagem(telefone, msgZap);

      // E-mail (Mailchimp)
      const assuntoEmail = '🚀 Sua conta Hotmobile está pronta!';
      const msgEmail = `Olá ${empresa}, sua conta foi configurada com sucesso. Você já pode acessar a plataforma utilizando o e-mail: ${data.email}.`;
      await this.mailService.enviarMailChimp(data.email, assuntoEmail, msgEmail, linkAcesso);

      this.logger.log(`✅ Processo concluído com sucesso para ${data.email}`);
      
      return {
        success: true,
        message: 'Conta ativada e notificações enviadas!',
        user: { id: userId, email: data.email },
      };
      
    } catch (error) {
      this.logger.error('Erro no vínculo ou notificações', error.response?.data);
      
      // Caso o erro de vínculo seja porque ele já é admin daquela conta específica
      if (error.response?.data?.message?.includes('already exists')) {
          return { success: true, message: 'Usuário já estava ativo nesta conta.' };
      }

      throw new HttpException('Erro ao finalizar o processo de ativação.', HttpStatus.BAD_REQUEST);
    }
  }
}