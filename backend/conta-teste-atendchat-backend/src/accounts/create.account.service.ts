/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateAccountDto } from './dto/create.account.dto';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create.user.dto';

@Injectable()
export class createAccountService {
  private readonly logger = new Logger(createAccountService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
    };

    try {
      this.logger.log(`Criando conta na Hotmobile: ${data.empresa}`);

      const { data: responseData } = await lastValueFrom(
         
        this.httpService.post(
          `${apiUrl}/accounts`,
          payload,
          {
          headers: {
            'Content-Type': 'application/json',
            api_access_token: `${token}`, // O segredo fica aqui!
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
      console.log(
        'Mensagem da Hotmobile:',
        JSON.stringify(error.response?.data, null, 2),
      );
      console.log('--------------------------');
      this.logger.error(
        'Erro ao criar conta na Hotmobile',
        error.response?.data,
      );

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

 async createChatwootUser(data: CreateUserDto) {
    const apiUrl = this.configService.get<string>('CHATWOOT_API_URL');
    const token = this.configService.get<string>('CHATWOOT_ACCESS_TOKEN');

    // 1. PRIMEIRO: CRIAR O USUÁRIO
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
      this.logger.log(`Usuário criado com sucesso! ID: ${userId}`);

    } catch (error) {
      // Se der erro aqui, paramos tudo
      this.logger.error('Erro ao criar usuário', error.response?.data);
      
      if (error.response?.status === 422) {
         throw new HttpException('Este e-mail já existe no sistema.', HttpStatus.CONFLICT);
      }
      throw new HttpException('Falha ao criar usuário', HttpStatus.BAD_REQUEST);
    }

    // 2. SEGUNDO: VINCULAR USUÁRIO À CONTA (COMO ADMINISTRADOR)
    try {
      this.logger.log(`Vinculando usuário ${userId} à conta ${data.accountId} como ADMIN...`);

      const linkPayload = {
        user_id: userId,
        role: 'administrator' // <--- AQUI DEFINIMOS O PODER DELE
      };

      await lastValueFrom(
        this.httpService.post(`${apiUrl}/accounts/${data.accountId}/account_users`, linkPayload, {
          headers: { 'api_access_token': token },
        }),
      );

      this.logger.log(`Vínculo realizado com sucesso!`);

      // Retorna os dados do usuário com uma mensagem de sucesso
      return {
        success: true,
        message: 'Usuário criado e vinculado como admin!',
        user: { id: userId, email: data.email }
      };

    } catch (error) {
      this.logger.error('Erro ao vincular usuário na conta', error.response?.data);
      // Mesmo se o vínculo falhar, o usuário foi criado. 
      // Em produção, você talvez queira deletar o usuário (rollback) ou apenas avisar.
      throw new HttpException('Usuário criado, mas falha ao vincular na conta.', HttpStatus.PARTIAL_CONTENT);
    }
  }
}
