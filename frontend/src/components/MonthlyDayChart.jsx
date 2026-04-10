import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Dot,
} from 'recharts';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MESES_PT = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

const MES_COLORS = [
  '#0056A6', '#7C3AED', '#DB2777', '#0891B2',
  '#059669', '#D97706', '#DC2626', '#9333EA',
  '#0284C7', '#16A34A', '#CA8A04', '#E11D48',
];

const ACAO_COLORS = {
  encarte: '#EAB308',
  oferta_interna: '#10B981',
  rebaixa: '#F97316',
};

function nomeMes(mesStr) {
  // mesStr = '2026-03'
  const [ano, m] = mesStr.split('-');
  return `${MESES_PT[m] || m}/${ano.slice(2)}`;
}

function normalizeDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return null;
}

// Retorna o tipo de ação dominante para um (mes, dia), aplicando filtros de vendor e eans
function getTipoParaDiaMes(mes, dia, acoes, vendor, eansFiltros) {
  if (!acoes.length) return null;
  const dateStr = `${mes}-${String(dia).padStart(2, '0')}`;
  const prioridade = ['encarte', 'oferta_interna', 'rebaixa'];
  let found = null;

  // Filtra acoes por vendor (mesma lógica do SalesChart)
  const acoesFiltradas = acoes.filter(a => {
    if (vendor === 'valemilk' && a.vendor !== 'valemilk') return false;
    if (vendor === 'valefish' && a.vendor !== 'valefish' && a.vendor !== 'ambos') return false;
    if (eansFiltros.length > 0) {
      const eanAcao = (a.ean || '').replace(/,+$/, '');
      const match = eansFiltros.some(e => e.replace(/,+$/, '') === eanAcao);
      if (!match) return false;
    }
    return true;
  });

  for (const a of acoesFiltradas) {
    const ini = normalizeDate(a.data_inicio);
    const fim = normalizeDate(a.data_fim);
    if (!ini || !fim) continue;
    if (dateStr >= ini && dateStr <= fim) {
      if (!found || prioridade.indexOf(a.tipo) < prioridade.indexOf(found)) {
        found = a.tipo;
      }
    }
  }
  return found;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[160px]">
      <p className="text-xs font-semibold text-slate-500 mb-2">Dia {label}</p>
      {payload.map((entry, i) => (
        entry.value != null && (
          <div key={i} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="text-xs font-bold text-slate-900">{fmt(entry.value)}</span>
          </div>
        )
      ))}
    </div>
  );
}

function CustomDot({ cx, cy, tipo }) {
  if (!tipo) return null;
  const color = ACAO_COLORS[tipo] || '#0056A6';
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
}

export default function MonthlyDayChart({ data = [], acoes = [], vendor = 'ambos', eansFiltros = [] }) {
  const meses = useMemo(() => [...new Set(data.map(d => d.mes))].sort(), [data]);

  // Transforma em { dia, 'YYYY-MM': venda, ... }
  const chartData = useMemo(() => {
    const maxDia = data.length ? Math.max(...data.map(d => d.dia)) : 31;
    return Array.from({ length: maxDia }, (_, i) => {
      const dia = i + 1;
      const row = { dia };
      meses.forEach(mes => {
        const found = data.find(d => d.mes === mes && d.dia === dia);
        row[mes] = found ? found.venda : null;
      });
      return row;
    });
  }, [data, meses]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-300 text-sm">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Dia do mês', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-600">{nomeMes(value)}</span>}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {meses.map((mes, idx) => (
          <Line
            key={mes}
            type="monotone"
            dataKey={mes}
            name={mes}
            stroke={MES_COLORS[idx % MES_COLORS.length]}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const tipo = getTipoParaDiaMes(mes, payload.dia, acoes, vendor, eansFiltros);
              return <CustomDot key={`dot-${mes}-${payload.dia}`} cx={cx} cy={cy} tipo={tipo} />;
            }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
