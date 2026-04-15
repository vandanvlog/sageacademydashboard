const variants = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.gray}`}
    >
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    Active: 'green',
    Completed: 'blue',
    Cancelled: 'red',
    Pending: 'amber',
    'N/A': 'gray',
    Full: 'indigo',
    Installment: 'amber',
    active: 'green',
    inactive: 'gray',
  };
  return map[status] || 'gray';
}
