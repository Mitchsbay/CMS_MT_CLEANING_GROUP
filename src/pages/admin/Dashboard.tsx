import { useEffect, useState } from 'react';
import { Calendar, Users, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Link } from '../../components/Router';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  activeIncidents: number;
  totalStaff: number;
  totalSites: number;
}

interface RecentJob {
  id: string;
  site: { name: string };
  assigned_to: { full_name: string };
  status: string;
  scheduled_date: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    activeIncidents: 0,
    totalStaff: 0,
    totalSites: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [jobsResult, activeJobsResult, completedTodayResult, incidentsResult, staffResult, sitesResult, recentJobsResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', today),
        supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'staff').eq('status', 'active'),
        supabase.from('sites').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase
          .from('jobs')
          .select(`
            id,
            status,
            scheduled_date,
            site:sites(name),
            assigned_to:profiles!jobs_assigned_to_fkey(full_name)
          `)
          .order('scheduled_date', { ascending: false })
          .limit(10)
      ]);

      setStats({
        totalJobs: jobsResult.count || 0,
        activeJobs: activeJobsResult.count || 0,
        completedToday: completedTodayResult.count || 0,
        activeIncidents: incidentsResult.count || 0,
        totalStaff: staffResult.count || 0,
        totalSites: sitesResult.count || 0,
      });

      setRecentJobs(recentJobsResult.data as any || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Calendar, color: 'text-blue-600' },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Clock, color: 'text-yellow-600' },
    { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Active Incidents', value: stats.activeIncidents, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Active Staff', value: stats.totalStaff, icon: Users, color: 'text-blue-600' },
    { label: 'Active Sites', value: stats.totalSites, icon: MapPin, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Overview of your cleaning management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Recent Jobs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Site
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Assigned To
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Date
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
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {job.site?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {job.assigned_to?.full_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(job.scheduled_date)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/admin/jobs/${job.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No jobs found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
