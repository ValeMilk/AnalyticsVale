import mongoose from 'mongoose';
import dns from 'dns';
import config from '../config/index.js';

// Usar Google DNS para resolver SRV records do Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB Atlas conectado');
    return true;
  } catch (err) {
    console.error('Falha ao conectar MongoDB:', err.message);
    return false;
  }
}
