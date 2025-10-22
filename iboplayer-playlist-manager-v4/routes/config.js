const express = require('express');
const router = express.Router();
const ConfigsModel = require('../database/models/configs');

// Listar todas as configurações
router.get('/', (req, res) => {
  try {
    const configs = ConfigsModel.getAll();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar configuração específica
router.get('/:key', (req, res) => {
  try {
    const config = ConfigsModel.get(req.params.key);
    
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuração não encontrada' });
    }
    
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Salvar/Atualizar configuração
router.post('/', (req, res) => {
  try {
    const { key, value, descricao } = req.body;

    if (!key || key.trim() === '') {
      return res.status(400).json({ success: false, error: 'Key é obrigatória' });
    }

    const config = ConfigsModel.set(key, value || '', descricao);
    res.json({ success: true, data: config, message: 'Configuração salva com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar configuração específica
router.put('/:key', (req, res) => {
  try {
    const { value, descricao } = req.body;

    const config = ConfigsModel.set(req.params.key, value || '', descricao);
    res.json({ success: true, data: config, message: 'Configuração atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar configuração
router.delete('/:key', (req, res) => {
  try {
    const deleted = ConfigsModel.delete(req.params.key);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Configuração não encontrada' });
    }
    
    res.json({ success: true, message: 'Configuração deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoints específicos para 2Captcha
router.get('/2captcha/key', (req, res) => {
  try {
    const apiKey = ConfigsModel.get2CaptchaKey();
    res.json({ 
      success: true, 
      data: { 
        key: apiKey,
        configured: apiKey && apiKey.length > 0
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/2captcha/key', (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ success: false, error: 'API Key é obrigatória' });
    }

    ConfigsModel.set2CaptchaKey(apiKey);
    res.json({ success: true, message: 'API Key do 2Captcha salva com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
