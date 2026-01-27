import { Controller, Get, Query } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('test-mail')
export class TestMailController {
  constructor(private readonly mailService: MailService) {}

  @Get('send')
  async testEmail(@Query('to') to: string) {
    const destino = to || 'seu-email@gmail.com'; // Coloque seu e-mail aqui se não passar na URL
    const assunto = '🧪 Teste de Integração Hotmobile';
    const mensagem = 'Se você está lendo isso, o serviço MailService está funcionando fora do formulário!';
    const link = 'https://hotmobile.com.br';

    try {
      const result = await this.mailService.enviarMailChimp(destino, assunto, mensagem, link);
      return {
        status: 'Requisição aceita pelo Mailchimp',
        destinatario: destino,
        detalhes: result,
      };
    } catch (error) {
      return {
        status: 'Erro no disparo',
        erro: error.message,
      };
    }
  }
}