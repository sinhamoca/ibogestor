const db = require('../db');

class ConfigsModel {
  // Buscar todas as configurações
  static getAll() {
    const stmt = db.prepare('SELECT * FROM configs ORDER BY key');
    return stmt.all();
  }

  // Buscar configuração por chave
  static get(key) {
    const stmt = db.prepare('SELECT * FROM configs WHERE key = ?');
    return stmt.get(key);
  }

  // Buscar apenas o valor
  static getValue(key) {
    const config = this.get(key);
    return config ? config.value : null;
  }

  // Salvar/Atualizar configuração
  static set(key, value, descricao = null) {
    const stmt = db.prepare(`
      INSERT INTO configs (key, value, descricao, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(key, value, descricao);
    return this.get(key);
  }

  // Deletar configuração
  static delete(key) {
    const stmt = db.prepare('DELETE FROM configs WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  // Obter API Key do 2Captcha
  static get2CaptchaKey() {
    return this.getValue('2captcha_api_key');
  }

  // Salvar API Key do 2Captcha
  static set2CaptchaKey(apiKey) {
    return this.set('2captcha_api_key', apiKey, 'API Key do 2Captcha para resolver captchas');
  }
}

module.exports = ConfigsModel;
