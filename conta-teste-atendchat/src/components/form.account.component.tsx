import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse'; // <--- Para animação de abrir/fechar
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícone de sucesso

function FormFlowAccountUser() {

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 = Conta, 1 = Usuário
  const [createdAccountId, setCreatedAccountId] = useState<number | null>(null); // Guarda o ID da conta criada

  // Estado ÚNICO para tudo (Conta + Usuário)
  const [formData, setFormData] = useState({
    // DADOS DA CONTA
    empresa: '',
    mail: '', // Será usado como email da conta E do usuário admin
    responsavel: '',
    telefone: '',
    celular: '',
    CpfCnpj: '',
    estado: '',
    cidade: '',
    
    // DADOS DO USUÁRIO (Novo)
    password: '',
    confirmPassword: ''
  });

  const fieldNames: any = {
    empresa: 'Empresa',
    mail: 'E-mail',
    responsavel: 'Responsável',
    telefone: 'Telefone',
    celular: 'Celular',
    CpfCnpj: 'CPF/CNPJ',
    estado: 'Estado',
    cidade: 'Cidade',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha'
  };

  // --- MÁSCARAS (Mantive as mesmas) ---
  const phoneMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value;
  };

  const cpfCnpjMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = event.target;

    if (name === 'telefone' || name === 'celular') value = phoneMask(value);
    if (name === 'CpfCnpj') value = cpfCnpjMask(value);
    if (name === 'mail') value = value.trim();

    if (name === 'CpfCnpj' && value.length > 18) return;
    if ((name === 'telefone' || name === 'celular') && value.length > 15) return;

    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // --- LÓGICA DO PASSO 1: CRIAR CONTA (VIA NESTJS) ---
  const handleCreateAccount = async () => {
    // 1. Validação do Passo 1
    const requiredStep1 = ['empresa', 'mail', 'responsavel', 'telefone', 'celular', 'CpfCnpj', 'estado', 'cidade'];
    // Usamos 'as keyof typeof formData' para o TypeScript não reclamar
    const emptyFields = requiredStep1.filter(key => !formData[key as keyof typeof formData]);

    if (emptyFields.length > 0) {
      const missingNames = emptyFields.map(key => fieldNames[key]).join(', ');
      toast.warn(`Preencha: ${missingNames}`);
      return;
    }

    setLoading(true);

    // 2. PREPARA O PAYLOAD PARA O NESTJS
    // Note que agora enviamos os nomes que definimos no DTO do NestJS
    // Não precisa mais converter para 'domain', 'locale', etc. O Back faz isso.
    const nestPayload = {
      empresa: formData.empresa,
      mail: formData.mail,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      // Se quiser passar limites personalizados, passe aqui:
      // limitAgents: 5
    };

    try {
      // 3. CHAMA O SEU BACKEND (NESTJS)
      const response = await fetch('http://localhost:3000/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // REMOVIDO: 'api_access_token' (Segurança total!)
        },
        body: JSON.stringify(nestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Conta criada via NestJS. ID:", data.id);
        
        setCreatedAccountId(data.id); // Salva o ID retornado pelo Nest->Hotmobile
        setActiveStep(1); // Avança para a etapa de criar usuário
        toast.success("Conta criada! Agora defina a senha de acesso.");
        
      } else {
        // Tratamento de erro vindo do NestJS
        const error = await response.json();
        // O Nest costuma devolver { message: "...", statusCode: ... }
        toast.error("Erro: " + (error.message || "Falha ao criar conta."));
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão com o Backend local.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DO PASSO 2: CRIAR USUÁRIO E VINCULAR ---
  const handleCreateUser = async () => {
    // 1. Validações (Mantidas)
    if (!formData.password || !formData.confirmPassword) {
      toast.warn("Defina e confirme a senha.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (!createdAccountId) {
      toast.error("ID da conta não encontrado. Recarregue a página.");
      return;
    }

    setLoading(true);

    // 2. Payload Ajustado (Sem role, pois isso é no próximo passo)
    const userPayload = {
        accountId: createdAccountId,
        name: formData.responsavel,
        email: formData.mail,
        password: formData.password
        // role: "administrator" <--- REMOVIDO (Isso vai no Passo 3)
    };

    try {
      // Chama a mesma rota de antes, mas agora o Backend faz o serviço completo
      const response = await fetch('http://localhost:3000/account/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
      });

      if (response.ok) {
        // SUCESSO TOTAL!
        toast.success("Conta e Usuário Admin configurados!");
        toast.info("Você já pode fazer login.");
        
       
        
      } else {
        const error = await response.json();
        toast.error("Erro: " + (error.message || "Falha ao finalizar cadastro."));
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <ToastContainer />

      {/* --- PASSO 1: DADOS DA CONTA (Sempre visível, mas desabilita após sucesso) --- */}
      <Box
        component="form"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          '& .MuiTextField-root': { width: '100%' },
          opacity: activeStep === 1 ? 0.7 : 1, // Fica meio transparente quando termina
          pointerEvents: activeStep === 1 ? 'none' : 'auto' // Impede edição após sucesso
        }}
        noValidate
        autoComplete="off"
      >
        <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" color="primary">1. Dados da Empresa</Typography>
          {activeStep === 1 && <CheckCircleIcon color="success" />} {/* Ícone de check quando completa */}
        </Box>

        <TextField name="empresa" value={formData.empresa} onChange={handleChange} label="Empresa" required />
        <TextField name="mail" value={formData.mail} onChange={handleChange} label="E-mail (Login)" type="email" required />
        <TextField name="responsavel" value={formData.responsavel} onChange={handleChange} label="Responsável" required />
        <TextField name="telefone" value={formData.telefone} onChange={handleChange} label="Telefone" required />
        <TextField name="celular" value={formData.celular} onChange={handleChange} label="Celular" required />
        <TextField name="CpfCnpj" value={formData.CpfCnpj} onChange={handleChange} label="CPF/CNPJ" required />
        <TextField name="estado" value={formData.estado} onChange={handleChange} label="Estado" required />
        <TextField name="cidade" value={formData.cidade} onChange={handleChange} label="Cidade" required />

        {/* Botão do Passo 1: Só aparece se estiver na etapa 0 */}
        {activeStep === 0 && (
            <Button 
                onClick={handleCreateAccount}
                disabled={loading}
                variant="contained" 
                size="large"
                sx={{ gridColumn: '1 / -1', mt: 2, py: 1.5, fontWeight: 'bold' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'CRIAR CONTA & CONTINUAR'}
            </Button>
        )}
      </Box>

      {/* --- DIVISÓRIA --- */}
      <Box sx={{ py: 3 }}>
        <Divider />
      </Box>

      {/* --- PASSO 2: DADOS DO USUÁRIO (Escondido inicialmente) --- */}
      <Collapse in={activeStep === 1}>
        <Box
            component="form"
            sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            bgcolor: 'action.hover', // Fundo levemente cinza para destacar
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiTextField-root': { width: '100%' }
            }}
        >
            <Box sx={{ gridColumn: '1 / -1', mb: 1 }}>
                <Typography variant="h6" color="primary">2. Definição de Acesso (Admin)</Typography>
                <Typography variant="body2" color="text.secondary">
                    Conta <strong>{formData.empresa}</strong> criada! Agora defina a senha para <strong>{formData.mail}</strong>.
                </Typography>
            </Box>

            <TextField 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                label="Senha de Acesso" 
                type="password" 
                required 
            />
            <TextField 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                label="Confirmar Senha" 
                type="password" 
                required 
            />

            <Button 
                onClick={handleCreateUser}
                disabled={loading}
                variant="contained" 
                color="success" // Botão Verde para finalizar
                size="large"
                sx={{ gridColumn: '1 / -1', mt: 2, py: 1.5, fontWeight: 'bold' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'FINALIZAR CADASTRO'}
            </Button>
        </Box>
      </Collapse>
      
      {/* Footer com Aviso Legal */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
            Ao clicar em Finalizar, você aceita os Termos de Uso.
        </Typography>
      </Box>

    </Box>
  );
}

export default FormFlowAccountUser;