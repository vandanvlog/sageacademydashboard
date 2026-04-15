import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const initialState = {
  expense_date: '',
  course_id: '',
  category_id: '',
  description: '',
  vendor: '',
  amount: '',
  notes: '',
};

export default function ExpenseForm({ record, onSuccess, onCancel }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      client.get('/courses'),
      client.get('/categories'),
    ]).then(([cRes, catRes]) => {
      setCourses(cRes.data.filter((c) => c.status !== 'Inactive'));
      setCategories(catRes.data);
    });
  }, []);

  useEffect(() => {
    if (record) {
      setForm({
        expense_date: record.expense_date?.split('T')[0] || '',
        course_id: record.course_id || '',
        category_id: record.category_id || '',
        description: record.description || '',
        vendor: record.vendor || '',
        amount: record.amount || '',
        notes: record.notes || '',
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.expense_date) errs.expense_date = 'Expense date is required';
    if (!form.course_id) errs.course_id = 'Course is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.amount || parseFloat(form.amount) <= 0)
      errs.amount = 'Amount must be greater than 0';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (record) {
        await client.put(`/expenses/${record.id}`, form);
        toast.success('Expense record updated');
      } else {
        await client.post('/expenses', form);
        toast.success('Expense record added');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expense Date"
          type="date"
          name="expense_date"
          value={form.expense_date}
          onChange={handleChange}
          error={errors.expense_date}
          required
        />
        <Input
          label="Amount (£)"
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors.amount}
          required
        />
      </div>

      <Select
        label="Course"
        name="course_id"
        value={form.course_id}
        onChange={handleChange}
        error={errors.course_id}
        required
        placeholder="Select course"
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.course_name}</option>
        ))}
      </Select>

      <Select
        label="Category"
        name="category_id"
        value={form.category_id}
        onChange={handleChange}
        error={errors.category_id}
        required
        placeholder="Select category"
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </Select>

      <Input
        label="Description"
        type="text"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="e.g. Venue hire for training day"
        error={errors.description}
        required
      />

      <Input
        label="Vendor"
        type="text"
        name="vendor"
        value={form.vendor}
        onChange={handleChange}
        placeholder="e.g. Hilton Hotel (optional)"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Optional notes..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {record ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
