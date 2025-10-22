const db = require('../db');

// Adicionar coluna playlists_snapshot à tabela clientes
try {
  console.log('📦 Executando migration: adicionar playlists_snapshot...');
  
  db.exec(`
    ALTER TABLE clientes 
    ADD COLUMN playlists_snapshot TEXT DEFAULT NULL
  `);
  
  console.log('✅ Migration executada com sucesso!');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️  Coluna playlists_snapshot já existe, pulando migration.');
  } else {
    console.error('❌ Erro na migration:', error.message);
  }
}
