import mongoose from 'mongoose';

const acaoComercialSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['encarte', 'oferta_interna', 'rebaixa'],
    required: true,
  },
  ean: { type: String, required: true },
  cod_interno: { type: String, default: '' },
  produto: { type: String, required: true },
  preco_normal: { type: Number, default: null },
  preco_acao: { type: Number, required: true },
  data_inicio: { type: Date, required: true },
  data_fim: { type: Date, required: true },
  vendor: {
    type: String,
    enum: ['valemilk', 'valefish', 'ambos'],
    default: 'ambos',
  },
  observacao: { type: String, default: '' },
  ativo: { type: Boolean, default: true },
}, {
  timestamps: true,
});

acaoComercialSchema.index({ ean: 1, data_inicio: 1, data_fim: 1 });
acaoComercialSchema.index({ tipo: 1 });
acaoComercialSchema.index({ data_inicio: 1, data_fim: 1 });

export default mongoose.model('AcaoComercial', acaoComercialSchema);
