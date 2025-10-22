const express = require('express');
const router = express.Router();
const GruposModel = require('../database/models/grupos');

// Listar todos os grupos
router.get('/', (req, res) => {
  try {
    const grupos = GruposModel.getAll();
    res.json({ success: true, data: grupos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar grupo por ID
router.get('/:id', (req, res) => {
  try {
    const grupo = GruposModel.getById(req.params.id);
    
    if (!grupo) {
      return res.status(404).json({ success: false, error: 'Grupo não encontrado' });
    }
    
    res.json({ success: true, data: grupo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar novo grupo
router.post('/', (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    // Verificar se já existe
    if (GruposModel.existsByName(nome)) {
      return res.status(400).json({ success: false, error: 'Já existe um grupo com este nome' });
    }

    const grupo = GruposModel.create({ nome, descricao });
    res.status(201).json({ success: true, data: grupo, message: 'Grupo criado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar grupo
router.put('/:id', (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    // Verificar se grupo existe
    const grupoExistente = GruposModel.getById(req.params.id);
    if (!grupoExistente) {
      return res.status(404).json({ success: false, error: 'Grupo não encontrado' });
    }

    // Verificar se nome já existe em outro grupo
    if (GruposModel.existsByName(nome, req.params.id)) {
      return res.status(400).json({ success: false, error: 'Já existe um grupo com este nome' });
    }

    const grupo = GruposModel.update(req.params.id, { nome, descricao });
    res.json({ success: true, data: grupo, message: 'Grupo atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar grupo
router.delete('/:id', (req, res) => {
  try {
    const deleted = GruposModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Grupo não encontrado' });
    }
    
    res.json({ success: true, message: 'Grupo deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
