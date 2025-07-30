import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Sidebar } from "@/components/sidebar";
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
  residentId: string;
  type: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isAIDraft?: boolean;
  purpose?: string;
  tags?: string[];
}

interface Resident {
  id: string;
  name: string;
  email: string;
  stage: number;
  enrollmentDate: string;
  caseManagerId: string;
}

// Mock data for development
const mockResident: Resident = {
  id: '1',
  name: 'Marcus Johnson',
  email: 'marcus.j@email.com',
  stage: 3,
  enrollmentDate: '2023-10-15',
  caseManagerId: 'current-user'
};

const mockCaseNotes: CaseNote[] = [
  {
    id: '1',
    residentId: '1',
    type: 'progress',
    title: 'Weekly Progress Update - Stage 3 Advancement',
    content: 'Marcus has shown exceptional progress this week. He attended all scheduled programs and actively participated in group sessions. His communication skills have notably improved, and he\'s taking more initiative in his recovery journey. He expressed interest in the job readiness program and has been punctual for all appointments.',
    createdBy: 'Sarah Williams',
    createdAt: '2024-01-24T10:30:00Z',
    updatedAt: '2024-01-24T10:30:00Z',
    purpose: 'weekly',
    tags: ['progress', 'engagement', 'positive']
  },
  {
    id: '2',
    residentId: '1',
    type: 'incident',
    title: 'Minor Rule Violation - Curfew',
    content: 'Marcus arrived 15 minutes late for curfew due to public transportation delays. He called ahead to notify staff and provided documentation (bus delay notice). This is his first curfew violation, and he was apologetic and communicative throughout.',
    createdBy: 'Sarah Williams',
    createdAt: '2024-01-22T21:45:00Z',
    updatedAt: '2024-01-22T21:45:00Z',
    purpose: 'documentation',
    tags: ['incident', 'curfew', 'resolved']
  },
  {
    id: '3',
    residentId: '1',
    type: 'milestone',
    title: 'Completed Financial Literacy Workshop',
    content: 'Marcus successfully completed the 8-week financial literacy workshop. He demonstrated understanding of budgeting concepts, opened a savings account, and created a personal budget plan. He scored 92% on the final assessment and has already started implementing the saving strategies learned.',
    createdBy: 'Sarah Williams',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
    purpose: 'achievement',
    tags: ['milestone', 'education', 'financial']
  },
  {
    id: '4',
    residentId: '1',
    type: 'touchpoint',
    title: 'Monthly 1-on-1 Check-in',
    content: 'Had productive monthly check-in with Marcus. Discussed his goals for the next month, including starting job applications and increasing his savings. He mentioned feeling more confident and grateful for the support. We reviewed his progress chart together and set new milestones for Stage 4 advancement.',
    createdBy: 'Sarah Williams',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    purpose: 'touchpoint',
    tags: ['meeting', 'goals', 'planning']
  }
];

export default function ResidentCaseNotes() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  // In production, fetch from API
  const { data: resident = mockResident } = useQuery({
    queryKey: [`/api/residents/${id}`],
    enabled: false // Using mock data
  });

  const { data: caseNotes = mockCaseNotes, isLoading } = useQuery({
    queryKey: [`/api/residents/${id}/notes`, { type: typeFilter }],
    enabled: false // Using mock data
  });

  const filteredNotes = caseNotes.filter(note => {
    const matchesType = typeFilter === 'all' || note.type === typeFilter;
    const matchesPurpose = purposeFilter === 'all' || note.purpose === purposeFilter;
    return matchesType && matchesPurpose;
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

      <div className="flex h-screen overflow-hidden">
        <div className="no-print">
          <Sidebar />
        </div>
        
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
                    <p className="text-sm text-gray-600">{resident.name} - Stage {resident.stage}</p>
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
                  <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Purposes</SelectItem>
                      <SelectItem value="weekly">Weekly Update</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
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
                <p className="text-gray-600">Resident: {resident.name}</p>
                <p className="text-gray-600">Stage: {resident.stage}</p>
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
                              {note.createdBy}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(note.type)}>
                            {note.type}
                          </Badge>
                          {note.isAIDraft && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              AI Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {note.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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