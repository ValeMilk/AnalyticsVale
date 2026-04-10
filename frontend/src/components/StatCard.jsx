export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colorMap = {
    blue: 'from-royal/10 to-royal/5 border-royal/20 text-royal',
    green: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-600',
  };

  const iconBg = {
    blue: 'bg-royal/10 text-royal',
    green: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
    red: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-5 bg-white transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sub && <p className={`text-xs mt-2 ${colorMap[color].split(' ').pop()}`}>{sub}</p>}
    </div>
  );
}
