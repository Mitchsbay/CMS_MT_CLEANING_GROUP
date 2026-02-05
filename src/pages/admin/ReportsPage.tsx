import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Users, MapPin, Briefcase, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
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

  const handleExportPDF = async () => {
    try {
      showToast('info', 'Generating PDF report...');

      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`mt-cleaning-report-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('success', 'PDF report exported successfully');
    } catch (error: any) {
      showToast('error', `Failed to export PDF: ${error.message}`);
    }
  };

  const handleExportExcel = () => {
    try {
      const csvContent = [
        ['MT Cleaning Group - Management Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Category', 'Metric', 'Value'],
        ['Jobs', 'Total Jobs', stats.totalJobs.toString()],
        ['Jobs', 'Active Jobs', stats.activeJobs.toString()],
        ['Staff', 'Total Staff', stats.totalStaff.toString()],
        ['Staff', 'Active Staff', stats.activeStaff.toString()],
        ['Sites', 'Total Sites', stats.totalSites.toString()],
        ['Sites', 'Active Sites', stats.activeSites.toString()],
        ['Clients', 'Total Clients', stats.totalClients.toString()],
        ['Clients', 'Active Clients', stats.activeClients.toString()],
        ['Incidents', 'Open Incidents', stats.openIncidents.toString()],
        ['Assets', 'Total Assets', stats.totalAssets.toString()],
        ['Assets', 'Available Assets', stats.availableAssets.toString()],
        ['Tasks', 'Pending Tasks', stats.pendingTasks.toString()],
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mt-cleaning-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', 'Excel report exported successfully');
    } catch (error: any) {
      showToast('error', `Failed to export Excel: ${error.message}`);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      handleExportPDF();
    } else {
      handleExportExcel();
    }
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
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Clients',
      value: stats.totalClients,
      subtitle: `${stats.activeClients} active`,
      icon: Briefcase,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
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
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
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
        <div className="flex items-center gap-3">
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
            className="w-32"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </Select>
          <Button
            onClick={handleExport}
            icon={<Download className="h-4 w-4" />}
            variant="primary"
          >
            Export Report
          </Button>
        </div>
      </div>

      <div id="report-content" className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MT Cleaning Group</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Management Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Generated</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
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

        <Card title="Summary">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This report provides an overview of the MT Cleaning Group management system as of {new Date().toLocaleDateString()}.
              The system is currently managing {stats.totalJobs} jobs across {stats.totalSites} sites with {stats.totalStaff} staff members.
              There are {stats.openIncidents} open incidents that require attention and {stats.pendingTasks} pending tasks.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
