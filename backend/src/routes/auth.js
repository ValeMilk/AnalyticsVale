import { Router } from 'express';
import User from '../models/User.js';
import { gerarToken, autenticar } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', error: 'Informe usuário e senha' });
    }

    const user = await User.findOne({ username: username.toLowerCase(), ativo: true });
    if (!user) {
      return res.status(401).json({ status: 'error', error: 'Usuário ou senha incorretos' });
    }

    const ok = await user.verificarSenha(password);
    if (!ok) {
      return res.status(401).json({ status: 'error', error: 'Usuário ou senha incorretos' });
    }

    const token = gerarToken(user);
    res.json({ status: 'success', token, user });
  } catch (err) {
    console.error('❌ POST /api/auth/login:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// GET /api/auth/me — valida token e retorna usuário atual
router.get('/me', autenticar, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.ativo) {
      return res.status(401).json({ status: 'error', error: 'Usuário não encontrado' });
    }
    res.json({ status: 'success', user });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
