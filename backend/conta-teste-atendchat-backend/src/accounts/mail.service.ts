import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly API_URL = 'https://api.hotmobile.com.br/Email/EnviarEmailChamados';

  constructor(private readonly httpService: HttpService) {}

  async enviarNotificacaoGenerica(emailDestino: string, assunto: string, mensagem: string, linkAcao?: string) {
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

    const payload = {
      html: corpoHtml,
      dataEnvio: new Date().toISOString(),
      agendada: false,
      quemMandaNome: "Suporte Hotmobile",
      quemMandaEmail: "caique.menezes@hotmobile.com.br",
      assuntoEmail: assunto,
      listEmails: [{ email: emailDestino }]
    };

    try {
      this.logger.debug(`📧 Disparando e-mail para: ${emailDestino}`);
      const response = await firstValueFrom(
        this.httpService.post(this.API_URL, payload)
      );
      this.logger.log(`✅ E-mail enviado com sucesso para ${emailDestino}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar e-mail: ${error.message}`, error.response?.data);
    }
  }
}