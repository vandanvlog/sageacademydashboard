import { TrendingUp, TrendingDown } from 'lucide-react';

function formatValue(value, prefix = '£') {
  if (typeof value === 'number') {
    return `${prefix}${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return value;
}

export default function KPICard({ title, value, change, icon: Icon, color, prefix = '£', isCount = false }) {
  const changeNum = parseFloat(change) || 0;
  const isPositive = changeNum >= 0;
  const hasChange = change !== undefined && change !== null;

  return (
    <div className="kpi-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {hasChange && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}{changeNum.toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {isCount ? value : formatValue(value, prefix)}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
      {hasChange && (
        <p className="text-xs text-gray-400">vs last month</p>
      )}
    </div>
  );
}
