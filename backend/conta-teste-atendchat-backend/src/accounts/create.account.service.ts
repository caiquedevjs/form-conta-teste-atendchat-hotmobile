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

  private async findUserIdByEmail(email: string, page = 1): Promise<number | null> {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    try {
      const response = await lastValueFrom(
        this.httpService.get(`${apiUrl}/users`, {
          params: { page },
          headers: { api_access_token: token },
        })
      );

      const users = response.data;
      if (!users || users.length === 0) return null;

      const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (found) return found.id;

      if (users.length === 25) {
        return await this.findUserIdByEmail(email, page + 1);
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao listar usuários na página ${page}`, error.message);
      return null;
    }
  }

  async createChatwootUser(data: CreateUserDto, empresa: string, telefone: string) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    let userId: number | null = null;

    // --- PASSO 1: TENTAR CRIAR OU LOCALIZAR ---
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
        this.logger.warn(`Conflito: E-mail ${data.email} já existe. Iniciando busca...`);
        userId = await this.findUserIdByEmail(data.email);

        if (!userId) {
          throw new HttpException('E-mail já existe mas não foi localizado.', HttpStatus.CONFLICT);
        }
      } else {
        throw new HttpException('Falha ao processar criação de usuário.', HttpStatus.BAD_REQUEST);
      }
    }

    // Validação de segurança para o TypeScript
    if (userId === null) {
      throw new HttpException('ID do usuário não definido.', HttpStatus.INTERNAL_SERVER_ERROR);
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

      // --- PASSO 3: NOTIFICAÇÕES COM CREDENCIAIS ---
      const linkAcesso = 'https://chat.hotmobile.com.br';
      
      // WhatsApp formatado
      const mensagemWhatsapp = 
        `Olá *${empresa}*! 👋\n\n` +
        `Sua conta na plataforma *Hotmobile* foi configurada com sucesso!\n\n` +
        `🔐 *Credenciais de acesso:*\n` +
        `📧 *Login:* ${data.email}\n` +
        `🔑 *Senha:* ${data.password}\n\n` +
        `🔗 *Acesse agora:* ${linkAcesso}`;

      try {
        await this.whatsappService.enviarMensagem(telefone, mensagemWhatsapp);
        this.logger.log('WhatsApp enviado.');
      } catch (e) { this.logger.error('Erro WhatsApp'); }

      // E-mail formatado
      const mensagemEmail = 
        `Sua conta foi configurada com sucesso. Utilize os dados abaixo para acessar:\n\n` +
        `Login: ${data.email}\n` +
        `Senha: ${data.password}`;

      try {
        await this.mailService.enviarMailChimp(
          data.email, 
          '🚀 Sua conta Hotmobile está pronta!', 
          mensagemEmail, 
          linkAcesso
        );
        this.logger.log('E-mail enviado.');
      } catch (e) { this.logger.error('Erro Mailchimp'); }

      return { success: true, userId };

    } catch (error) {
      const errorData = JSON.stringify(error.response?.data || '');
      if (errorData.includes('already exists') || errorData.includes('taken')) {
        return { success: true, userId };
      }
      throw new HttpException('Erro ao vincular usuário à conta.', HttpStatus.BAD_REQUEST);
    }
  }
}