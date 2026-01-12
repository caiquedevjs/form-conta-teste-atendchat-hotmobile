/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  // DICA: O ideal seria mover essas credenciais para o .env no futuro
  private apiUrl = 'https://api.hotmobile.com.br/Whatsapp/EnviarMensagem';
  private apiUser = 'caique.menezes@hotmobile.com.br';
  private apiPass = 'OCai123@';
  private instanciaId = 10;

  constructor(private readonly httpService: HttpService) {}

  // Método para enviar para um número específico
  async enviarNotificacaoAdmin(mensagem: string) {
    // Defina aqui o número que receberá o aviso (Ex: Seu número ou do Gerente)
    // Pode vir do .env também: process.env.ADMIN_WHATSAPP_NUMBER
    const numeroAdmin = '120363419466650313'; // <--- COLOQUE O NÚMERO DE DESTINO AQUI

    return this.enviarMensagemBase(numeroAdmin, mensagem);
  }

  async enviarMensagem(telefone: string, mensagem: string) {
    return this.enviarMensagemBase(telefone, mensagem);
  }

  private async enviarMensagemBase(telefone: string, texto: string) {
    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) {
      numeroLimpo = '55' + numeroLimpo;
    }

    const payload = {
      mensagem: texto,
      instanciaId: this.instanciaId,
      listNumeros: [{ numero: numeroLimpo }],
    };

    try {
      this.logger.debug(`📞 Enviando Zap para ${numeroLimpo}...`);

      // Basic Auth Header Manualmente construído ou via config do Axios
      // A API da Hotmobile parece usar Basic Auth padrão
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          auth: {
            username: this.apiUser,
            password: this.apiPass,
          },
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      this.logger.log(`✅ WhatsApp enviado! Status: ${response.status}`);
    } catch (error) {
      this.logger.error(`❌ Erro Zap: ${error.message}`, error.response?.data);
    }
  }
}
