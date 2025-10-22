const express = require('express');
const router = express.Router();
const ClientesModel = require('../database/models/clientes');
const LogsModel = require('../database/models/logs');

// Listar todos os clientes
router.get('/', (req, res) => {
  try {
    const filters = {
      grupo_id: req.query.grupo_id,
      aplicativo: req.query.aplicativo,
      ativo: req.query.ativo,
      search: req.query.search
    };

    const clientes = ClientesModel.getAll(filters);
    res.json({ success: true, data: clientes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estatísticas gerais
router.get('/stats', (req, res) => {
  try {
    const stats = ClientesModel.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar cliente por ID
router.get('/:id', (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar novo cliente
router.post('/', (req, res) => {
  try {
    const { nome, mac, device_key, password, grupo_id, aplicativo, dominio, ativo } = req.body;

    // Validações básicas
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!mac || mac.trim() === '') {
      return res.status(400).json({ success: false, error: 'MAC Address é obrigatório' });
    }

    if (!aplicativo) {
      return res.status(400).json({ success: false, error: 'Aplicativo é obrigatório' });
    }

    // Verificar se já existe (MAC + aplicativo + domínio)
    const existente = ClientesModel.getByMacAndApp(mac, aplicativo, dominio);
    if (existente) {
      return res.status(400).json({ 
        success: false, 
        error: 'Já existe um cliente com este MAC para este aplicativo e domínio' 
      });
    }

    const cliente = ClientesModel.create({
      nome,
      mac,
      device_key,
      password,
      grupo_id: grupo_id || null,
      aplicativo,
      dominio,
      ativo: ativo !== undefined ? ativo : 1
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'criar_cliente',
      status: 'sucesso',
      mensagem: 'Cliente criado com sucesso'
    });

    res.status(201).json({ success: true, data: cliente, message: 'Cliente criado com sucesso' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Atualizar cliente
router.put('/:id', (req, res) => {
  try {
    const { nome, mac, device_key, password, grupo_id, aplicativo, dominio, ativo } = req.body;

    // Verificar se cliente existe
    const clienteExistente = ClientesModel.getById(req.params.id);
    if (!clienteExistente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    // Validações
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!mac || mac.trim() === '') {
      return res.status(400).json({ success: false, error: 'MAC Address é obrigatório' });
    }

    const cliente = ClientesModel.update(req.params.id, {
      nome,
      mac,
      device_key,
      password,
      grupo_id: grupo_id || null,
      aplicativo,
      dominio,
      ativo: ativo !== undefined ? ativo : 1
    });

    // Criar log
    LogsModel.create({
      cliente_id: cliente.id,
      acao: 'atualizar_cliente',
      status: 'sucesso',
      mensagem: 'Cliente atualizado com sucesso'
    });

    res.json({ success: true, data: cliente, message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Deletar cliente
router.delete('/:id', (req, res) => {
  try {
    const cliente = ClientesModel.getById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }

    const deleted = ClientesModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    
    res.json({ success: true, message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs do cliente
router.get('/:id/logs', (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const logs = LogsModel.getByCliente(req.params.id, limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
