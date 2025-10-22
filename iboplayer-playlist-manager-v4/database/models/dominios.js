const db = require('../db');

class DominiosModel {
  // Listar todos os domínios
  static getAll(apenasAtivos = false) {
    let query = 'SELECT * FROM dominios_iboplayer';
    
    if (apenasAtivos) {
      query += ' WHERE ativo = 1';
    }
    
    query += ' ORDER BY nome';
    
    const stmt = db.prepare(query);
    return stmt.all();
  }

  // Buscar domínio por ID
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM dominios_iboplayer WHERE id = ?');
    return stmt.get(id);
  }

  // Criar novo domínio
  static create(data) {
    const { nome, dominio, ativo = 1 } = data;

    const stmt = db.prepare(`
      INSERT INTO dominios_iboplayer (nome, dominio, ativo)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(nome, dominio, ativo);
    return this.getById(result.lastInsertRowid);
  }

  // Atualizar domínio
  static update(id, data) {
    const { nome, dominio, ativo } = data;

    const stmt = db.prepare(`
      UPDATE dominios_iboplayer
      SET nome = ?,
          dominio = ?,
          ativo = ?
      WHERE id = ?
    `);

    stmt.run(nome, dominio, ativo, id);
    return this.getById(id);
  }

  // Deletar domínio
  static delete(id) {
    // Verificar se há clientes usando este domínio
    const checkStmt = db.prepare('SELECT COUNT(*) as total FROM clientes WHERE dominio = (SELECT dominio FROM dominios_iboplayer WHERE id = ?)');
    const check = checkStmt.get(id);

    if (check.total > 0) {
      throw new Error(`Não é possível deletar este domínio pois existem ${check.total} cliente(s) usando-o`);
    }

    const stmt = db.prepare('DELETE FROM dominios_iboplayer WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Buscar por domínio (URL)
  static getByDominio(dominio) {
    const stmt = db.prepare('SELECT * FROM dominios_iboplayer WHERE dominio = ?');
    return stmt.get(dominio);
  }

  // Verificar se domínio existe
  static exists(dominio, excludeId = null) {
    let stmt;
    if (excludeId) {
      stmt = db.prepare('SELECT id FROM dominios_iboplayer WHERE dominio = ? AND id != ?');
      return stmt.get(dominio, excludeId) !== undefined;
    } else {
      stmt = db.prepare('SELECT id FROM dominios_iboplayer WHERE dominio = ?');
      return stmt.get(dominio) !== undefined;
    }
  }

  // Ativar/Desativar domínio
  static toggleAtivo(id) {
    const dominio = this.getById(id);
    if (!dominio) return null;

    const novoStatus = dominio.ativo === 1 ? 0 : 1;
    const stmt = db.prepare('UPDATE dominios_iboplayer SET ativo = ? WHERE id = ?');
    stmt.run(novoStatus, id);

    return this.getById(id);
  }
}

module.exports = DominiosModel;
