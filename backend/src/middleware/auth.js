import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cometa_secret_2026';

export const gerarToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

export const autenticar = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', error: 'Não autenticado' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ status: 'error', error: 'Token inválido ou expirado' });
  }
};

export const soAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ status: 'error', error: 'Acesso restrito a administradores' });
  }
  next();
};
