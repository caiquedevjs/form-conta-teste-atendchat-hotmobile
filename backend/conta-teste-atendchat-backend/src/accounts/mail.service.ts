import { Injectable, Logger, OnModuleInit } from '@nestjs/common'; // Importe OnModuleInit aqui
import { HttpService } from '@nestjs/axios';
import * as mailchimpFactory from '@mailchimp/mailchimp_transactional';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private mailchimp: any;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  // Esse método roda assim que o sistema inicia
  async onModuleInit() {
    // ⚠️ Troque pela sua chave real ou use process.env.MAILCHIMP_KEY
    const apiKey = this.configService.get<string>('MAILCHIMP_API_KEY')
    this.mailchimp = mailchimpFactory(apiKey);
    
    try {
      const response = await this.mailchimp.users.ping();
      this.logger.log(`🚀 Conexão com Mailchimp estabelecida: ${response}`);
    } catch (error) {
      this.logger.error('❌ Falha ao conectar no Mailchimp', error.message);
    }
  }

  async enviarMailChimp(emailDestino: string, assunto: string, mensagem: string, linkAcao?: string) {
    const corpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1976d2;">Olá!</h2>
        <p style="font-size: 16px;">${mensagem}</p>
        
        ${linkAcao ? `
        <div style="margin: 30px 0;">
          <a href="${linkAcao}" style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Acessar Minha Conta
          </a>
        </div>
        ` : ''}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    try {
      this.logger.debug(`📧 Enviando Mailchimp HTML para: ${emailDestino}`);

      const response = await this.mailchimp.messages.send({
        message: {
          from_email: "contato@hotmobile.com.br",
          from_name: "Suporte Hotmobile",
          subject: assunto,
          html: corpoHtml,
          to: [{ email: emailDestino, type: 'to' }]
        }
      });

      this.logger.log(`✅ E-mail enviado com sucesso para ${emailDestino}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao disparar Mailchimp: ${error.message}`);
      throw error;
    }
  }
}