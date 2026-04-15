import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const initialState = {
  course_name: '',
  lecturer_name: '',
  status: 'Active',
};

export default function CourseForm({ record, onSuccess, onCancel }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        course_name: record.course_name || '',
        lecturer_name: record.lecturer_name || '',
        status: record.status || 'Active',
      });
    } else {
      setForm(initialState);
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.course_name.trim()) errs.course_name = 'Course name is required';
    if (!form.lecturer_name.trim()) errs.lecturer_name = 'Lecturer name is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (record) {
        await client.put(`/courses/${record.id}`, form);
        toast.success('Course updated');
      } else {
        await client.post('/courses', form);
        toast.success('Course created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Course Name"
        type="text"
        name="course_name"
        value={form.course_name}
        onChange={handleChange}
        placeholder="e.g. Periodontics"
        error={errors.course_name}
        required
      />
      <Input
        label="Lecturer Name"
        type="text"
        name="lecturer_name"
        value={form.lecturer_name}
        onChange={handleChange}
        placeholder="e.g. Vandan"
        error={errors.lecturer_name}
        required
      />
      <Select
        label="Status"
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {record ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
