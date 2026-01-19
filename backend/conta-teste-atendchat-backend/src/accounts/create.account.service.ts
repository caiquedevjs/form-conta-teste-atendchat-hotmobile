/* eslint-disable prettier/prettier */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAccountDto } from './dto/create.account.dto';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create.user.dto';
// Importe os serviços de notificação
import { WhatsappService } from './whatsapp.service'; 
import { MailService } from './mail.service';

@Injectable()
export class createAccountService {
  private readonly logger = new Logger(createAccountService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly whatsappService: WhatsappService, // Injeção do Zap
    private readonly mailService: MailService,         // Injeção do Mail
  ) {}

  async createChatWhootAccount(data: CreateAccountDto) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    const agentsLimit = data.LimitAgents || 7;
    const inboxesLimit = data.LimitInboxes || 1;

    const payload = {
      name: data.empresa,
      locale: 'pt_BR',
      domain: data.mail,
      support_email: data.mail,
      status: 'active',
      limits: {
        agents: agentsLimit,
        inboxes: inboxesLimit,
      },
      features: {
        agent_bots: true,
        typebot_bots: true,
        agent_management: true,
        team_management: true,
        inbox_management: true,
        integrations: true,
        automations: true,
        custom_attributes: true,
        canned_responses: true,
        macros: true,
        reports: true,
        campaigns: true,
        crm: true,
        n8n_integration: true,
        asaas_integration: true,
        kanban: true,
        wavoip_integration: true,
        whatsapp_messaging_group: true,
        typebot_integration: true,
        rdstation_integration: true,
        groq_integration: true,
        perfex_integration: true,
        standalone_apps_integration: true,
        schedule_messages_integration: true,
        chatwoot_v4: true,
        account_open_ai_api_key_enabled: true,
        voice_recorder: true,
        help_center: true,
        disable_branding: true 
      },
    };

    try {
      this.logger.log(`Iniciando criação de conta Master para: ${data.empresa}`);
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/accounts`, payload, {
          headers: {
            'Content-Type': 'application/json',
            api_access_token: `${token}`,
          },
        }),
      );
      return responseData;
    } catch (error) {
      this.logger.error('Erro ao criar conta no Chatwoot', error.response?.data);
      throw new HttpException('Falha ao criar conta na plataforma externa', HttpStatus.BAD_REQUEST);
    }
  }

  async createChatwootUser(data: CreateUserDto, empresa: string, telefone: string) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    // 1. CRIAR O USUÁRIO
    const userPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
    };

    let userId: number;

    try {
      this.logger.log(`Criando usuário: ${data.email}`);
      const { data: userResponse } = await lastValueFrom(
        this.httpService.post(`${apiUrl}/users`, userPayload, {
          headers: { 'api_access_token': token },
        }),
      );
      userId = userResponse.id;
    } catch (error) {
      if (error.response?.status === 422) {
        throw new HttpException('Este e-mail já existe.', HttpStatus.CONFLICT);
      }
      throw new HttpException('Falha ao criar usuário', HttpStatus.BAD_REQUEST);
    }

    // 2. VINCULAR COMO ADMIN
    try {
      this.logger.log(`Vinculando admin ID ${userId} na conta ${data.accountId}...`);
      const linkPayload = { user_id: userId, role: 'administrator' };

      await lastValueFrom(
        this.httpService.post(
          `${apiUrl}/accounts/${data.accountId}/account_users`,
          linkPayload,
          { headers: { 'api_access_token': token } },
        ),
      );

      // --- 👇 3. DISPARAR NOTIFICAÇÕES APÓS O VÍNCULO ---
      
      const linkAcesso = 'https://chat.hotmobile.com.br';
      
      // Notificação WhatsApp
      const msgZap = `Olá *${empresa}*! 👋\n\nSua conta na plataforma *Hotmobile* foi configurada com sucesso!\n\n📧 *Login:* ${data.email}\n🔐 *Senha:* (A definida no formulário)\n\n🔗 Acesse agora:\n${linkAcesso}`;
      await this.whatsappService.enviarMensagem(telefone, msgZap);

      // Notificação E-mail
      const assuntoEmail = '🚀 Sua conta Hotmobile está pronta!';
      const msgEmail = `Olá ${empresa}, sua conta foi configurada com sucesso. Você já pode acessar a plataforma utilizando o e-mail: ${data.email}.`;
      await this.mailService.enviarNotificacaoGenerica(data.email, assuntoEmail, msgEmail, linkAcesso);

      return {
        success: true,
        message: 'Conta configurada e notificações enviadas!',
        user: { id: userId, email: data.email },
      };
      
    } catch (error) {
      this.logger.error('Erro no vínculo ou notificações', error.response?.data);
      throw new HttpException('Erro ao finalizar o processo de ativação.', HttpStatus.BAD_REQUEST);
    }
  }
}