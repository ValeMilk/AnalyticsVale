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

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/vendas', vendasRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/acoes', acoesRoutes);
app.use('/api/acoes-analise', acoesAnaliseRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/lojas', lojasRoutes);

app.get('/api/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.json({ status: dbOk ? 'ok' : 'db_error', timestamp: new Date().toISOString() });
});

app.listen(config.port, async () => {
  console.log(`IA Cometa Backend rodando na porta ${config.port}`);
  await testConnection();
  await connectMongo();
});
