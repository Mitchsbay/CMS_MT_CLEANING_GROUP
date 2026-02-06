import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function StaffManagement() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff' | 'client',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterStaffList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, searchTerm, filterRole, filterStatus]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterStaffList = () => {
    let filtered = staff;

    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.full_name || '').toLowerCase().includes(st) ||
          (s.phone && s.phone.includes(searchTerm))
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((s) => s.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    setFilteredStaff(filtered);
  };

  const handleOpenModal = (staffMember?: Profile) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        email: '',
        password: '',
        full_name: staffMember.full_name,
        phone: staffMember.phone || '',
        role: staffMember.role,
        status: staffMember.status,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'staff',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: formData.role,
            status: formData.status,
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        showToast('success', 'Staff member updated successfully');
      } else {
        // IMPORTANT: pass Authorization explicitly.
        // supabase-js usually attaches the bearer token automatically, but in some deployments
        // the header can be missing, causing a 401 from Edge Functions.
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('Not authenticated');

        const { error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: formData.role,
            status: formData.status,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (error) throw new Error(error.message || 'Failed to create user');

        showToast('success', 'Staff member created successfully');
      }

      handleCloseModal();
      await loadStaff();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      // IMPORTANT: use functions.invoke (includes apikey + bearer token)
      // IMPORTANT: payload key should be user_id (snake_case) unless your function expects something else
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: staffId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw new Error(error.message || 'Failed to delete user');

      showToast('success', 'Staff member deleted successfully');
      await loadStaff();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleToggleStatus = async (staffMember: Profile) => {
    try {
      const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', staffMember.id);

      if (error) throw error;

      showToast('success', `Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await loadStaff();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your team members and their access
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />}>
          Add Staff
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />

          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'staff', label: 'Staff' },
              { value: 'client', label: 'Client' },
            ]}
          />

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {staffMember.full_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {staffMember.phone || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="primary">{staffMember.role}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={staffMember.status === 'active' ? 'success' : 'default'}>
                      {staffMember.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(staffMember)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(staffMember)}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700"
                      >
                        {staffMember.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No staff members found
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingStaff ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingStaff && (
            <>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                helperText="Minimum 6 characters"
              />
            </>
          )}

          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' | 'client' })
            }
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'staff', label: 'Staff' },
              { value: 'client', label: 'Client' },
            ]}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}
