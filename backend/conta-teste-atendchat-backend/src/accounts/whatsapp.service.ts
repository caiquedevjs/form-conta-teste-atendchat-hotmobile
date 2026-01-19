import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async enviarMensagem(telefone: string, texto: string) {
    const apiUrl = this.configService.getOrThrow<string>('HOTMOBILE_API_URL');
    const user = this.configService.getOrThrow<string>('HOTMOBILE_API_USER');
    const pass = this.configService.getOrThrow<string>('HOTMOBILE_API_PASS');
    const instanciaId = Number(this.configService.getOrThrow<string>('HOTMOBILE_INSTANCIA_ID'));

    // Limpa o número e garante o prefixo do Brasil (55)
    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) {
      numeroLimpo = '55' + numeroLimpo;
    }

    const payload = {
      mensagem: texto,
      instanciaId: instanciaId,
      listNumeros: [{ numero: numeroLimpo }]
    };

    try {
      this.logger.debug(`📞 Enviando WhatsApp para ${numeroLimpo}...`);
      
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, payload, {
          auth: { username: user, password: pass },
          headers: { 'Content-Type': 'application/json' },
        })
      );

      this.logger.log(`✅ WhatsApp enviado com sucesso! Status: ${response.status}`);
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar WhatsApp: ${error.message}`, error.response?.data);
      // Não lançamos erro aqui para não travar o fluxo principal de criação de conta
    }
  }
}