import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAccountDto } from './dto/create.account.dto';
import { lastValueFrom } from 'rxjs';


@Injectable()
export class createAccountService{

    private readonly logger = new Logger(createAccountService.name);
    constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async createChatWhootAccount( data: CreateAccountDto){
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');


    const agentsLimit = data.LimitAgents || 7;
    const inboxesLimit = data.LimitInboxes || 1;
  
    const payload = {
      name: data.empresa,
      locale: 'pt_BR',
      domain: data.mail,        // Usando e-mail como domínio (regra que você definiu)
      support_email: data.mail,
      status: 'active',
      limits: {
        agents: agentsLimit,
        inboxes: inboxesLimit,
      },
    };

    try {
      this.logger.log(`Criando conta na Hotmobile: ${data.empresa}`);

      // 3. Chamada HTTP POST
      const { data: responseData } = await lastValueFrom(
        this.httpService.post('https://chat.hotmobile.com.br/platform/api/v1/accounts', payload, {
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': '8pXDvT6pXRpvp54U2ZzqvfYV', // O segredo fica aqui!
          },
        }),
      );

      this.logger.log(`Conta criada com sucesso! ID: ${responseData.id}`);
      
      // Retorna os dados da conta criada (O front precisa do ID)
      return responseData;

    } catch (error) {
      // --- ADICIONE ESTAS LINHAS PARA DEBUGAR ---
      console.log('--- DETALHES DO ERRO ---');
      console.log('Status:', error.response?.status);
      console.log('Mensagem da Hotmobile:', JSON.stringify(error.response?.data, null, 2));
      console.log('--------------------------');
      this.logger.error('Erro ao criar conta na Hotmobile', error.response?.data);

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Falha ao criar conta na plataforma externa',
          details: error.response?.data || error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}




