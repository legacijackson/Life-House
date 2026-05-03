import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Printer,
  Calendar,
  User,
  FileText,
  Filter,
  Download
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CaseNote {
  id: string;
  clientId: string;
  staffId: string;
  noteType: string;
  title: string;
  summary: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

interface Resident {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}


export default function ResidentCaseNotes() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: resident } = useQuery<Resident>({
    queryKey: [`/api/residents/${id}`],
    queryFn: () => apiRequest('GET', `/api/residents/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: caseNotes = [], isLoading } = useQuery<CaseNote[]>({
    queryKey: [`/api/staff-case-notes`, id],
    queryFn: () => apiRequest('GET', `/api/staff-case-notes?clientId=${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const filteredNotes = caseNotes.filter(note => {
    const matchesType = typeFilter === 'all' || note.noteType === typeFilter;
    return matchesType;
  });

  const handlePrint = () => {
    window.print();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'bg-green-100 text-green-800';
      case 'incident': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-blue-100 text-blue-800';
      case 'touchpoint': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
          body {
            font-size: 12pt;
          }
          .case-note {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
          }
        }
      `}</style>

      <div className="flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white shadow-sm border-b border-gray-200 no-print">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/app/residents')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Residents
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Case Notes</h1>
                    <p className="text-sm text-gray-600">{resident?.name ?? 'Resident'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Filters */}
            <Card className="mb-6 no-print">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Note Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="touchpoint">Touchpoint</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="ml-auto text-sm text-gray-500">
                    Showing {filteredNotes.length} notes
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Notes List */}
            <div className="space-y-4">
              {/* Print Header (only visible when printing) */}
              <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold">Case Notes Report</h1>
                <p className="text-gray-600">Resident: {resident?.name ?? ''}</p>
                <p className="text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
                <hr className="my-4" />
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">Loading case notes...</p>
                  </CardContent>
                </Card>
              ) : filteredNotes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No case notes found matching your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotes.map((note, index) => (
                  <Card key={note.id} className={`case-note ${index > 0 ? 'print-break' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {note.staffId}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(note.noteType)}>
                            {note.noteType}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.summary}</p>
                      {note.details && (
                        <p className="text-gray-500 text-sm mt-2 whitespace-pre-wrap">{note.details}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}