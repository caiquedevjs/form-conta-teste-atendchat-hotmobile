import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

// 1. Importamos a fábrica (factory) no topo do arquivo
const mailchimpFactory = require('@mailchimp/mailchimp_transactional');

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  
  // 2. Esta variável vai guardar a conexão pronta
  private mailchimp: any;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 3. Inicializamos a conexão assim que o módulo sobe
  async onModuleInit() {
    try {
      // Buscamos a chave do arquivo .env de forma segura
      const apiKey = this.configService.get<string>('MAILCHIMP_API_KEY');

      // Inicializamos o cliente do Mailchimp com a chave obtida
      this.mailchimp = mailchimpFactory(apiKey);

      // Fazemos o ping para validar se a chave está funcionando
      const response = await this.mailchimp.users.ping();
      this.logger.log(`🚀 Conexão com Mailchimp estabelecida com sucesso: ${response}`);
    } catch (error) {
      this.logger.error('❌ Falha crítica ao conectar no Mailchimp. Verifique a API Key no arquivo .env');
      this.logger.error(error.message);
    }
  }

  async enviarMailChimp(emailDestino: string, assunto: string, mensagem: string, linkAcao?: string) {
    // Definimos o corpo HTML do e-mail
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
        <p style="font-size: 12px; color: #888;">Se o botão não funcionar, copie este link: ${linkAcao}</p>
        ` : ''}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    try {
      this.logger.debug(`📧 Disparando e-mail via Mailchimp para: ${emailDestino}`);

      // Usamos a instância inicializada no onModuleInit
      const response = await this.mailchimp.messages.send({
        message: {
          from_email: "contato@enviaemail.com.br",
          from_name: "Suporte Hotmobile",
          subject: assunto,
          html: corpoHtml,
          to: [
            {
              email: emailDestino,
              type: 'to',
            },
          ],
        },
      });

      this.logger.log(`✅ E-mail enviado com sucesso para ${emailDestino}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar e-mail para ${emailDestino}: ${error.message}`);
      throw error;
    }
  }
}