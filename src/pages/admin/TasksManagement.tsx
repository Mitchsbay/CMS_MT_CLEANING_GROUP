import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { Database } from '../../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

export function TasksManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    job_id: '',
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    assigned_to: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResult, jobsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (jobsResult.error) throw jobsResult.error;

      setTasks(tasksResult.data);
      setJobs(jobsResult.data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        job_id: task.job_id || '',
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        assigned_to: task.assigned_to || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        job_id: '',
        title: '',
        description: '',
        status: 'pending',
        assigned_to: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        job_id: formData.job_id || null,
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
        showToast('success', 'Task updated successfully');
      } else {
        const { error } = await supabase.from('tasks').insert(taskData);

        if (error) throw error;
        showToast('success', 'Task created successfully');
      }

      handleCloseModal();
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;
      showToast('success', 'Task deleted successfully');
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track cleaning tasks
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <Card key={task.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h3>
                <Badge variant={getStatusVariant(task.status)} icon={getStatusIcon(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(task)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(task.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks found. Create your first task to get started.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Select
            label="Job"
            value={formData.job_id}
            onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
          >
            <option value="">No job assigned</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            required
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
