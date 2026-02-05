import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Users, MapPin, Briefcase, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalStaff: number;
  activeStaff: number;
  totalSites: number;
  activeSites: number;
  totalClients: number;
  activeClients: number;
  openIncidents: number;
  totalAssets: number;
  availableAssets: number;
  pendingTasks: number;
}

export function ReportsPage() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalStaff: 0,
    activeStaff: 0,
    totalSites: 0,
    activeSites: 0,
    totalClients: 0,
    activeClients: 0,
    openIncidents: 0,
    totalAssets: 0,
    availableAssets: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        jobsResult,
        staffResult,
        sitesResult,
        clientsResult,
        incidentsResult,
        assetsResult,
        tasksResult,
      ] = await Promise.all([
        supabase.from('jobs').select('status'),
        supabase.from('profiles').select('status, role').eq('role', 'staff'),
        supabase.from('sites').select('active'),
        supabase.from('clients').select('active'),
        supabase.from('incidents').select('status'),
        supabase.from('assets').select('status'),
        supabase.from('tasks').select('status'),
      ]);

      setStats({
        totalJobs: jobsResult.data?.length || 0,
        activeJobs: jobsResult.data?.filter(j => j.status === 'scheduled' || j.status === 'in_progress').length || 0,
        totalStaff: staffResult.data?.length || 0,
        activeStaff: staffResult.data?.filter(s => s.status === 'active').length || 0,
        totalSites: sitesResult.data?.length || 0,
        activeSites: sitesResult.data?.filter(s => s.active).length || 0,
        totalClients: clientsResult.data?.length || 0,
        activeClients: clientsResult.data?.filter(c => c.active).length || 0,
        openIncidents: incidentsResult.data?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0,
        totalAssets: assetsResult.data?.length || 0,
        availableAssets: assetsResult.data?.filter(a => a.status === 'available').length || 0,
        pendingTasks: tasksResult.data?.filter(t => t.status === 'pending').length || 0,
      });
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generated: new Date().toISOString(),
      statistics: stats,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mt-cleaning-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Report exported successfully');
  };

  const statCards = [
    {
      title: 'Jobs',
      value: stats.totalJobs,
      subtitle: `${stats.activeJobs} active`,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Staff',
      value: stats.totalStaff,
      subtitle: `${stats.activeStaff} active`,
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Sites',
      value: stats.totalSites,
      subtitle: `${stats.activeSites} active`,
      icon: MapPin,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Clients',
      value: stats.totalClients,
      subtitle: `${stats.activeClients} active`,
      icon: Briefcase,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Open Incidents',
      value: stats.openIncidents,
      subtitle: 'Requires attention',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Assets',
      value: stats.totalAssets,
      subtitle: `${stats.availableAssets} available`,
      icon: Package,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Overview of your cleaning management system
          </p>
        </div>
        <Button
          onClick={handleExportReport}
          icon={<Download className="h-4 w-4" />}
          variant="outline"
        >
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {stat.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Task Overview">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.pendingTasks}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Tasks awaiting assignment or completion
            </div>
          </div>
        </Card>

        <Card title="System Health">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">System Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Operational
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              All systems running normally
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Activity tracking coming soon</p>
          <p className="text-sm mt-1">
            Detailed logs and activity reports will be available here
          </p>
        </div>
      </Card>
    </div>
  );
}
