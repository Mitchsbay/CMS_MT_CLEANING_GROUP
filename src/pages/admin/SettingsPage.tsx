import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';

export function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    gps_radius_meters: '100',
    enable_client_portal: 'true',
    enable_dark_mode: 'true',
    enable_offline_mode: 'true',
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*');

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach((setting: any) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('settings')
          .upsert({ key, value: value as any, updated_at: new Date().toISOString() });
      }

      showToast('success', 'Settings saved successfully');
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure system settings and preferences
        </p>
      </div>

      <Card title="GPS Settings">
        <div className="space-y-4">
          <Input
            label="GPS Verification Radius (meters)"
            type="number"
            value={settings.gps_radius_meters}
            onChange={(e) =>
              setSettings({ ...settings, gps_radius_meters: e.target.value })
            }
            helperText="Distance allowed from site location for check-in/out"
          />
        </div>
      </Card>

      <Card title="Feature Toggles">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Client Portal</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow clients to access their reports
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_client_portal === 'true'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_client_portal: e.target.checked.toString(),
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable dark theme option
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {isDark ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Offline Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow offline data sync for mobile
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_offline_mode === 'true'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enable_offline_mode: e.target.checked.toString(),
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={loading} icon={<Save className="h-4 w-4" />}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
