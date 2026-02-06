import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';

type Job = Database['public']['Tables']['jobs']['Row'] & {
  site?: Database['public']['Tables']['sites']['Row'];
};
type CheckIn = Database['public']['Tables']['check_ins']['Row'];

export function StaffJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Incident form
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentData, setIncidentData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  });

  // Photo upload
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      loadJobDetail();
    }
  }, [id]);

  const loadJobDetail = async () => {
    try {
      const [jobResult, checkInResult] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            *,
            site:sites(*)
          `)
          .eq('id', id!)
          .maybeSingle(),
        supabase
          .from('check_ins')
          .select('*')
          .eq('job_id', id!)
          .is('check_out_time', null)
          .maybeSingle()
      ]);

      if (jobResult.error) throw jobResult.error;
      if (checkInResult.error && checkInResult.error.code !== 'PGRST116') {
        throw checkInResult.error;
      }

      setJob(jobResult.data);
      setCheckIn(checkInResult.data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser');
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { error } = await supabase
            .from('check_ins')
            .insert({
              job_id: id!,
              user_id: user!.id,
              check_in_lat: position.coords.latitude,
              check_in_lng: position.coords.longitude,
            });

          if (error) throw error;

          await supabase
            .from('jobs')
            .update({ status: 'in_progress' })
            .eq('id', id!);

          showToast('success', 'Checked in successfully');
          loadJobDetail();
        } catch (error: any) {
          showToast('error', error.message || 'Failed to check in');
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        showToast('error', `Geolocation error: ${error.message}`);
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckOut = async () => {
    if (!checkIn) return;
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser');
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { error } = await supabase
            .from('check_ins')
            .update({
              check_out_time: new Date().toISOString(),
              check_out_lat: position.coords.latitude,
              check_out_lng: position.coords.longitude,
            })
            .eq('id', checkIn.id);

          if (error) throw error;

          await supabase
            .from('jobs')
            .update({ status: 'completed' })
            .eq('id', id!);

          showToast('success', 'Checked out successfully');
          loadJobDetail();
        } catch (error: any) {
          showToast('error', error.message || 'Failed to check out');
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        showToast('error', `Geolocation error: ${error.message}`);
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?.site) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          site_id: job.site.id,
          reported_by: user!.id,
          title: incidentData.title,
          description: incidentData.description,
          severity: incidentData.severity,
          status: 'open',
        });

      if (error) throw error;

      showToast('success', 'Incident reported successfully');
      setShowIncidentForm(false);
      setIncidentData({ title: '', description: '', severity: 'medium' });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      showToast('error', 'Please select a photo');
      return;
    }

    setSubmitting(true);

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${id}_${photoType}_${Date.now()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('job_photos')
        .insert({
          job_id: id!,
          uploaded_by: user!.id,
          photo_type: photoType,
          storage_path: filePath,
        });

      if (dbError) throw dbError;

      showToast('success', `${photoType} photo uploaded successfully`);
      setShowPhotoUpload(false);
      setPhotoFile(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => navigate('/staff')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/staff')}
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Jobs
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Details</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {job.site?.name}
        </p>
      </div>

      <Card title="Site Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Location
            </label>
            <div className="mt-1 flex items-start text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <span>{job.site?.address}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Scheduled Date
            </label>
            <div className="mt-1 flex items-center text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {new Date(job.scheduled_date).toLocaleDateString()}
            </div>
          </div>
          {job.site?.instructions && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Special Instructions
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {job.site.instructions}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {!checkIn ? (
            <Button
              onClick={handleCheckIn}
              loading={submitting}
              icon={<CheckCircle className="h-4 w-4" />}
              variant="primary"
              className="w-full"
            >
              Check In
            </Button>
          ) : !checkIn.check_out_time ? (
            <Button
              onClick={handleCheckOut}
              loading={submitting}
              icon={<XCircle className="h-4 w-4" />}
              variant="primary"
              className="w-full"
            >
              Check Out
            </Button>
          ) : (
            <Button
              disabled
              icon={<CheckCircle className="h-4 w-4" />}
              className="w-full"
            >
              Completed
            </Button>
          )}

          <Button
            onClick={() => setShowIncidentForm(true)}
            icon={<AlertTriangle className="h-4 w-4" />}
            className="w-full"
          >
            Report Incident
          </Button>

          <Button
            onClick={() => {
              setPhotoType('before');
              setShowPhotoUpload(true);
            }}
            icon={<Upload className="h-4 w-4" />}
            className="w-full"
          >
            Upload Before Photo
          </Button>

          <Button
            onClick={() => {
              setPhotoType('after');
              setShowPhotoUpload(true);
            }}
            icon={<Upload className="h-4 w-4" />}
            className="w-full"
          >
            Upload After Photo
          </Button>
        </div>
      </Card>

      {checkIn && (
        <Card title="Time Log">
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
        </Card>
      )}

      {showIncidentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Report Incident
            </h2>
            <form onSubmit={handleSubmitIncident} className="space-y-4">
              <Input
                label="Title"
                value={incidentData.title}
                onChange={(e) => setIncidentData({ ...incidentData, title: e.target.value })}
                required
              />
              <TextArea
                label="Description"
                value={incidentData.description}
                onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                required
                rows={4}
              />
              <Select
                label="Severity"
                value={incidentData.severity}
                onChange={(e) => setIncidentData({ ...incidentData, severity: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  variant="primary"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Upload {photoType} Photo
            </h2>
            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setPhotoFile(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  variant="primary"
                >
                  Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
