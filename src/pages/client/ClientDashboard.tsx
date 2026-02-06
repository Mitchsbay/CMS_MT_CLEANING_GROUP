import { useEffect, useState } from 'react';
import { MapPin, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

type Site = Database['public']['Tables']['sites']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'] & {
  site?: Site;
};

export function ClientDashboard() {
  const { user } = useAuth();
  const [clientSites, setClientSites] = useState<Site[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadClientData();
    }
  }, [user]);

  const loadClientData = async () => {
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .ilike('contact_email', user!.email)
        .maybeSingle();

      if (clientError) throw clientError;

      if (client) {
        const [sitesResult, jobsResult] = await Promise.all([
          supabase
            .from('sites')
            .select('*')
            .eq('client_id', client.id)
            .eq('active', true)
            .order('name'),
          supabase
            .from('jobs')
            .select(`
              *,
              site:sites(*)
            `)
            .eq('status', 'completed')
            .in('site_id',
              await supabase
                .from('sites')
                .select('id')
                .eq('client_id', client.id)
                .then(r => r.data?.map(s => s.id) || [])
            )
            .order('scheduled_date', { ascending: false })
            .limit(10)
        ]);

        if (sitesResult.error) throw sitesResult.error;
        if (jobsResult.error) throw jobsResult.error;

        setClientSites(sitesResult.data || []);
        setRecentJobs(jobsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View your sites and completed cleaning jobs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sites</h2>
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {clientSites.length > 0 ? (
            <div className="space-y-3">
              {clientSites.map((site) => (
                <div
                  key={site.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {site.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {site.address}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No active sites</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Completed Jobs
            </h2>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {recentJobs.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recent completions
            </p>
          </div>
        </Card>
      </div>

      <Card title="Recent Completed Jobs">
        {recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to={`/client/jobs/${job.id}`}
                className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {job.site?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {job.site?.address}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No completed jobs to display
          </p>
        )}
      </Card>
    </div>
  );
}
