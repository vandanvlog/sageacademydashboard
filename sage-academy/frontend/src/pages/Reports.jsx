import { useState } from 'react';
import { Printer, PoundSterling, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';

const fmt = (n) =>
  `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
const months = [
  { value: '', label: 'All Months' },
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function KPITile({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xl font-bold text-gray-900">{fmt(value)}</p>
      <p className="text-xs text-gray-400 mt-0.5">{title}</p>
    </div>
  );
}

export default function Reports() {
  const [filters, setFilters] = useState({ year: String(currentYear), month: '', course_id: '', payment_method_id: '' });
  const { data: courses } = useApi('/courses');
  const { data: paymentMethods } = useApi('/payment-methods');
  const { data: report, loading } = useApi('/reports/summary', filters);

  const handleFilter = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const kpis = report?.kpis || {};
  const income = report?.income || [];
  const expenses = report?.expenses || [];

  return (
    <div className="space-y-6">
      {/* Filter panel */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Year</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilter}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Month</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilter}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Course</label>
            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilter}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">All Courses</option>
              {(courses || []).map((c) => (
                <option key={c.id} value={c.id}>{c.course_name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Payment Method</label>
            <select
              name="payment_method_id"
              value={filters.payment_method_id}
              onChange={handleFilter}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">All Methods</option>
              {(paymentMethods || []).map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
          </div>

          <Button variant="secondary" onClick={() => window.print()} className="ml-auto">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPITile title="Gross Revenue" value={kpis.gross_revenue} icon={TrendingUp} color="bg-brand-primary" />
            <KPITile title="Net Revenue" value={kpis.net_revenue} icon={PoundSterling} color="bg-indigo-400" />
            <KPITile title="Total Expenses" value={kpis.total_expenses} icon={TrendingDown} color="bg-brand-danger" />
            <KPITile title="Net Profit" value={kpis.net_profit} icon={BarChart2} color="bg-brand-success" />
          </div>

          {/* Fee note */}
          {kpis.total_fees > 0 && (
            <p className="text-xs text-gray-400">
              Transaction fees deducted: <strong>{fmt(kpis.total_fees)}</strong>
            </p>
          )}

          {/* Tables side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
              <p className="section-title">
                Income Records
                <span className="ml-2 text-xs font-normal text-gray-400">({kpis.income_count || 0} records)</span>
              </p>
              <Table
                columns={[
                  { key: 'payment_date', label: 'Date', render: (v) => fmtDate(v) },
                  { key: 'payer_name', label: 'Payer' },
                  { key: 'course_name', label: 'Course' },
                  { key: 'payment_method_name', label: 'Method' },
                  {
                    key: 'net_amount',
                    label: 'Net',
                    render: (v) => <span className="font-semibold text-emerald-600">{fmt(v)}</span>,
                  },
                ]}
                data={income}
                emptyMessage="No income records"
              />
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
              <p className="section-title">
                Expense Records
                <span className="ml-2 text-xs font-normal text-gray-400">({kpis.expense_count || 0} records)</span>
              </p>
              <Table
                columns={[
                  { key: 'expense_date', label: 'Date', render: (v) => fmtDate(v) },
                  { key: 'description', label: 'Description' },
                  { key: 'category_name', label: 'Category' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (v) => <span className="font-semibold text-red-500">{fmt(v)}</span>,
                  },
                ]}
                data={expenses}
                emptyMessage="No expense records"
              />
            </div>
          </div>

          {/* Breakdowns */}
          {(report?.income_by_method?.length > 0 || report?.expenses_by_category?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {report?.income_by_method?.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
                  <p className="section-title">Income by Payment Method</p>
                  <div className="space-y-2">
                    {report.income_by_method.map((row) => (
                      <div key={row.method} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{row.method}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{row.count} records</span>
                          <span className="font-semibold text-gray-900">{fmt(row.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report?.expenses_by_category?.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card">
                  <p className="section-title">Expenses by Category</p>
                  <div className="space-y-2">
                    {report.expenses_by_category.map((row) => (
                      <div key={row.category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{row.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{row.count} records</span>
                          <span className="font-semibold text-gray-900">{fmt(row.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            To save as PDF: use browser print (Ctrl+P / Cmd+P) and select "Save as PDF"
          </p>
        </>
      )}
    </div>
  );
}
