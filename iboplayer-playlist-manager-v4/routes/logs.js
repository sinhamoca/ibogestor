const express = require('express');
const router = express.Router();
const LogsModel = require('../database/models/logs');

// Listar logs com filtros
router.get('/', (req, res) => {
  try {
    const filters = {
      cliente_id: req.query.cliente_id,
      status: req.query.status,
      acao: req.query.acao,
      limit: req.query.limit || 100
    };

    const logs = LogsModel.getAll(filters);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estatísticas de logs
router.get('/stats', (req, res) => {
  try {
    const cliente_id = req.query.cliente_id;
    const stats = LogsModel.getStats(cliente_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar log por ID
router.get('/:id', (req, res) => {
  try {
    const log = LogsModel.getById(req.params.id);
    
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log não encontrado' });
    }
    
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Limpar logs antigos
router.delete('/cleanup', (req, res) => {
  try {
    const days = req.query.days || 30;
    const deleted = LogsModel.cleanOldLogs(days);
    res.json({ 
      success: true, 
      message: `${deleted} log(s) deletado(s)`,
      deleted 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
