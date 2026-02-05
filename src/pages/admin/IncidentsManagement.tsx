import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { Database } from '../../lib/database.types';

type Incident = Database['public']['Tables']['incidents']['Row'];
type Site = Database['public']['Tables']['sites']['Row'];

export function IncidentsManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const { showToast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'low' as Incident['severity'],
    status: 'open' as Incident['status'],
    site_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incidentsResult, sitesResult] = await Promise.all([
        supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('sites')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (incidentsResult.error) throw incidentsResult.error;
      if (sitesResult.error) throw sitesResult.error;

      setIncidents(incidentsResult.data);
      setSites(sitesResult.data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident);
      setFormData({
        title: incident.title || '',
        description: incident.description || '',
        severity: incident.severity || 'low',
        status: incident.status || 'open',
        site_id: incident.site_id || '',
      });
    } else {
      setEditingIncident(null);
      setFormData({
        title: '',
        description: '',
        severity: 'low',
        status: 'open',
        site_id: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIncident(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const incidentData = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        site_id: formData.site_id || null,
        reported_by: profile.id,
      };

      if (editingIncident) {
        const { error } = await supabase
          .from('incidents')
          .update(incidentData)
          .eq('id', editingIncident.id);

        if (error) throw error;
        showToast('success', 'Incident updated successfully');
      } else {
        const { error } = await supabase.from('incidents').insert(incidentData);

        if (error) throw error;
        showToast('success', 'Incident created successfully');
      }

      handleCloseModal();
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;

    try {
      const { error } = await supabase.from('incidents').delete().eq('id', incidentId);

      if (error) throw error;
      showToast('success', 'Incident deleted successfully');
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'success';
      case 'investigating':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Incidents Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and manage incidents and safety reports
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.map((incident) => (
          <Card key={incident.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {incident.title}
                </h3>
                <Badge variant={getSeverityVariant(incident.severity)} icon={<AlertTriangle className="h-4 w-4" />}>
                  {incident.severity}
                </Badge>
              </div>

              <Badge variant={getStatusVariant(incident.status)}>
                {incident.status}
              </Badge>

              {incident.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {incident.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(incident)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(incident.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {incidents.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No incidents reported. All systems operational.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingIncident ? 'Edit Incident' : 'Report Incident'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingIncident ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Incident Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            helperText="Provide detailed information about the incident"
          />

          <Select
            label="Site"
            value={formData.site_id}
            onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
          >
            <option value="">No site specified</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>

          <Select
            label="Severity"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            required
          >
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
