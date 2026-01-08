import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// DICA: Se a imagem estiver na pasta 'src', importe ela assim:
// import logoAtendChat from '../assets/logo.png'; 
// E use src={logoAtendChat} no componente abaixo.

function FormHeader() {
  return (
    <Box sx={{ mb: 4, textAlign: 'center' }}>
      
      {/* --- ÁREA DA LOGO --- */}
      <Box
        component="img"
        src="/Logo_ATENDCHAT__2_-removebg-preview.png" // <--- ALTERE AQUI para o caminho da sua imagem
        alt="Logo AtendChat"
        sx={{
          height: 300,       // Define a altura (ajuste conforme necessário)
          width: 'auto',    // Mantém a proporção da imagem
          mb: 0.5,            // Margem inferior para separar do título
          mx: 'auto',       // Garante centralização horizontal
          display: 'block'  // Remove comportamento inline indesejado
        }}
      />

      {/* Título Principal */}
      <Typography 
        variant="h4" 
        component="h1" 
        color='#1a202c'
        sx={{ fontWeight: 600, mb: 1 }}
      >
        Formulário de Conta Teste
      </Typography>

      {/* Subtítulo opcional para instrução */}
      <Typography variant="body1" color="text.secondary">
        Preencha os dados abaixo para criar sua conta.
      </Typography>
    </Box>
  );
}

export default FormHeader;