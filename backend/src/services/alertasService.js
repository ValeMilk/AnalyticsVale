import config from '../config/index.js';

// Recebe dados já agregados por dia [{data, venda, qtd, custo, margem}]
export function gerarAlertasVendasDia(vendasDia) {
  const alertas = [];

  if (vendasDia.length >= 2) {
    const sorted = [...vendasDia].sort((a, b) => String(a.data).localeCompare(String(b.data)));
    const ultimo = sorted[sorted.length - 1];
    const penultimo = sorted[sorted.length - 2];

    if (penultimo.venda > 0) {
      const variacao = ((ultimo.venda - penultimo.venda) / penultimo.venda) * 100;
      if (variacao <= -config.alertas.quedaVendasPercent) {
        alertas.push({
          tipo: 'aviso',
          categoria: 'vendas',
          titulo: 'Queda de vendas diárias',
          descricao: `Queda de ${Math.abs(variacao).toFixed(1)}% (de R$ ${penultimo.venda.toFixed(2)} para R$ ${ultimo.venda.toFixed(2)})`,
          produto: null,
          ean: null,
          valor: variacao.toFixed(1),
          timestamp: String(ultimo.data),
        });
      }
    }

    // Alerta de margem negativa
    if (ultimo.margem < 0) {
      alertas.push({
        tipo: 'critico',
        categoria: 'vendas',
        titulo: 'Margem NEGATIVA no último dia',
        descricao: `Margem de R$ ${ultimo.margem.toFixed(2)} em ${String(ultimo.data)}`,
        produto: null,
        ean: null,
        valor: ultimo.margem.toFixed(2),
        timestamp: String(ultimo.data),
      });
    }
  }

  return alertas;
}
