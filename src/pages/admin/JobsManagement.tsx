import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, User } from 'lucide-react';
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

type Job = Database['public']['Tables']['jobs']['Row'];
type Site = Database['public']['Tables']['sites']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function JobsManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    site_id: '',
    assigned_to: '',
    scheduled_date: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    status: 'pending' as 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsResult, sitesResult, staffResult] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            *,
            site:sites(name, address),
            assigned_to_profile:profiles!jobs_assigned_to_fkey(full_name)
          `)
          .order('scheduled_date', { ascending: false })
          .limit(50),
        supabase
          .from('sites')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'staff')
          .eq('status', 'active')
          .order('full_name', { ascending: true }),
      ]);

      if (jobsResult.error) throw jobsResult.error;
      if (sitesResult.error) throw sitesResult.error;
      if (staffResult.error) throw staffResult.error;

      setJobs(jobsResult.data || []);
      setSites(sitesResult.data);
      setStaff(staffResult.data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (job?: any) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title || '',
        site_id: job.site_id || '',
        assigned_to: job.assigned_to || '',
        scheduled_date: job.scheduled_date || '',
        scheduled_start_time: job.scheduled_start_time || '',
        scheduled_end_time: job.scheduled_end_time || '',
        status: job.status || 'pending',
        notes: job.notes || '',
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        site_id: '',
        assigned_to: '',
        scheduled_date: '',
        scheduled_start_time: '',
        scheduled_end_time: '',
        status: 'pending',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        title: formData.title || null,
        site_id: formData.site_id,
        assigned_to: formData.assigned_to || null,
        scheduled_date: formData.scheduled_date,
        scheduled_start_time: formData.scheduled_start_time || null,
        scheduled_end_time: formData.scheduled_end_time || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingJob) {
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editingJob.id);

        if (error) throw error;
        showToast('success', 'Job updated successfully');
      } else {
        const { error } = await supabase.from('jobs').insert(jobData);

        if (error) throw error;
        showToast('success', 'Job created successfully');
      }

      handleCloseModal();
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) throw error;
      showToast('success', 'Job deleted successfully');
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
      case 'scheduled':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage all cleaning jobs
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Create Job
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <Card key={job.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.title || 'Untitled Job'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{job.site?.name || 'No site'}</span>
                  </div>
                </div>
                <Badge variant={getStatusVariant(job.status)}>
                  {job.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                  {job.scheduled_start_time && (
                    <span className="text-gray-500">
                      {job.scheduled_start_time} - {job.scheduled_end_time}
                    </span>
                  )}
                </div>
                {job.assigned_to_profile && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{job.assigned_to_profile.full_name}</span>
                  </div>
                )}
              </div>

              {job.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {job.notes}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(job)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(job.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No jobs found. Create your first job to get started.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingJob ? 'Edit Job' : 'Create Job'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingJob ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Job Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Weekly Office Cleaning"
          />

          <Select
            label="Site"
            value={formData.site_id}
            onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
            required
          >
            <option value="">Select a site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>

          <Select
            label="Assign to Staff"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
          >
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              required
            />

            <Input
              label="Start Time"
              type="time"
              value={formData.scheduled_start_time}
              onChange={(e) => setFormData({ ...formData, scheduled_start_time: e.target.value })}
            />

            <Input
              label="End Time"
              type="time"
              value={formData.scheduled_end_time}
              onChange={(e) => setFormData({ ...formData, scheduled_end_time: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            required
          >
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <TextArea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            helperText="Any special instructions or requirements"
          />
        </form>
      </Modal>
    </div>
  );
}
