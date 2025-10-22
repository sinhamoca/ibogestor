const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório existe
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'playlists.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabelas
function initDatabase() {
  // Tabela de Grupos
  db.exec(`
    CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de DNS
  db.exec(`
    CREATE TABLE IF NOT EXISTS dns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir DNS padrão se não existirem
  const dnsPadrao = [
    { nome: 'Popo65', url: 'https://popo65.live', descricao: 'DNS Principal' },
    { nome: 'DT303', url: 'https://dt303.com', descricao: 'DNS Alternativo' }
  ];

  const insertDns = db.prepare(`
    INSERT OR IGNORE INTO dns (nome, url, descricao) 
    VALUES (?, ?, ?)
  `);

  dnsPadrao.forEach(d => {
    insertDns.run(d.nome, d.url, d.descricao);
  });

  // Tabela de Domínios IBOPlayer
  db.exec(`
    CREATE TABLE IF NOT EXISTS dominios_iboplayer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      dominio TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir domínios padrão se não existirem
  const dominiosPadrao = [
    { nome: 'IBOPlayer', dominio: 'iboplayer.com' },
    { nome: 'BOBPlayer', dominio: 'bobplayer.com' },
    { nome: 'IBOPlayer Pro', dominio: 'iboplayer.pro' }
  ];

  const insertDominio = db.prepare(`
    INSERT OR IGNORE INTO dominios_iboplayer (nome, dominio) 
    VALUES (?, ?)
  `);

  dominiosPadrao.forEach(d => {
    insertDominio.run(d.nome, d.dominio);
  });

  // Tabela de Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      mac TEXT NOT NULL,
      device_key TEXT,
      password TEXT,
      grupo_id INTEGER,
      aplicativo TEXT NOT NULL CHECK(aplicativo IN ('iboplayer', 'ibopro', 'vuplayer')),
      dominio TEXT,
      ativo INTEGER DEFAULT 1,
      ultima_sincronizacao DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL,
      UNIQUE(mac, aplicativo, dominio)
    )
  `);

  // Índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clientes_grupo ON clientes(grupo_id);
    CREATE INDEX IF NOT EXISTS idx_clientes_aplicativo ON clientes(aplicativo);
    CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
  `);

  // Tabela de Configurações
  db.exec(`
    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT,
      descricao TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir configuração padrão do 2Captcha
  db.prepare(`
    INSERT OR IGNORE INTO configs (key, value, descricao) 
    VALUES ('2captcha_api_key', '', 'API Key do 2Captcha para resolver captchas')
  `).run();

  // Tabela de Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      acao TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('sucesso', 'erro', 'pendente')),
      mensagem TEXT,
      detalhes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `);

  // Índice para logs
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_logs_cliente ON logs(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_logs_status ON logs(status);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);
  `);

  console.log('✅ Banco de dados inicializado com sucesso!');
}

// Inicializar ao carregar
initDatabase();

// Exportar conexão
module.exports = db;
