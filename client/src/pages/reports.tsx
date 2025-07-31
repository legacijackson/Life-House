import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  BarChart,
  Users,
  Home,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/use-auth";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  category: string;
  frequency: string;
  lastGenerated?: string;
  status?: 'ready' | 'generating' | 'error';
}

// Fetch report templates from database
const useReportTemplates = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['reportTemplates'],
    queryFn: async () => {
      const response = await fetch('/api/reports/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch report templates');
      return response.json();
    },
  });
};

// Fetch generated reports
const useReports = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });
};

// Generate report mutation
const useGenerateReport = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportType, parameters, name }: { reportType: string; parameters: any; name: string }) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType,
          parameters,
          name
        }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate report');
    },
  });
};

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: reportTemplates = [], isLoading: templatesLoading } = useReportTemplates();
  const { data: generatedReports = [], isLoading: reportsLoading } = useReports();
  const generateReportMutation = useGenerateReport();

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error("Please select a report type");
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return;
    }

    const selectedTemplate = reportTemplates.find(t => t.type === selectedReportType);
    if (!selectedTemplate) {
      toast.error("Invalid report type selected");
      return;
    }

    const parameters = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      category: selectedCategory !== 'all' ? selectedCategory : undefined
    };

    const reportName = `${selectedTemplate.name} - ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd, yyyy')}`;

    await generateReportMutation.mutateAsync({
      reportType: selectedReportType,
      parameters,
      name: reportName
    });
  };

  const handleDownloadReport = async (reportId: string, reportName: string) => {
    try {
      const { token } = useAuth();
      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const filteredTemplates = reportTemplates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const iconMap = {
    'stop-touchpoint': CheckCircle,
    'resident-progress': TrendingUp,
    'housing-occupancy': Home,
    'attendance-compliance': Users,
    'financial-summary': BarChart
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600">Generate compliance and outcome reports</p>
              </div>
              <Button 
                onClick={handleGenerateReport}
                disabled={!selectedReportType || generateReportMutation.isPending}
                className="gap-2"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Report Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Select report type and date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Report Type
                  </label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(report => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        disabled={(date) => date > new Date() || (dateRange.from ? date < dateRange.from : false)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>
                All Reports
              </TabsTrigger>
              <TabsTrigger value="compliance" onClick={() => setSelectedCategory('compliance')}>
                Compliance
              </TabsTrigger>
              <TabsTrigger value="outcomes" onClick={() => setSelectedCategory('outcomes')}>
                Outcomes
              </TabsTrigger>
              <TabsTrigger value="operations" onClick={() => setSelectedCategory('operations')}>
                Operations
              </TabsTrigger>
              <TabsTrigger value="financial" onClick={() => setSelectedCategory('financial')}>
                Financial
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4">
              <div className="grid gap-4">
                {templatesLoading ? (
                  <div className="text-center py-8">Loading report templates...</div>
                ) : (
                  filteredTemplates.map(template => {
                    const IconComponent = iconMap[template.type as keyof typeof iconMap] || FileText;
                    return (
                      <Card 
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedReportType === template.type && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedReportType(template.type)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription className="mt-1">
                                  {template.description}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline">{template.frequency}</Badge>
                              {template.isActive && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ready
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            Template updated: {new Date(template.updatedAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Reports */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportsLoading ? (
                  <div className="text-center py-4">Loading reports...</div>
                ) : generatedReports.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No reports generated yet. Create your first report above.
                  </div>
                ) : (
                  generatedReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{report.name}</p>
                          <p className="text-xs text-gray-500">
                            Generated on {new Date(report.generatedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={report.status === 'completed' ? 'default' : 
                                      report.status === 'generating' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {report.status}
                            </Badge>
                            {report.fileSize && (
                              <span className="text-xs text-gray-400">
                                {(report.fileSize / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        disabled={report.status !== 'completed'}
                        onClick={() => handleDownloadReport(report.id, report.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
