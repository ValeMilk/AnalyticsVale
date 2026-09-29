import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized } from 'recharts';
import { graficos } from '../styles/tokens';
import { COR_TIPO_ACAO, PRIORIDADE_TIPO_ACAO, ROTULO_TIPO_ACAO, normEan } from '../config/acoes';
import { fmtDataCurta, fmtMoeda, fmtNumero, soData } from '../lib/formatar';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const point = entry?.payload || {};
  const tipo = point._tipo;
  const acoesAtivas = point._acoes_ativas || [];
  return (
    <div className="min-w-[200px] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: tipo ? COR_TIPO_ACAO[tipo] : graficos.padrao }}>
        {fmtMoeda(entry.value)}
      </p>
      {point.qtd != null && <p className="text-xs text-neutral-500">{fmtNumero(point.qtd)} unid.</p>}
      {acoesAtivas.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
          {acoesAtivas.slice(0, 6).map((a, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: COR_TIPO_ACAO[a.tipo] || graficos.padrao }} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-700">{a.produto}</p>
                <p className="text-[11px]" style={{ color: COR_TIPO_ACAO[a.tipo] || graficos.padrao }}>
                  {ROTULO_TIPO_ACAO[a.tipo] ?? a.tipo}
                </p>
              </div>
            </div>
          ))}
          {acoesAtivas.length > 6 && <p className="text-[11px] text-neutral-400">+{acoesAtivas.length - 6} ações</p>}
        </div>
      )}
    </div>
  );
}

// Tipo dominante e lista de ações vigentes num dia
function getAcoesParaDia(dataRaw, acoes) {
  if (!dataRaw || !acoes.length) return { tipo: null, ativas: [] };
  let dominante = null;
  const ativas = [];
  for (const a of acoes) {
    const ini = soData(a.data_inicio);
    const fim = soData(a.data_fim);
    if (!ini || !fim) continue;
    if (dataRaw >= ini && dataRaw <= fim) {
      ativas.push(a);
      if (!dominante || PRIORIDADE_TIPO_ACAO.indexOf(a.tipo) < PRIORIDADE_TIPO_ACAO.indexOf(dominante)) dominante = a.tipo;
    }
  }
  return { tipo: dominante, ativas };
}

// Segmentos coloridos por cima da linha (a Line em si é transparente)
function ColoredSegments({ formattedGraphicalItems, chartData }) {
  if (!formattedGraphicalItems?.length) return null;
  const points = formattedGraphicalItems[0]?.props?.points;
  if (!points || points.length < 2) return null;

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const tipo = chartData[i]?._tipo || chartData[i + 1]?._tipo;
    segments.push(
      <line
        key={`seg-${i}`}
        x1={points[i].x}
        y1={points[i].y}
        x2={points[i + 1].x}
        y2={points[i + 1].y}
        stroke={tipo ? COR_TIPO_ACAO[tipo] : graficos.padrao}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }
  const dots = points.map((p, i) => {
    const tipo = chartData[i]?._tipo;
    if (!tipo) return null;
    return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill={COR_TIPO_ACAO[tipo] || graficos.padrao} stroke="#fff" strokeWidth={2} />;
  });
  return (
    <g>
      {segments}
      {dots}
    </g>
  );
}

export default function SalesChart({ data = [], acoes = [], vendor = 'ambos', eansFiltros = [] }) {
  let acoesFiltradas = acoes.filter((a) => (vendor === 'ambos' ? true : a.vendor === vendor || a.vendor === 'ambos'));
  if (eansFiltros.length > 0) {
    const eansNorm = new Set(eansFiltros.map(normEan));
    acoesFiltradas = acoesFiltradas.filter((a) => eansNorm.has(normEan(a.ean)));
  }

  const chartData = data.map((d) => {
    const dataRaw = soData(d.data);
    const { tipo, ativas } = getAcoesParaDia(dataRaw, acoesFiltradas);
    return { ...d, dataFmt: fmtDataCurta(d.data), dataRaw, _tipo: tipo, _acoes_ativas: ativas };
  });

  if (!chartData.length) return <div className="flex h-64 items-center justify-center text-sm text-neutral-400">Sem dados para o período</div>;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={graficos.grade} />
        <XAxis dataKey="dataFmt" tick={{ fill: graficos.eixo, fontSize: 12 }} axisLine={{ stroke: graficos.grade }} tickLine={false} />
        <YAxis tick={{ fill: graficos.eixo, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="linear" dataKey="venda" name="Venda" stroke="transparent" strokeWidth={0} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
        <Customized component={(props) => <ColoredSegments {...props} chartData={chartData} />} />
      </LineChart>
    </ResponsiveContainer>
  );
}
