import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Card } from '../../components/ui/Card';

type Job = Database['public']['Tables']['jobs']['Row'] & {
  site?: Database['public']['Tables']['sites']['Row'];
};
type JobPhoto = Database['public']['Tables']['job_photos']['Row'];
type CheckIn = Database['public']['Tables']['check_ins']['Row'];

export function ClientJobReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadJobReport();
    }
  }, [id]);

  const loadJobReport = async () => {
    try {
      const [jobResult, photosResult, checkInResult] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            *,
            site:sites(*)
          `)
          .eq('id', id!)
          .maybeSingle(),
        supabase
          .from('job_photos')
          .select('*')
          .eq('job_id', id!)
          .order('created_at'),
        supabase
          .from('check_ins')
          .select('*')
          .eq('job_id', id!)
          .maybeSingle()
      ]);

      if (jobResult.error) throw jobResult.error;
      if (photosResult.error) throw photosResult.error;

      setJob(jobResult.data);
      setPhotos(photosResult.data || []);
      setCheckIn(checkInResult.data);
    } catch (error) {
      console.error('Error loading job report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('job-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Job not found</p>
        <button
          onClick={() => navigate('/client')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/client')}
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Report</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Completed cleaning service details
        </p>
      </div>

      <Card title="Job Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Site
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{job.site?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Date
            </label>
            <div className="mt-1 flex items-center text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {new Date(job.scheduled_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Location
            </label>
            <div className="mt-1 flex items-center text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              {job.site?.address}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Completed
              </span>
            </p>
          </div>
        </div>

        {checkIn && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Time Log
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Check-in Time
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(checkIn.check_in_time).toLocaleString()}
                </p>
              </div>
              {checkIn.check_out_time && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Check-out Time
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(checkIn.check_out_time).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {job.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{job.notes}</p>
          </div>
        )}
      </Card>

      {beforePhotos.length > 0 && (
        <Card title="Before Photos">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {beforePhotos.map((photo) => (
              <PhotoItem key={photo.id} photo={photo} />
            ))}
          </div>
        </Card>
      )}

      {afterPhotos.length > 0 && (
        <Card title="After Photos">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {afterPhotos.map((photo) => (
              <PhotoItem key={photo.id} photo={photo} />
            ))}
          </div>
        </Card>
      )}

      {photos.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              No photos available for this job
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function PhotoItem({ photo }: { photo: JobPhoto }) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      const { data } = await supabase.storage
        .from('job-photos')
        .getPublicUrl(photo.storage_path);
      setImageUrl(data.publicUrl);
    };
    loadImage();
  }, [photo.storage_path]);

  return (
    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${photo.photo_type} photo`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity"></div>
    </div>
  );
}
