import { useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import Modal from '../components/ui/Modal';
import Badge, { statusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CourseForm from '../components/forms/CourseForm';

export default function Courses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: courses, loading, refetch } = useApi('/courses');

  const filteredCourses = (courses || []).filter((c) =>
    statusFilter ? c.status === statusFilter : true
  );

  const openAdd = () => { setEditRecord(null); setModalOpen(true); };
  const openEdit = (rec) => { setEditRecord(rec); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditRecord(null); };
  const handleSuccess = () => { closeModal(); refetch(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this course?')) return;
    try {
      await client.delete(`/courses/${id}`);
      toast.success('Course deactivated');
      refetch();
    } catch {
      toast.error('Failed to deactivate course');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {['', 'Active', 'Inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Course
        </Button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No courses found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editRecord ? 'Edit Course' : 'Create Course'}
      >
        <CourseForm record={editRecord} onSuccess={handleSuccess} onCancel={closeModal} />
      </Modal>
    </div>
  );
}

function CourseCard({ course, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{course.course_name}</h3>
          <Badge variant={statusBadge(course.status)}>{course.status}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-2">
          <User className="w-3 h-3" />
          <span>{course.lecturer_name}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={() => onEdit(course)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-indigo-50 hover:text-brand-primary hover:border-indigo-200 transition-colors"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button
          onClick={() => onDelete(course.id)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-red-50 hover:text-brand-danger hover:border-red-200 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Deactivate
        </button>
      </div>
    </div>
  );
}
