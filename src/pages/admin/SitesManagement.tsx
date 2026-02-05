import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { Database } from '../../lib/database.types';

type Site = Database['public']['Tables']['sites']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'];
};
type Client = Database['public']['Tables']['clients']['Row'];

export function SitesManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    client_id: '',
    instructions: '',
    active: true,
  });

  useEffect(() => {
    loadSites();
    loadClients();
  }, []);

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const geocodeAddress = async () => {
    if (!formData.address) {
      showToast('error', 'Please enter an address first');
      return;
    }

    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
    if (!apiKey || apiKey === 'your_opencage_api_key_here') {
      showToast('error', 'OpenCage API key not configured. Please add VITE_OPENCAGE_API_KEY to your .env file.');
      return;
    }

    setGeocoding(true);

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(formData.address)}&key=${apiKey}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        setFormData({
          ...formData,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
        showToast('success', 'Address geocoded successfully');
      } else {
        showToast('error', 'Address not found. Please check the address and try again.');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to geocode address');
    } finally {
      setGeocoding(false);
    }
  };

  const handleOpenModal = (site?: Site) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        name: site.name || '',
        address: site.address || '',
        latitude: site.latitude?.toString() || '',
        longitude: site.longitude?.toString() || '',
        client_id: site.client_id || '',
        instructions: site.instructions || '',
        active: site.active ?? true,
      });
    } else {
      setEditingSite(null);
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        client_id: '',
        instructions: '',
        active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSite(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const siteData = {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        client_id: formData.client_id || null,
        instructions: formData.instructions || null,
        active: formData.active,
      };

      if (editingSite) {
        const { error } = await supabase
          .from('sites')
          .update(siteData)
          .eq('id', editingSite.id);

        if (error) throw error;
        showToast('success', 'Site updated successfully');
      } else {
        const { error } = await supabase.from('sites').insert(siteData);

        if (error) throw error;
        showToast('success', 'Site created successfully');
      }

      handleCloseModal();
      await loadSites();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const { error } = await supabase.from('sites').delete().eq('id', siteId);

      if (error) throw error;
      showToast('success', 'Site deleted successfully');
      await loadSites();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sites Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage cleaning locations and their details
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Add Site
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <Card key={site.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {site.name}
                </h3>
                <Badge variant={site.active ? 'success' : 'default'}>
                  {site.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {site.client && (
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {site.client.name}
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{site.address}</p>
              </div>

              {site.latitude && site.longitude && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  GPS: {site.latitude}, {site.longitude}
                </div>
              )}

              {site.instructions && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {site.instructions}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(site)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(site.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sites.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No sites found. Create your first site to get started.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSite ? 'Edit Site' : 'Add Site'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingSite ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Site Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Client"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
          >
            <option value="">No Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>

          <div>
            <TextArea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={2}
            />
            <Button
              type="button"
              onClick={geocodeAddress}
              loading={geocoding}
              icon={<Navigation className="h-4 w-4" />}
              variant="outline"
              className="mt-2"
            >
              Geocode Address
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              helperText="e.g., -33.8688"
            />

            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              helperText="e.g., 151.2093"
            />
          </div>

          <TextArea
            label="Special Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={3}
            helperText="Any special cleaning requirements or access instructions"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
              Site is active
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
