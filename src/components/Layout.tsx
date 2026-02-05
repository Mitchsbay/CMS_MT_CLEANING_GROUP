import { ReactNode, useState } from 'react';
import {
  Menu, X, Home, Users, MapPin, Calendar, Briefcase,
  FileText, Settings, LogOut, Sun, Moon, Bell, ClipboardList,
  AlertTriangle, Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useRouter } from './Router';
import { classNames } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { navigate } = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Staff Management', href: '/admin/staff', icon: Users },
    { name: 'Clients', href: '/admin/clients', icon: Briefcase },
    { name: 'Sites', href: '/admin/sites', icon: MapPin },
    { name: 'Jobs', href: '/admin/jobs', icon: Calendar },
    { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
    { name: 'Incidents', href: '/admin/incidents', icon: AlertTriangle },
    { name: 'Assets', href: '/admin/assets', icon: Package },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const staffNavigation = [
    { name: 'My Jobs', href: '/staff', icon: Home },
    { name: 'Incidents', href: '/staff/incidents', icon: AlertTriangle },
    { name: 'Assets', href: '/staff/assets', icon: Package },
  ];

  const navigation = profile?.role === 'admin' ? adminNavigation : staffNavigation;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <img src="/mt-cleaning-logo-transparent-clean.png" alt="MT Cleaning" className="h-10 w-auto" />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={classNames(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="hidden lg:flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
            <img src="/mt-cleaning-logo-transparent-clean.png" alt="MT Cleaning" className="h-12 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto p-4 mt-16 lg:mt-0">
            <div className="mb-4 px-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {profile?.full_name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {profile?.role}
              </p>
            </div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
