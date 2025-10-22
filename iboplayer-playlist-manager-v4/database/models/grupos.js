const db = require('../db');

class GruposModel {
  // Listar todos os grupos
  static getAll() {
    const stmt = db.prepare(`
      SELECT 
        g.*,
        COUNT(c.id) as total_clientes
      FROM grupos g
      LEFT JOIN clientes c ON c.grupo_id = g.id
      GROUP BY g.id
      ORDER BY g.nome
    `);
    return stmt.all();
  }

  // Buscar grupo por ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT 
        g.*,
        COUNT(c.id) as total_clientes
      FROM grupos g
      LEFT JOIN clientes c ON c.grupo_id = g.id
      WHERE g.id = ?
      GROUP BY g.id
    `);
    return stmt.get(id);
  }

  // Criar novo grupo
  static create(data) {
    const { nome, descricao = '' } = data;
    
    const stmt = db.prepare(`
      INSERT INTO grupos (nome, descricao) 
      VALUES (?, ?)
    `);
    
    const result = stmt.run(nome, descricao);
    return this.getById(result.lastInsertRowid);
  }

  // Atualizar grupo
  static update(id, data) {
    const { nome, descricao } = data;
    
    const stmt = db.prepare(`
      UPDATE grupos 
      SET nome = ?, 
          descricao = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(nome, descricao, id);
    return this.getById(id);
  }

  // Deletar grupo
  static delete(id) {
    // Verificar se tem clientes
    const grupo = this.getById(id);
    if (grupo && grupo.total_clientes > 0) {
      throw new Error(`Não é possível deletar o grupo "${grupo.nome}" pois existem ${grupo.total_clientes} cliente(s) vinculado(s)`);
    }

    const stmt = db.prepare('DELETE FROM grupos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Contar clientes do grupo
  static countClientes(id) {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM clientes WHERE grupo_id = ?');
    const result = stmt.get(id);
    return result.total;
  }

  // Verificar se nome já existe
  static existsByName(nome, excludeId = null) {
    let stmt;
    if (excludeId) {
      stmt = db.prepare('SELECT id FROM grupos WHERE nome = ? AND id != ?');
      return stmt.get(nome, excludeId) !== undefined;
    } else {
      stmt = db.prepare('SELECT id FROM grupos WHERE nome = ?');
      return stmt.get(nome) !== undefined;
    }
  }
}

module.exports = GruposModel;
