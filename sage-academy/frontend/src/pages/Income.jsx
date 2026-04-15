import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge, { statusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import IncomeForm from '../components/forms/IncomeForm';

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

export default function Income() {
  const [filters, setFilters] = useState({ course_id: '', payment_method_id: '', month: '', year: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { data: income, loading, refetch } = useApi('/income', filters);
  const { data: courses } = useApi('/courses');
  const { data: paymentMethods } = useApi('/payment-methods');

  const handleFilter = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAdd = () => { setEditRecord(null); setModalOpen(true); };
  const openEdit = (rec) => { setEditRecord(rec); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditRecord(null); };

  const handleSuccess = () => {
    closeModal();
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await client.delete(`/income/${id}`);
      toast.success('Income record deleted');
      refetch();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const columns = [
    { key: 'payment_date', label: 'Date', render: (v) => fmtDate(v) },
    { key: 'payer_name', label: 'Payer' },
    { key: 'course_name', label: 'Course' },
    { key: 'payment_method_name', label: 'Method' },
    {
      key: 'payment_type',
      label: 'Type',
      render: (v) => <Badge variant={statusBadge(v)}>{v}</Badge>,
    },
    {
      key: 'gross_amount',
      label: 'Gross',
      render: (v) => fmt(v),
    },
    {
      key: 'transaction_fee',
      label: 'Fee',
      render: (v) => <span className="text-gray-400">{fmt(v)}</span>,
    },
    {
      key: 'net_amount',
      label: 'Net',
      render: (v) => <span className="font-semibold text-emerald-600">{fmt(v)}</span>,
    },
    {
      key: 'installment_status',
      label: 'Status',
      render: (v) => <Badge variant={statusBadge(v)}>{v}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-gray-400 hover:text-brand-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Filter + Add bar */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3">
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

          <select
            name="year"
            value={filters.year}
            onChange={handleFilter}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

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

        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Income
        </Button>
      </div>

      {/* Summary */}
      {income && (
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{income.length} record{income.length !== 1 ? 's' : ''}</span>
          <span>Total net: <strong className="text-emerald-600">
            {fmt(income.reduce((s, r) => s + parseFloat(r.net_amount || 0), 0))}
          </strong></span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={income || []} emptyMessage="No income records match your filters" />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editRecord ? 'Edit Income Record' : 'Add Income Record'}
        size="lg"
      >
        <IncomeForm record={editRecord} onSuccess={handleSuccess} onCancel={closeModal} />
      </Modal>
    </div>
  );
}
