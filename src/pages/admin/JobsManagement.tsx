import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';

export function JobsManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          site:sites(name, address),
          assigned_to:profiles!jobs_assigned_to_fkey(full_name)
        `)
        .order('scheduled_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
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
        <Button icon={<Plus className="h-4 w-4" />}>
          Create Job
        </Button>
      </div>

      <Card>
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
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
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
                </tr>
              ))}
            </tbody>
          </table>

          {jobs.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No jobs found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
