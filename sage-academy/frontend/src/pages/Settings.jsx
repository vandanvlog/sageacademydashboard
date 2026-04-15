import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import Badge, { statusBadge } from '../components/ui/Badge';
import CategoryForm from '../components/forms/CategoryForm';
import PaymentMethodForm from '../components/forms/PaymentMethodForm';

function SettingsSection({ title, items, loading, onRefetch, renderForm, onEdit, onDelete, editingId, setEditingId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Add form */}
      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
        <p className="text-xs text-gray-400 mb-2">Add new</p>
        {renderForm(null, () => { onRefetch(); })}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (items || []).length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No items yet</p>
        ) : (
          (items || []).map((item) => (
            <div key={item.id} className="px-5 py-3">
              {editingId === item.id ? (
                <div>
                  {renderForm(item, () => { setEditingId(null); onRefetch(); }, () => setEditingId(null))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <Badge variant={statusBadge(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-brand-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingPmId, setEditingPmId] = useState(null);

  const { data: categories, loading: catLoading, refetch: refetchCats } = useApi('/categories/all');
  const { data: paymentMethods, loading: pmLoading, refetch: refetchPms } = useApi('/payment-methods/all');

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    try {
      await client.delete(`/categories/${id}`);
      toast.success('Category deactivated');
      refetchCats();
    } catch {
      toast.error('Failed to deactivate category');
    }
  };

  const handleDeletePM = async (id) => {
    if (!window.confirm('Deactivate this payment method?')) return;
    try {
      await client.put(`/payment-methods/${id}`, { status: 'inactive', name: paymentMethods.find(p => p.id === id)?.name });
      toast.success('Payment method deactivated');
      refetchPms();
    } catch {
      toast.error('Failed to deactivate payment method');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Manage expense categories and payment methods.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingsSection
          title="Expense Categories"
          items={categories}
          loading={catLoading}
          onRefetch={refetchCats}
          editingId={editingCatId}
          setEditingId={setEditingCatId}
          renderForm={(record, onSuccess, onCancel) => (
            <CategoryForm record={record} onSuccess={onSuccess} onCancel={onCancel} />
          )}
          onDelete={handleDeleteCategory}
        />

        <SettingsSection
          title="Payment Methods"
          items={paymentMethods}
          loading={pmLoading}
          onRefetch={refetchPms}
          editingId={editingPmId}
          setEditingId={setEditingPmId}
          renderForm={(record, onSuccess, onCancel) => (
            <PaymentMethodForm record={record} onSuccess={onSuccess} onCancel={onCancel} />
          )}
          onDelete={handleDeletePM}
        />
      </div>
    </div>
  );
}
