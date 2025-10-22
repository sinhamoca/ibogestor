const db = require('../db');

class DnsModel {
  // Listar todos os DNS
  static getAll(apenasAtivos = false) {
    let query = 'SELECT * FROM dns';
    
    if (apenasAtivos) {
      query += ' WHERE ativo = 1';
    }
    
    query += ' ORDER BY nome';
    
    const stmt = db.prepare(query);
    return stmt.all();
  }

  // Buscar DNS por ID
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM dns WHERE id = ?');
    return stmt.get(id);
  }

  // Criar novo DNS
  static create(data) {
    const { nome, url, descricao = '', ativo = 1 } = data;

    const stmt = db.prepare(`
      INSERT INTO dns (nome, url, descricao, ativo)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(nome, url, descricao, ativo);
    return this.getById(result.lastInsertRowid);
  }

  // Atualizar DNS
  static update(id, data) {
    const { nome, url, descricao, ativo } = data;

    const stmt = db.prepare(`
      UPDATE dns
      SET nome = ?,
          url = ?,
          descricao = ?,
          ativo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(nome, url, descricao, ativo, id);
    return this.getById(id);
  }

  // Deletar DNS
  static delete(id) {
    const stmt = db.prepare('DELETE FROM dns WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Buscar por URL
  static getByUrl(url) {
    const stmt = db.prepare('SELECT * FROM dns WHERE url = ?');
    return stmt.get(url);
  }

  // Verificar se URL existe
  static exists(url, excludeId = null) {
    let stmt;
    if (excludeId) {
      stmt = db.prepare('SELECT id FROM dns WHERE url = ? AND id != ?');
      return stmt.get(url, excludeId) !== undefined;
    } else {
      stmt = db.prepare('SELECT id FROM dns WHERE url = ?');
      return stmt.get(url) !== undefined;
    }
  }

  // Ativar/Desativar DNS
  static toggleAtivo(id) {
    const dns = this.getById(id);
    if (!dns) return null;

    const novoStatus = dns.ativo === 1 ? 0 : 1;
    const stmt = db.prepare('UPDATE dns SET ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(novoStatus, id);

    return this.getById(id);
  }

  // Extrair domínio base de uma URL completa
  static extractBaseDomain(fullUrl) {
    try {
      const url = new URL(fullUrl);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      return null;
    }
  }

  // Substituir domínio em URL
  static replaceDomain(fullUrl, newBaseDomain) {
    try {
      const url = new URL(fullUrl);
      const newUrl = new URL(newBaseDomain);
      
      // Manter protocolo, path e query da URL original
      // Substituir apenas o host
      return `${newUrl.protocol}//${newUrl.host}${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
      return null;
    }
  }
}

module.exports = DnsModel;
