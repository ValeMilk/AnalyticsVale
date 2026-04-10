import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized } from 'recharts';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ACAO_COLORS = {
  encarte: '#EAB308',
  oferta_interna: '#10B981',
  rebaixa: '#F97316',
};
const DEFAULT_COLOR = '#0056A6';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const point = entry?.payload || {};
  const tipo = point._tipo;
  const acoesAtivas = point._acoes_ativas || [];
  const qtdTotal = point.qtd;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[200px]">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <div className="mb-2">
        <p className="text-sm font-semibold" style={{ color: tipo ? ACAO_COLORS[tipo] : DEFAULT_COLOR }}>
          R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        {qtdTotal != null && (
          <p className="text-xs text-slate-500">{Number(qtdTotal).toLocaleString('pt-BR')} unid.</p>
        )}
      </div>
      {acoesAtivas.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
          {acoesAtivas.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span
                className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full"
                style={{ backgroundColor: ACAO_COLORS[a.tipo] || DEFAULT_COLOR }}
              />
              <div>
                <p className="text-xs font-medium text-slate-700 leading-tight">{a.produto}</p>
                <p className="text-xs text-slate-400" style={{ color: ACAO_COLORS[a.tipo] || DEFAULT_COLOR }}>
                  {a.tipo === 'encarte' ? 'Encarte' : a.tipo === 'oferta_interna' ? 'Oferta Interna' : 'Rebaixa'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  const d = typeof dateStr === 'string' ? dateStr.slice(0, 10) : dateStr instanceof Date ? dateStr.toISOString().slice(0, 10) : null;
  if (!d) return dateStr;
  const [y, m, day] = d.split('-');
  return `${day}/${m}`;
}

function normalizeDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return null;
}

// Determina o tipo dominante e lista todas as ações vigentes num dia
function getAcoesParaDia(dataRaw, acoes) {
  if (!dataRaw || !acoes.length) return { tipo: null, ativas: [] };
  const prioridade = ['encarte', 'oferta_interna', 'rebaixa'];
  let dominante = null;
  const ativas = [];
  for (const a of acoes) {
    const ini = normalizeDate(a.data_inicio);
    const fim = normalizeDate(a.data_fim);
    if (!ini || !fim) continue;
    if (dataRaw >= ini && dataRaw <= fim) {
      ativas.push(a);
      if (!dominante || prioridade.indexOf(a.tipo) < prioridade.indexOf(dominante)) {
        dominante = a.tipo;
      }
    }
  }
  return { tipo: dominante, ativas };
}

// Componente que desenha segmentos coloridos sobre a linha invisível
function ColoredSegments({ formattedGraphicalItems, chartData }) {
  if (!formattedGraphicalItems?.length) return null;
  const lineItem = formattedGraphicalItems[0];
  const points = lineItem?.props?.points;
  if (!points || points.length < 2) return null;

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const tipo = chartData[i]?._tipo || chartData[i + 1]?._tipo;
    const color = tipo ? ACAO_COLORS[tipo] : DEFAULT_COLOR;
    segments.push(
      <line
        key={`seg-${i}`}
        x1={points[i].x}
        y1={points[i].y}
        x2={points[i + 1].x}
        y2={points[i + 1].y}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }

  const dots = points.map((p, i) => {
    const tipo = chartData[i]?._tipo;
    if (!tipo) return null;
    const color = ACAO_COLORS[tipo] || DEFAULT_COLOR;
    return (
      <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill={color} stroke="white" strokeWidth={2} />
    );
  });

  return <g>{segments}{dots}</g>;
}

export default function SalesChart({ data = [], acoes = [], vendor = 'ambos', eansFiltros = [] }) {
  // Filtra ações: vendor específico só mostra ações daquele vendor; "ambos" mostra tudo
  let acoesFiltradas = acoes.filter(a =>
    vendor === 'ambos' ? true : a.vendor === vendor
  );

  // Se há produtos selecionados, filtra ações apenas dos EANs desses produtos
  // Normaliza EANs para comparação (remove vírgula trailing)
  if (eansFiltros.length > 0) {
    const eansNorm = new Set(eansFiltros.map(e => e.replace(/,+$/, '').trim()));
    acoesFiltradas = acoesFiltradas.filter(a => {
      const eanAcao = (a.ean || '').replace(/,+$/, '').trim();
      return eansNorm.has(eanAcao);
    });
  }

  const chartData = data.map(d => {
    const dataRaw = normalizeDate(d.data);
    const { tipo, ativas } = getAcoesParaDia(dataRaw, acoesFiltradas);
    return {
      ...d,
      dataFmt: formatDate(d.data),
      dataRaw,
      _tipo: tipo,
      _acoes_ativas: ativas,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="dataFmt"
          tick={{ fill: '#64748B', fontSize: 12 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748B', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="linear"
          dataKey="venda"
          name="Venda"
          stroke="transparent"
          strokeWidth={0}
          dot={false}
          activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
        />
        <Customized
          component={(props) => <ColoredSegments {...props} chartData={chartData} />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
