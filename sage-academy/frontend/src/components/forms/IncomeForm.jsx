import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const initialState = {
  payment_date: '',
  payer_name: '',
  course_id: '',
  payment_method_id: '',
  payment_type: 'Full',
  installment_status: 'N/A',
  gross_amount: '',
  transaction_fee: '0',
  notes: '',
};

export default function IncomeForm({ record, onSuccess, onCancel }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    Promise.all([
      client.get('/courses'),
      client.get('/payment-methods'),
    ]).then(([cRes, pmRes]) => {
      setCourses(cRes.data.filter((c) => c.status !== 'Inactive'));
      setPaymentMethods(pmRes.data);
    });
  }, []);

  useEffect(() => {
    if (record) {
      setForm({
        payment_date: record.payment_date?.split('T')[0] || '',
        payer_name: record.payer_name || '',
        course_id: record.course_id || '',
        payment_method_id: record.payment_method_id || '',
        payment_type: record.payment_type || 'Full',
        installment_status: record.installment_status || 'N/A',
        gross_amount: record.gross_amount || '',
        transaction_fee: record.transaction_fee || '0',
        notes: record.notes || '',
      });
    }
  }, [record]);

  const netAmount =
    (parseFloat(form.gross_amount) || 0) - (parseFloat(form.transaction_fee) || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'payment_type') {
        updated.installment_status = value === 'Full' ? 'N/A' : 'Pending';
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.payment_date) errs.payment_date = 'Payment date is required';
    if (!form.payer_name.trim()) errs.payer_name = 'Payer name is required';
    if (!form.course_id) errs.course_id = 'Course is required';
    if (!form.payment_method_id) errs.payment_method_id = 'Payment method is required';
    if (!form.payment_type) errs.payment_type = 'Payment type is required';
    if (!form.gross_amount || parseFloat(form.gross_amount) <= 0)
      errs.gross_amount = 'Gross amount must be greater than 0';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (record) {
        await client.put(`/income/${record.id}`, form);
        toast.success('Income record updated');
      } else {
        await client.post('/income', form);
        toast.success('Income record added');
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
          label="Payment Date"
          type="date"
          name="payment_date"
          value={form.payment_date}
          onChange={handleChange}
          error={errors.payment_date}
          required
        />
        <Input
          label="Payer Name"
          type="text"
          name="payer_name"
          value={form.payer_name}
          onChange={handleChange}
          placeholder="Dr. John Smith"
          error={errors.payer_name}
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

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Payment Method"
          name="payment_method_id"
          value={form.payment_method_id}
          onChange={handleChange}
          error={errors.payment_method_id}
          required
          placeholder="Select method"
        >
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </Select>

        <Select
          label="Payment Type"
          name="payment_type"
          value={form.payment_type}
          onChange={handleChange}
          error={errors.payment_type}
          required
        >
          <option value="Full">Full</option>
          <option value="Installment">Installment</option>
        </Select>
      </div>

      {form.payment_type === 'Installment' && (
        <Select
          label="Installment Status"
          name="installment_status"
          value={form.installment_status}
          onChange={handleChange}
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </Select>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Gross Amount (£)"
          type="number"
          name="gross_amount"
          value={form.gross_amount}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors.gross_amount}
          required
        />
        <Input
          label="Transaction Fee (£)"
          type="number"
          name="transaction_fee"
          value={form.transaction_fee}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        <Input
          label="Net Amount (£)"
          type="text"
          value={netAmount.toFixed(2)}
          readOnly
          disabled
          hint="Auto-calculated"
        />
      </div>

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
          {record ? 'Update Income' : 'Add Income'}
        </Button>
      </div>
    </form>
  );
}
