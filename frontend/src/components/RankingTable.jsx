const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RankingTable({ data = [], limit = 10 }) {
  const items = data.slice(0, limit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="pb-3 pr-4">#</th>
            <th className="pb-3 pr-4">Produto</th>
            <th className="pb-3 pr-4 text-right">Qtd</th>
            <th className="pb-3 pr-4 text-right">Venda</th>
            <th className="pb-3 pr-4 text-right">Sell In</th>
            <th className="pb-3 text-right">Sell In %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.ean || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                  i === 0 ? 'bg-amber-500/15 text-amber-600' :
                  i === 1 ? 'bg-slate-200 text-slate-600' :
                  i === 2 ? 'bg-orange-500/15 text-orange-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </span>
              </td>
              <td className="py-3 pr-4">
                <p className="font-medium text-slate-900 truncate max-w-[200px]">{item.produto}</p>
                <p className="text-xs text-slate-400">{item.ean}</p>
              </td>
              <td className="py-3 pr-4 text-right text-slate-600">{Number(item.qtd_total).toLocaleString('pt-BR')}</td>
              <td className="py-3 pr-4 text-right text-slate-900 font-medium">{fmt(item.venda_total)}</td>
              <td className="py-3 pr-4 text-right text-emerald-600">{fmt(item.margem)}</td>
              <td className="py-3 text-right">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  Number(item.margem_percent) >= 20 ? 'bg-emerald-500/10 text-emerald-600' :
                  Number(item.margem_percent) >= 10 ? 'bg-royal/10 text-royal' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {Number(item.margem_percent).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="text-center text-slate-400 py-8">Nenhum dado disponível</p>
      )}
    </div>
  );
}
