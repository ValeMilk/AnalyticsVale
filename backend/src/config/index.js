import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'bi_user',
    password: process.env.DB_PASSWORD || 'bi_password',
    database: process.env.DB_NAME || 'bi_cometa',
  },
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ia_cometa',
  cacheTtl: parseInt(process.env.CACHE_TTL_MINUTES) || 5,
  alertas: {
    estoqueMinimo: parseInt(process.env.ESTOQUE_MINIMO) || 50,
    quedaVendasPercent: parseInt(process.env.QUEDA_VENDAS_PERCENT) || 15,
  },
};
