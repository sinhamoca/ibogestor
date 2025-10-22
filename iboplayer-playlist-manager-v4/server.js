const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Inicializar banco de dados
require('./database/db');

// Importar rotas
const gruposRoutes = require('./routes/grupos');
const clientesRoutes = require('./routes/clientes');
const configRoutes = require('./routes/config');
const dominiosRoutes = require('./routes/dominios');
const dnsRoutes = require('./routes/dns');
const logsRoutes = require('./routes/logs');
const acoesRoutes = require('./routes/acoes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/grupos', gruposRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dominios', dominiosRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/acoes', acoesRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Rota raiz - Servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint não encontrado' 
  });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Servidor iniciado com sucesso!');
  console.log('='.repeat(50));
  console.log(`📡 API rodando em: http://localhost:${PORT}`);
  console.log(`🌐 Frontend disponível em: http://localhost:${PORT}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('\n📋 Endpoints disponíveis:');
  console.log('  GET  /api/health              - Health check');
  console.log('  GET  /api/grupos              - Listar grupos');
  console.log('  GET  /api/clientes            - Listar clientes');
  console.log('  GET  /api/dominios            - Listar domínios');
  console.log('  GET  /api/config              - Configurações');
  console.log('  GET  /api/logs                - Logs do sistema');
  console.log('  POST /api/acoes/:id/login     - Fazer login');
  console.log('  GET  /api/acoes/:id/playlists - Listar playlists');
  console.log('\n✅ Pronto para receber requisições!\n');
});

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Encerrando servidor...');
  process.exit(0);
});
