import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';

// Seus componentes
import FormPropsTextFields from "../components/form.account.component";
import FormHeader from "../components/header.component";
import Footer from "../components/footer.componente"; // Cuidado com o typo no nome do arquivo original

function FormView() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh', // Garante que a página ocupe 100% da altura da tela
        bgcolor: '#f5f5f5', // Fundo cinza claro para dar destaque
      }}
    >
      <CssBaseline /> {/* Normaliza o CSS do navegador */}

      {/* ÁREA PRINCIPAL (Header + Form) */}
      <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4, flexGrow: 1 }}>
        
        {/* Header solto acima do cartão */}
        <FormHeader />

        {/* Cartão Branco envolvendo o Formulário */}
        <Paper 
            elevation={3} 
            sx={{ 
                p: { xs: 2, md: 4 }, // Padding menor em celular, maior em PC
                borderRadius: 2,
                mt: 4 // Espaço entre o Header e o Form
            }}
        >
            <FormPropsTextFields />
        </Paper>

      </Container>

      {/* FOOTER */}
      {/* Como o container principal tem flex-direction column, o footer fica abaixo */}
      <Footer />
      
    </Box>
  );
}

export default FormView;