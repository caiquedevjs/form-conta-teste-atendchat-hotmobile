import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid'; 
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

// Ícones
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a202c',
        color: 'white',
        py: 6,
        mt: 'auto',
        borderTop: '4px solid',
        borderColor: 'primary.main'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6}>
          
          {/* COLUNA 1: QUEM SOMOS */}
          <Grid item xs={12} md={4}>
            {/* Título forçado à Esquerda */}
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight="700" 
              color="primary.light"
              align="left" // <--- GARANTE ALINHAMENTO À ESQUERDA
            >
              Hotmobile Atendchat
            </Typography>
            
            {/* Texto Justificado */}
            <Typography 
              variant="body2" 
              sx={{ 
                lineHeight: 1.8, 
                color: 'grey.400',
                textAlign: 'justify', 
                display: 'block'
              }}
            >
              Somos uma empresa de comunicação integrada focada em trazer resultados para o seu negócio. 
              A Hotmobile nasceu com o intuito de levar criatividade, inovação e qualidade para que 
              os nossos clientes possam experimentar uma nova forma de se fazer marketing.
            </Typography>
          </Grid>

         {/* COLUNA 2: NAVEGAÇÃO */}
<Grid item xs={12} sm={6} md={4}>
  <Typography 
    variant="h6" 
    gutterBottom 
    fontWeight="700"
    align="left"
  >
    Navegação
  </Typography>
  
  <Stack spacing={1.5}>
    {/* ARRAY DE OBJETOS COM TÍTULO E URL */}
    {[
      { title: 'A Hotmobile', url: 'https://hotmobile.com.br/hot360/a-hotmobile/' },
      { title: 'Webteca - E-books grátis', url: 'https://hotmobile.com.br/hot360/webteca-solucoes-moveis/' },
      { title: 'Blog', url: 'https://hotmobile.com.br/hot360/blog-solucoes-moveis/' },
      { title: 'Agência Otmo', url: 'https://agenciaotmo.com.br/' },
      { title: 'Termos de Uso', url: 'https://hotmobile.com.br/hot360/termosdeuso/' },
      { title: 'Política de Privacidade', url: 'https://hotmobile.com.br/hot360/politicaprivacidade/' }
    ].map((item) => ( // Agora 'item' é o objeto inteiro
      <Link 
        key={item.title} 
        href={item.url} // <--- AQUI ENTRA O LINK DINÂMICO
        target ='_blank'
        underline="hover" 
        color="grey.400" 
        sx={{ 
          fontSize: '0.9rem', 
          width: 'fit-content',
          textAlign: 'left',
          transition: '0.2s',
          '&:hover': { color: 'primary.main' }
        }}
      >
        {item.title} {/* <--- O TEXTO DO LINK */}
      </Link>
    ))}
  </Stack>
</Grid>

          {/* COLUNA 3: ONDE ESTAMOS */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight="700"
              align="left" // <--- GARANTE ALINHAMENTO À ESQUERDA
            >
              Onde Estamos?
            </Typography>
            
            {/* Endereço */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <LocationOnIcon color="primary" sx={{ fontSize: 24, mt: 0.5 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'grey.400', 
                  lineHeight: 1.6,
                  textAlign: 'justify' 
                }}
              >
                Avenida Luiz Viana Filho, 6462, Paralela - Salvador, Bahia
              </Typography>
            </Box>

            {/* Telefones */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <PhoneIcon color="primary" sx={{ fontSize: 24, mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'grey.400', lineHeight: 1.6, display: 'block', textAlign: 'left' }}>
                  (71) 9 9999-8810
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', lineHeight: 1.6, display: 'block', textAlign: 'left' }}>
                  (71) 2200-0665
                </Typography>
              </Box>
            </Box>

            {/* Título Redes Sociais */}
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight="700" 
              sx={{ mt: 2, fontSize: '1rem' }}
              align="left" // <--- GARANTE ALINHAMENTO À ESQUERDA
            >
              Redes Sociais
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="flex-start"> {/* Garante ícones à esquerda */}
              <IconButton 
              component = 'a'
              href='https://www.facebook.com/hotmobilecomunicacao'
              target='blank'
               aria-label="facebook" 
               sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'primary.main' } }}>
                <FacebookIcon />
              </IconButton>
              
              <IconButton 
              component = 'a'
              href='https://www.instagram.com/hotmobile.sm/'
              target='blank'
              aria-label="instagram" 
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'primary.main' } }}>
                <InstagramIcon />

              </IconButton>
              <IconButton 
              component ='a'
              href='https://www.youtube.com/@hotmobile569'
              target='blank'
              aria-label="youtube" 
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'primary.main' } }}>
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>

        </Grid>

        {/* COPYRIGHT (Geralmente fica centralizado, mas se quiser à esquerda avise) */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.1)', mt: 6, pt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="grey.500">
            © {new Date().getFullYear()} Hotmobile Atendchat. Todos os direitos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;