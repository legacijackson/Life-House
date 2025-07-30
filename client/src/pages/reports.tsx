import { useState } from 'react';
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

const reportTypes: ReportType[] = [
  {
    id: 'stop-touchpoint',
    name: 'STOP TouchPoint Report',
    description: 'Monthly compliance report tracking resident interactions and services',
    icon: CheckCircle,
    category: 'compliance',
    frequency: 'Monthly',
    lastGenerated: '2024-01-15',
    status: 'ready'
  },
  {
    id: 'resident-progress',
    name: 'Resident Progress Report',
    description: 'Individual and aggregate progress tracking across all stages',
    icon: TrendingUp,
    category: 'outcomes',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-10',
    status: 'ready'
  },
  {
    id: 'housing-occupancy',
    name: 'Housing Occupancy Report',
    description: 'Property utilization, vacancy rates, and bed availability',
    icon: Home,
    category: 'operations',
    frequency: 'Weekly',
    lastGenerated: '2024-01-18',
    status: 'ready'
  },
  {
    id: 'attendance-compliance',
    name: 'Attendance Compliance Report',
    description: 'Program attendance rates and compliance tracking',
    icon: Users,
    category: 'compliance',
    frequency: 'Monthly',
    lastGenerated: '2024-01-12',
    status: 'ready'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary Report',
    description: 'Donation tracking, resident fees, and financial overview',
    icon: BarChart,
    category: 'financial',
    frequency: 'Monthly',
    lastGenerated: '2024-01-05',
    status: 'ready'
  }
];

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error("Please select a report type");
      return;
    }

    setGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
      toast.success("Report generated successfully!");
      
      // In a real app, this would trigger a download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${selectedReportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
    }, 2000);
  };

  const filteredReports = reportTypes.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

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
                disabled={!selectedReportType || generatingReport}
                className="gap-2"
              >
                {generatingReport ? (
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
                {filteredReports.map(report => {
                  const IconComponent = report.icon;
                  return (
                    <Card 
                      key={report.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedReportType === report.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedReportType(report.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{report.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {report.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">{report.frequency}</Badge>
                            {report.status === 'ready' && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {report.lastGenerated && (
                        <CardContent className="pt-0">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
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
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">STOP TouchPoint Report - January 2024</p>
                        <p className="text-xs text-gray-500">Generated on Jan 15, 2024</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
