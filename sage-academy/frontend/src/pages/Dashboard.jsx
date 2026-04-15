import { useState } from 'react';
import { PoundSterling, TrendingDown, BarChart2, BookOpen, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import KPICard from '../components/ui/KPICard';
import Table from '../components/ui/Table';
import Badge, { statusBadge } from '../components/ui/Badge';
import RevenueChart from '../components/charts/RevenueChart';
import ExpenseChart from '../components/charts/ExpenseChart';
import ProfitChart from '../components/charts/ProfitChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

const fmt = (n) =>
  `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState('all');

  const isAllTime = year === 'all';

  const { data, loading } = useApi('/dashboard', { year });

  const kpis               = data?.kpis               || {};
  const revenueByMonth     = data?.revenue_by_month    || [];
  const expensesByMonth    = data?.expenses_by_month   || [];
  const profitByMonth      = data?.profit_by_month     || [];
  const expenseByCategory  = data?.expense_by_category || [];
  const recentIncome       = data?.recent_income       || [];
  const recentExpenses     = data?.recent_expenses     || [];
  const topCourses         = data?.top_courses         || [];
  const pendingInstallments = data?.pending_installments || [];

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const kpiTitle = (label) => {
    if (isAllTime) return `${label} (All Time)`;
    if (year === currentYear) return `${label} (YTD)`;
    return `${label} (${year})`;
  };

  const handleYearChange = (e) => {
    const v = e.target.value;
    setYear(v === 'all' ? 'all' : Number(v));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isAllTime
            ? 'Showing all time data'
            : <>Showing data for <span className="font-semibold text-gray-700">{year}</span></>}
        </p>
        <select
          value={year}
          onChange={handleYearChange}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="all">All Time</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title={kpiTitle('Total Revenue')}
          value={kpis.total_revenue}
          change={isAllTime ? null : kpis.revenue_change}
          icon={PoundSterling}
          color="bg-brand-primary"
        />
        <KPICard
          title={kpiTitle('Total Expenses')}
          value={kpis.total_expenses}
          change={isAllTime ? null : kpis.expenses_change}
          icon={TrendingDown}
          color="bg-brand-danger"
        />
        <KPICard
          title={kpiTitle('Net Profit')}
          value={kpis.net_profit}
          change={isAllTime ? null : kpis.profit_change}
          icon={BarChart2}
          color="bg-brand-success"
        />
        <KPICard
          title="Active Courses"
          value={kpis.active_courses}
          icon={BookOpen}
          color="bg-brand-warning"
          isCount
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <p className="section-title">{isAllTime ? 'Revenue by Year' : 'Revenue by Month'}</p>
          <RevenueChart data={revenueByMonth} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <p className="section-title">{isAllTime ? 'Expenses by Year' : 'Expenses by Month'}</p>
          <ExpenseChart data={expensesByMonth} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <p className="section-title">{isAllTime ? 'Profit by Year' : 'Profit by Month'}</p>
          <ProfitChart data={profitByMonth} />
        </div>
      </div>

      {/* Expense by Category */}
      <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
        <p className="section-title">Expenses by Category</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <CategoryPieChart data={expenseByCategory} />
          <div className="space-y-2">
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-gray-400">No expense data</p>
            ) : (
              expenseByCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{item.percentage}%</span>
                    <span className="font-semibold text-gray-900">{fmt(item.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <p className="section-title">Recent Income</p>
          <Table
            columns={[
              { key: 'payment_date', label: 'Date', render: (v) => fmtDate(v) },
              { key: 'payer_name',   label: 'Payer' },
              { key: 'course_name',  label: 'Course' },
              {
                key: 'net_amount',
                label: 'Net',
                render: (v) => <span className="font-semibold text-emerald-600">{fmt(v)}</span>,
              },
            ]}
            data={recentIncome}
            emptyMessage="No income records yet"
          />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <p className="section-title">Recent Expenses</p>
          <Table
            columns={[
              { key: 'expense_date',  label: 'Date',        render: (v) => fmtDate(v) },
              { key: 'description',   label: 'Description' },
              { key: 'category_name', label: 'Category' },
              {
                key: 'amount',
                label: 'Amount',
                render: (v) => <span className="font-semibold text-red-500">{fmt(v)}</span>,
              },
            ]}
            data={recentExpenses}
            emptyMessage="No expense records yet"
          />
        </div>
      </div>

      {/* Top Courses */}
      <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
        <p className="section-title">Top Courses by Profit</p>
        <Table
          columns={[
            { key: 'course_name', label: 'Course' },
            { key: 'status',      label: 'Status',   render: (v) => <Badge variant={statusBadge(v)}>{v}</Badge> },
            { key: 'revenue',     label: 'Revenue',  render: (v) => fmt(v) },
            { key: 'expenses',    label: 'Expenses', render: (v) => fmt(v) },
            {
              key: 'profit',
              label: 'Profit',
              render: (v) => (
                <span className={`font-bold ${v >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmt(v)}
                </span>
              ),
            },
          ]}
          data={topCourses}
          emptyMessage="No courses yet"
        />
      </div>

      {/* Pending Installments */}
      {pendingInstallments.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-card border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-base font-semibold text-gray-800">
              Pending Installments
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingInstallments.length}
              </span>
            </p>
          </div>
          <Table
            columns={[
              { key: 'payment_date',      label: 'Date',   render: (v) => fmtDate(v) },
              { key: 'payer_name',         label: 'Payer' },
              { key: 'course_name',        label: 'Course' },
              { key: 'payment_method_name', label: 'Method' },
              {
                key: 'gross_amount',
                label: 'Amount',
                render: (v) => <span className="font-semibold">{fmt(v)}</span>,
              },
              {
                key: 'installment_status',
                label: 'Status',
                render: (v) => <Badge variant="amber">{v}</Badge>,
              },
            ]}
            data={pendingInstallments}
            rowClassName={() => 'bg-amber-50/30'}
          />
        </div>
      )}
    </div>
  );
}
