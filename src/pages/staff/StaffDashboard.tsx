import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Link } from '../../components/Router';

interface Job {
  id: string;
  site: { name: string; address: string; latitude: number; longitude: number };
  scheduled_date: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  status: string;
  notes: string | null;
}

export function StaffDashboard() {
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const loadJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: todayData, error: todayError } = await supabase
        .from('jobs')
        .select(`
          id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          status,
          notes,
          site:sites(name, address, latitude, longitude)
        `)
        .eq('assigned_to', user?.id)
        .eq('scheduled_date', today)
        .order('scheduled_start_time', { ascending: true });

      if (todayError) throw todayError;

      const { data: upcomingData, error: upcomingError } = await supabase
        .from('jobs')
        .select(`
          id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          status,
          notes,
          site:sites(name, address, latitude, longitude)
        `)
        .eq('assigned_to', user?.id)
        .gt('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(10);

      if (upcomingError) throw upcomingError;

      setTodayJobs(todayData as any || []);
      setUpcomingJobs(upcomingData as any || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  const JobCard = ({ job }: { job: Job }) => (
    <Card>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {job.site?.name}
          </h3>
          <Badge className={getStatusColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{job.site?.address}</p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <p>{formatDate(job.scheduled_date)}</p>
          </div>

          {job.scheduled_start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <p>
                {job.scheduled_start_time}
                {job.scheduled_end_time && ` - ${job.scheduled_end_time}`}
              </p>
            </div>
          )}
        </div>

        {job.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            Note: {job.notes}
          </p>
        )}

        <Link to={`/staff/jobs/${job.id}`}>
          <Button fullWidth size="sm">
            {job.status === 'pending' ? 'Start Job' : 'View Details'}
          </Button>
        </Link>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Jobs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage your assigned cleaning jobs
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Jobs ({todayJobs.length})
        </h2>

        {todayJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No jobs scheduled for today</p>
            </div>
          </Card>
        )}
      </div>

      {upcomingJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Jobs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
