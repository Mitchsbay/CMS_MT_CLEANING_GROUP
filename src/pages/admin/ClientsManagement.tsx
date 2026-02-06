import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Database } from '../../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

export function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            contact_email: formData.contact_email.trim().toLowerCase(),
            contact_phone: formData.contact_phone || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        showToast('success', 'Client updated successfully');
      } else {
        const { error } = await supabase.from('clients').insert({
          name: formData.name,
          contact_email: formData.contact_email.trim().toLowerCase(),
          contact_phone: formData.contact_phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        });

        if (error) throw error;
        showToast('success', 'Client created successfully');
      }

      handleCloseModal();
      await loadClients();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);

      if (error) throw error;
      showToast('success', 'Client deleted successfully');
      await loadClients();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your client organizations
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {client.name}
              </h3>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{client.contact_email}</p>
                {client.contact_phone && <p>{client.contact_phone}</p>}
                {client.address && <p className="text-xs">{client.address}</p>}
              </div>

              {client.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {client.notes}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(client)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(client.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {clients.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No clients found. Create your first client to get started.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingClient ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Client Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            required
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          />

          <TextArea
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
          />

          <TextArea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </form>
      </Modal>
    </div>
  );
}
