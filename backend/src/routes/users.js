import { Router } from 'express';
import User from '../models/User.js';
import { autenticar, soAdmin } from '../middleware/auth.js';

const router = Router();

// Todas as rotas exigem autenticação + ser admin
router.use(autenticar, soAdmin);

// GET /api/users — listar usuários
router.get('/', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ status: 'success', data: users });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// POST /api/users — criar usuário
router.post('/', async (req, res) => {
  try {
    const { nome, username, password, role } = req.body;
    if (!nome || !username || !password) {
      return res.status(400).json({ status: 'error', error: 'nome, username e password são obrigatórios' });
    }
    const existe = await User.findOne({ username: username.toLowerCase() });
    if (existe) {
      return res.status(409).json({ status: 'error', error: 'Username já cadastrado' });
    }
    const user = new User({ nome, username, password, role: role || 'user' });
    await user.save();
    res.status(201).json({ status: 'success', data: user });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// PUT /api/users/:id — editar usuário
router.put('/:id', async (req, res) => {
  try {
    const { nome, username, password, role, ativo } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', error: 'Usuário não encontrado' });

    if (nome) user.nome = nome;
    if (username) user.username = username.toLowerCase();
    if (role) user.role = role;
    if (ativo !== undefined) user.ativo = ativo;
    if (password) user.password = password; // pre-save faz o hash

    await user.save();
    res.json({ status: 'success', data: user });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// DELETE /api/users/:id — remover usuário
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', error: 'Usuário não encontrado' });
    if (user.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', ativo: true });
      if (admins <= 1) return res.status(400).json({ status: 'error', error: 'Não é possível remover o único admin' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
