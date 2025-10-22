const express = require('express');
const router = express.Router();
const DominiosModel = require('../database/models/dominios');

// Listar todos os domínios
router.get('/', (req, res) => {
  try {
    const apenasAtivos = req.query.ativos === 'true';
    const dominios = DominiosModel.getAll(apenasAtivos);
    res.json({ success: true, data: dominios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar domínio por ID
router.get('/:id', (req, res) => {
  try {
    const dominio = DominiosModel.getById(req.params.id);
    
    if (!dominio) {
      return res.status(404).json({ success: false, error: 'Domínio não encontrado' });
    }
    
    res.json({ success: true, data: dominio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar novo domínio
router.post('/', (req, res) => {
  try {
    const { nome, dominio, ativo } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!dominio || dominio.trim() === '') {
      return res.status(400).json({ success: false, error: 'Domínio é obrigatório' });
    }

    // Verificar se já existe
    if (DominiosModel.exists(dominio)) {
      return res.status(400).json({ success: false, error: 'Este domínio já está cadastrado' });
    }

    const novoDominio = DominiosModel.create({ nome, dominio, ativo: ativo !== undefined ? ativo : 1 });
    res.status(201).json({ success: true, data: novoDominio, message: 'Domínio criado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar domínio
router.put('/:id', (req, res) => {
  try {
    const { nome, dominio, ativo } = req.body;

    // Verificar se domínio existe
    const dominioExistente = DominiosModel.getById(req.params.id);
    if (!dominioExistente) {
      return res.status(404).json({ success: false, error: 'Domínio não encontrado' });
    }

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    if (!dominio || dominio.trim() === '') {
      return res.status(400).json({ success: false, error: 'Domínio é obrigatório' });
    }

    // Verificar se domínio já existe em outro registro
    if (DominiosModel.exists(dominio, req.params.id)) {
      return res.status(400).json({ success: false, error: 'Este domínio já está cadastrado' });
    }

    const dominioAtualizado = DominiosModel.update(req.params.id, { nome, dominio, ativo });
    res.json({ success: true, data: dominioAtualizado, message: 'Domínio atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar domínio
router.delete('/:id', (req, res) => {
  try {
    const deleted = DominiosModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Domínio não encontrado' });
    }
    
    res.json({ success: true, message: 'Domínio deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Ativar/Desativar domínio
router.patch('/:id/toggle', (req, res) => {
  try {
    const dominio = DominiosModel.toggleAtivo(req.params.id);
    
    if (!dominio) {
      return res.status(404).json({ success: false, error: 'Domínio não encontrado' });
    }
    
    const status = dominio.ativo === 1 ? 'ativado' : 'desativado';
    res.json({ success: true, data: dominio, message: `Domínio ${status} com sucesso` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
