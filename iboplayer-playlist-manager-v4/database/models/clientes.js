const db = require('../db');

class ClientesModel {
  // Listar todos os clientes
  static getAll(filters = {}) {
    let query = `
      SELECT 
        c.*,
        g.nome as grupo_nome
      FROM clientes c
      LEFT JOIN grupos g ON g.id = c.grupo_id
      WHERE 1=1
    `;
    
    const params = [];

    if (filters.grupo_id) {
      query += ' AND c.grupo_id = ?';
      params.push(filters.grupo_id);
    }

    if (filters.aplicativo) {
      query += ' AND c.aplicativo = ?';
      params.push(filters.aplicativo);
    }

    if (filters.ativo !== undefined) {
      query += ' AND c.ativo = ?';
      params.push(filters.ativo);
    }

    if (filters.search) {
      query += ' AND (c.nome LIKE ? OR c.mac LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY c.nome';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Buscar cliente por ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        g.nome as grupo_nome
      FROM clientes c
      LEFT JOIN grupos g ON g.id = c.grupo_id
      WHERE c.id = ?
    `);
    return stmt.get(id);
  }

  // Criar novo cliente
  static create(data) {
    const {
      nome,
      mac,
      device_key = null,
      password = null,
      grupo_id = null,
      aplicativo,
      dominio = null,
      ativo = 1
    } = data;

    // Validar aplicativo
    if (!['iboplayer', 'ibopro', 'vuplayer'].includes(aplicativo)) {
      throw new Error('Aplicativo inválido. Use: iboplayer, ibopro ou vuplayer');
    }

    // Validar campos obrigatórios por aplicativo
    if (aplicativo === 'iboplayer' && !device_key) {
      throw new Error('Device Key é obrigatório para IBOPlayer');
    }

    if (aplicativo === 'iboplayer' && !dominio) {
      throw new Error('Domínio é obrigatório para IBOPlayer');
    }

    if (aplicativo === 'ibopro' && !password) {
      throw new Error('Password é obrigatório para IBOPro');
    }

    if (aplicativo === 'vuplayer' && !device_key) {
      throw new Error('Device Key é obrigatório para VU Player');
    }

    const stmt = db.prepare(`
      INSERT INTO clientes (nome, mac, device_key, password, grupo_id, aplicativo, dominio, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(nome, mac, device_key, password, grupo_id, aplicativo, dominio, ativo);
    return this.getById(result.lastInsertRowid);
  }

  // Atualizar cliente
  static update(id, data) {
    const {
      nome,
      mac,
      device_key,
      password,
      grupo_id,
      aplicativo,
      dominio,
      ativo
    } = data;

    // Validar aplicativo se foi alterado
    if (aplicativo && !['iboplayer', 'ibopro', 'vuplayer'].includes(aplicativo)) {
      throw new Error('Aplicativo inválido');
    }

    const stmt = db.prepare(`
      UPDATE clientes 
      SET nome = ?,
          mac = ?,
          device_key = ?,
          password = ?,
          grupo_id = ?,
          aplicativo = ?,
          dominio = ?,
          ativo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(nome, mac, device_key, password, grupo_id, aplicativo, dominio, ativo, id);
    return this.getById(id);
  }

  // Deletar cliente
  static delete(id) {
    const stmt = db.prepare('DELETE FROM clientes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Atualizar última sincronização
  static updateSincronizacao(id) {
    const stmt = db.prepare(`
      UPDATE clientes 
      SET ultima_sincronizacao = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(id);
  }

  // Salvar snapshot das playlists
  static savePlaylistsSnapshot(id, playlists) {
    const stmt = db.prepare(`
      UPDATE clientes 
      SET playlists_snapshot = ?,
          ultima_sincronizacao = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(JSON.stringify(playlists), id);
  }

  // Obter snapshot das playlists
  static getPlaylistsSnapshot(id) {
    const stmt = db.prepare(`
      SELECT playlists_snapshot, ultima_sincronizacao 
      FROM clientes 
      WHERE id = ?
    `);
    const result = stmt.get(id);
    
    if (!result || !result.playlists_snapshot) {
      return { playlists: [], ultima_sincronizacao: null };
    }
    
    try {
      return {
        playlists: JSON.parse(result.playlists_snapshot),
        ultima_sincronizacao: result.ultima_sincronizacao
      };
    } catch (error) {
      return { playlists: [], ultima_sincronizacao: result.ultima_sincronizacao };
    }
  }

  // Buscar por MAC e aplicativo
  static getByMacAndApp(mac, aplicativo, dominio = null) {
    let query = 'SELECT * FROM clientes WHERE mac = ? AND aplicativo = ?';
    const params = [mac, aplicativo];

    if (dominio) {
      query += ' AND dominio = ?';
      params.push(dominio);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  // Estatísticas gerais
  static getStats() {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN aplicativo = 'iboplayer' THEN 1 ELSE 0 END) as iboplayer,
        SUM(CASE WHEN aplicativo = 'ibopro' THEN 1 ELSE 0 END) as ibopro,
        SUM(CASE WHEN aplicativo = 'vuplayer' THEN 1 ELSE 0 END) as vuplayer
      FROM clientes
    `);
    return stmt.get();
  }

  // Clientes por grupo
  static getByGrupo(grupo_id) {
    const stmt = db.prepare(`
      SELECT * FROM clientes 
      WHERE grupo_id = ? 
      ORDER BY nome
    `);
    return stmt.all(grupo_id);
  }
}

module.exports = ClientesModel;
