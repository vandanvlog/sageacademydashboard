import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function CategoryForm({ record, onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) setName(record.name || '');
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }

    setLoading(true);
    try {
      if (record) {
        await client.put(`/categories/${record.id}`, { name, status: record.status });
        toast.success('Category updated');
      } else {
        await client.post('/categories', { name });
        toast.success('Category added');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setError(''); }}
        placeholder="Category name"
        error={error}
        className="flex-1"
      />
      <Button type="submit" loading={loading} size="sm">
        {record ? 'Update' : 'Add'}
      </Button>
      {onCancel && (
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
