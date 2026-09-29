import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { graficos } from '../styles/tokens';
import { COR_TIPO_ACAO, PRIORIDADE_TIPO_ACAO, normEan } from '../config/acoes';
import { fmtMesAno, fmtMoeda, soData } from '../lib/formatar';

// Tipo de ação dominante para (mes, dia), respeitando bandeira e produtos filtrados
function getTipoParaDiaMes(mes, dia, acoes, vendor, eansFiltros) {
  if (!acoes.length) return null;
  const dateStr = `${mes}-${String(dia).padStart(2, '0')}`;
  let found = null;
  for (const a of acoes) {
    if (vendor !== 'ambos' && a.vendor !== vendor && a.vendor !== 'ambos') continue;
    if (eansFiltros.length > 0 && !eansFiltros.some((e) => normEan(e) === normEan(a.ean))) continue;
    const ini = soData(a.data_inicio);
    const fim = soData(a.data_fim);
    if (!ini || !fim) continue;
    if (dateStr >= ini && dateStr <= fim && (!found || PRIORIDADE_TIPO_ACAO.indexOf(a.tipo) < PRIORIDADE_TIPO_ACAO.indexOf(found))) found = a.tipo;
  }
  return found;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-neutral-500">Dia {label}</p>
      {payload.map(
        (entry, i) =>
          entry.value != null && (
            <div key={i} className="mb-1 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-neutral-600">
                <span className="inline-block size-2 rounded-full" style={{ background: entry.color }} />
                {fmtMesAno(entry.name)}
              </span>
              <span className="text-xs font-bold tabular-nums text-neutral-900">{fmtMoeda(entry.value)}</span>
            </div>
          )
      )}
    </div>
  );
}

function CustomDot({ cx, cy, tipo }) {
  if (!tipo || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={COR_TIPO_ACAO[tipo] || graficos.padrao} stroke="#fff" strokeWidth={1.5} />;
}

export default function MonthlyDayChart({ data = [], acoes = [], vendor = 'ambos', eansFiltros = [] }) {
  const meses = useMemo(() => [...new Set(data.map((d) => d.mes))].sort(), [data]);

  const chartData = useMemo(() => {
    const maxDia = data.length ? Math.max(...data.map((d) => d.dia)) : 31;
    return Array.from({ length: maxDia }, (_, i) => {
      const dia = i + 1;
      const row = { dia };
      meses.forEach((mes) => {
        const found = data.find((d) => d.mes === mes && d.dia === dia);
        row[mes] = found ? found.venda : null;
      });
      return row;
    });
  }, [data, meses]);

  if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-neutral-400">Sem dados para exibir</div>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={graficos.grade} vertical={false} />
        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: graficos.eixo }} tickLine={false} axisLine={false} label={{ value: 'Dia do mês', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: graficos.eixo }} />
        <YAxis tick={{ fontSize: 11, fill: graficos.eixo }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={56} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => <span className="text-xs text-neutral-600">{fmtMesAno(value)}</span>} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} />
        {meses.map((mes, idx) => (
          <Line
            key={mes}
            type="monotone"
            dataKey={mes}
            name={mes}
            stroke={graficos.series[idx % graficos.series.length]}
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
