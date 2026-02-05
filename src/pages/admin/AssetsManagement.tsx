import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Package, MapPin } from 'lucide-react';
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

type Asset = Database['public']['Tables']['assets']['Row'];
type Site = Database['public']['Tables']['sites']['Row'];

export function AssetsManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_type: '',
    serial_number: '',
    purchase_date: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance' | 'retired',
    site_id: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assetsResult, sitesResult] = await Promise.all([
        supabase
          .from('assets')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('sites')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (assetsResult.error) throw assetsResult.error;
      if (sitesResult.error) throw sitesResult.error;

      setAssets(assetsResult.data);
      setSites(sitesResult.data);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name || '',
        description: asset.description || '',
        asset_type: asset.asset_type || '',
        serial_number: asset.serial_number || '',
        purchase_date: asset.purchase_date || '',
        status: asset.status || 'available',
        site_id: asset.site_id || '',
        notes: asset.notes || '',
      });
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        description: '',
        asset_type: '',
        serial_number: '',
        purchase_date: '',
        status: 'available',
        site_id: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assetData = {
        name: formData.name,
        description: formData.description || null,
        asset_type: formData.asset_type || null,
        serial_number: formData.serial_number || null,
        purchase_date: formData.purchase_date || null,
        status: formData.status,
        site_id: formData.site_id || null,
        notes: formData.notes || null,
      };

      if (editingAsset) {
        const { error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingAsset.id);

        if (error) throw error;
        showToast('success', 'Asset updated successfully');
      } else {
        const { error } = await supabase.from('assets').insert(assetData);

        if (error) throw error;
        showToast('success', 'Asset created successfully');
      }

      handleCloseModal();
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase.from('assets').delete().eq('id', assetId);

      if (error) throw error;
      showToast('success', 'Asset deleted successfully');
      await loadData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_use':
        return 'warning';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assets Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage cleaning equipment and assets
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {asset.name}
                    </h3>
                    {asset.asset_type && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {asset.asset_type}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusVariant(asset.status)}>
                  {asset.status.replace('_', ' ')}
                </Badge>
              </div>

              {asset.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {asset.description}
                </p>
              )}

              {asset.serial_number && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  SN: {asset.serial_number}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(asset)}
                  icon={<Edit2 className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(asset.id)}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {assets.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No assets found. Add your first asset to get started.
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingAsset ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Asset Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Asset Type"
            value={formData.asset_type}
            onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
            helperText="e.g., Vacuum Cleaner, Floor Polisher, Pressure Washer"
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Serial Number"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            />

            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            required
          >
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </Select>

          <Select
            label="Assigned Site"
            value={formData.site_id}
            onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
          >
            <option value="">No site assigned</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>

          <TextArea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            helperText="Additional information, maintenance history, etc."
          />
        </form>
      </Modal>
    </div>
  );
}
