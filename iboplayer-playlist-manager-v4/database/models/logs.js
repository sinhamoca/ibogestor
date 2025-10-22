const db = require('../db');

class LogsModel {
  // Criar novo log
  static create(data) {
    const {
      cliente_id,
      acao,
      status,
      mensagem = '',
      detalhes = null
    } = data;

    const stmt = db.prepare(`
      INSERT INTO logs (cliente_id, acao, status, mensagem, detalhes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const detalhesJson = detalhes ? JSON.stringify(detalhes) : null;
    const result = stmt.run(cliente_id, acao, status, mensagem, detalhesJson);
    
    return this.getById(result.lastInsertRowid);
  }

  // Buscar log por ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT 
        l.*,
        c.nome as cliente_nome,
        c.aplicativo as cliente_aplicativo
      FROM logs l
      LEFT JOIN clientes c ON c.id = l.cliente_id
      WHERE l.id = ?
    `);
    
    const log = stmt.get(id);
    
    if (log && log.detalhes) {
      try {
        log.detalhes = JSON.parse(log.detalhes);
      } catch (e) {
        // Manter como string se não for JSON válido
      }
    }
    
    return log;
  }

  // Listar logs com filtros
  static getAll(filters = {}) {
    let query = `
      SELECT 
        l.*,
        c.nome as cliente_nome,
        c.aplicativo as cliente_aplicativo
      FROM logs l
      LEFT JOIN clientes c ON c.id = l.cliente_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.cliente_id) {
      query += ' AND l.cliente_id = ?';
      params.push(filters.cliente_id);
    }

    if (filters.status) {
      query += ' AND l.status = ?';
      params.push(filters.status);
    }

    if (filters.acao) {
      query += ' AND l.acao = ?';
      params.push(filters.acao);
    }

    const limit = filters.limit || 100;
    query += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const logs = stmt.all(...params);

    // Parse detalhes JSON
    logs.forEach(log => {
      if (log.detalhes) {
        try {
          log.detalhes = JSON.parse(log.detalhes);
        } catch (e) {
          // Manter como string
        }
      }
    });

    return logs;
  }

  // Logs de um cliente específico
  static getByCliente(cliente_id, limit = 50) {
    return this.getAll({ cliente_id, limit });
  }

  // Limpar logs antigos (mais de X dias)
  static cleanOldLogs(days = 30) {
    const stmt = db.prepare(`
      DELETE FROM logs 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);
    
    const result = stmt.run(days);
    return result.changes;
  }

  // Estatísticas de logs
  static getStats(cliente_id = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucessos,
        SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erros,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes
      FROM logs
      WHERE 1=1
    `;

    const params = [];

    if (cliente_id) {
      query += ' AND cliente_id = ?';
      params.push(cliente_id);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  // Deletar logs de um cliente
  static deleteByCliente(cliente_id) {
    const stmt = db.prepare('DELETE FROM logs WHERE cliente_id = ?');
    const result = stmt.run(cliente_id);
    return result.changes;
  }
}

module.exports = LogsModel;
