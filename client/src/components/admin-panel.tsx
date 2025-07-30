import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Database, 
  Webhook, 
  Cloud, 
  TestTube,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SystemConfig {
  slackWebhookUrl: string;
  s3BucketName: string;
  s3Region: string;
  emailNotifications: boolean;
  nightlyCrawlerEnabled: boolean;
  stopArmsReminders: boolean;
  maintenanceMode: boolean;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  s3Connection: 'healthy' | 'warning' | 'error';
  slackIntegration: 'healthy' | 'warning' | 'error';
  lastBackup: string;
  uptime: string;
  totalResidents: number;
  totalStaff: number;
  systemVersion: string;
}

export function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // System configuration
  const { data: config, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/config'],
  });

  // System status
  const { data: status } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: Partial<SystemConfig>) => 
      apiRequest('/api/admin/config', {
        method: 'PATCH',
        body: JSON.stringify(newConfig),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({
        title: "Configuration updated",
        description: "System configuration has been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Unable to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (type: 'slack' | 's3') => 
      apiRequest(`/api/admin/test-connection/${type}`, {
        method: 'POST',
      }),
    onSuccess: (data: { success: boolean; message: string }, variables) => {
      setTestingConnection(null);
      if (data.success) {
        toast({
          title: "Connection successful",
          description: data.message
        });
      } else {
        toast({
          title: "Connection failed",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: (error, variables) => {
      setTestingConnection(null);
      toast({
        title: "Test failed",
        description: `Unable to test ${variables} connection.`,
        variant: "destructive"
      });
    }
  });

  const handleConfigUpdate = (key: keyof SystemConfig, value: any) => {
    updateConfigMutation.mutate({ [key]: value });
  };

  const handleTestConnection = (type: 'slack' | 's3') => {
    setTestingConnection(type);
    testConnectionMutation.mutate(type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <TestTube className="w-4 h-4" />;
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">System configuration and monitoring</p>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(status?.database || 'unknown')}>
                {getStatusIcon(status?.database || 'unknown')}
                <span className="ml-1 capitalize">{status?.database || 'Unknown'}</span>
              </Badge>
              {status?.lastBackup && (
                <p className="text-xs text-gray-500 mt-2">
                  Last backup: {status.lastBackup}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">S3 Storage</CardTitle>
              <Cloud className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(status?.s3Connection || 'unknown')}>
                {getStatusIcon(status?.s3Connection || 'unknown')}
                <span className="ml-1 capitalize">{status?.s3Connection || 'Unknown'}</span>
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slack Integration</CardTitle>
              <Webhook className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(status?.slackIntegration || 'unknown')}>
                {getStatusIcon(status?.slackIntegration || 'unknown')}
                <span className="ml-1 capitalize">{status?.slackIntegration || 'Unknown'}</span>
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Info</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.totalResidents || 0}</div>
              <p className="text-xs text-gray-500">residents</p>
              <p className="text-xs text-gray-500">
                {status?.totalStaff || 0} staff • v{status?.systemVersion || '1.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Slack Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Webhook className="w-5 h-5 mr-2 text-green-600" />
                    Slack Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="slackWebhook">Webhook URL</Label>
                    <Input
                      id="slackWebhook"
                      type="url"
                      value={config?.slackWebhookUrl || ''}
                      onChange={(e) => handleConfigUpdate('slackWebhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for sending notifications to #lifehouse-ops channel
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection('slack')}
                    disabled={testingConnection === 'slack' || !config?.slackWebhookUrl}
                  >
                    {testingConnection === 'slack' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>

              {/* S3 Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cloud className="w-5 h-5 mr-2 text-purple-600" />
                    S3 Document Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="s3Bucket">Bucket Name</Label>
                    <Input
                      id="s3Bucket"
                      value={config?.s3BucketName || ''}
                      onChange={(e) => handleConfigUpdate('s3BucketName', e.target.value)}
                      placeholder="lifehouse-documents"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="s3Region">Region</Label>
                    <Input
                      id="s3Region"
                      value={config?.s3Region || ''}
                      onChange={(e) => handleConfigUpdate('s3Region', e.target.value)}
                      placeholder="us-west-2"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection('s3')}
                    disabled={testingConnection === 's3' || !config?.s3BucketName}
                  >
                    {testingConnection === 's3' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="nightlyCrawler">Nightly Resource Crawler</Label>
                    <p className="text-sm text-gray-500">
                      Automatically update resource catalog at 2:00 AM PT
                    </p>
                  </div>
                  <Switch
                    id="nightlyCrawler"
                    checked={config?.nightlyCrawlerEnabled || false}
                    onCheckedChange={(checked) => handleConfigUpdate('nightlyCrawlerEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="stopReminders">STOP ARMS Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Send 48h and 24h reminder notifications for TouchPoints
                    </p>
                  </div>
                  <Switch
                    id="stopReminders"
                    checked={config?.stopArmsReminders || false}
                    onCheckedChange={(checked) => handleConfigUpdate('stopArmsReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Disable public access and show maintenance message
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={config?.maintenanceMode || false}
                    onCheckedChange={(checked) => handleConfigUpdate('maintenanceMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email notifications for critical events
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={config?.emailNotifications || false}
                    onCheckedChange={(checked) => handleConfigUpdate('emailNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Audit Logs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    User Management
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-medium">{status?.uptime || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Version</span>
                      <span className="text-sm font-medium">v{status?.systemVersion || '1.0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last Update</span>
                      <span className="text-sm font-medium">2025-07-30</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}