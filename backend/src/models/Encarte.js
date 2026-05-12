import mongoose from 'mongoose';

const encarteItemSchema = new mongoose.Schema({
  ean: { type: String, required: true },
  cod_interno: { type: String, default: '' },
  produto: { type: String, required: true },
  preco_oferta: { type: Number, required: true },
}, { _id: false });

const encarteSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  data_inicio: { type: Date, required: true },
  data_fim: { type: Date, required: true },
  vendor: {
    type: String,
    enum: ['valemilk', 'valefish', 'ambos'],
    default: 'ambos',
  },
  itens: { type: [encarteItemSchema], default: [] },
  observacao: { type: String, default: '' },
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

encarteSchema.index({ data_inicio: 1, data_fim: 1 });
encarteSchema.index({ vendor: 1 });

export default mongoose.model('Encarte', encarteSchema);
