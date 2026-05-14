import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { testConnection } from './services/db.js';
import { connectMongo } from './services/mongo.js';
import vendasRoutes from './routes/vendas.js';
import analyticsRoutes from './routes/analytics.js';
import alertasRoutes from './routes/alertas.js';
import acoesRoutes from './routes/acoes.js';
import acoesAnaliseRoutes from './routes/acoesAnalise.js';
import produtosRoutes from './routes/produtos.js';
import lojasRoutes from './routes/lojas.js';
import encartesRoutes from './routes/encartes.js';
import concorrenciaRoutes from './routes/concorrencia.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import { autenticar } from './middleware/auth.js';
import User from './models/User.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);
app.get('/api/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.json({ status: dbOk ? 'ok' : 'db_error', timestamp: new Date().toISOString() });
});

// Todas as demais rotas exigem autenticação
app.use('/api/vendas', autenticar, vendasRoutes);
app.use('/api/analytics', autenticar, analyticsRoutes);
app.use('/api/alertas', autenticar, alertasRoutes);
app.use('/api/acoes', autenticar, acoesRoutes);
app.use('/api/acoes-analise', autenticar, acoesAnaliseRoutes);
app.use('/api/produtos', autenticar, produtosRoutes);
app.use('/api/lojas', autenticar, lojasRoutes);
app.use('/api/encartes', autenticar, encartesRoutes);
app.use('/api/concorrencia', autenticar, concorrenciaRoutes);
app.use('/api/users', usersRoutes);

app.listen(config.port, async () => {
  console.log(`IA Cometa Backend rodando na porta ${config.port}`);
  await testConnection();
  await connectMongo();
  // Cria admin padrão se não houver nenhum usuário
  const total = await User.countDocuments();
  if (total === 0) {
    await new User({ nome: 'Administrador', username: 'admin', password: 'int2026#', role: 'admin' }).save();
    console.log('✅ Usuário admin criado (username: admin)');
  }
});
