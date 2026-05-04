import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { ReferResidentModal } from "@/components/refer-resident-modal";
import { CaseNoteModal } from "@/components/case-note-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Phone,
  Mail,
  TrendingUp,
  FileText,
  Bed,
  ExternalLink,
  ClipboardList,
  CheckCircle2,
  Home,
} from 'lucide-react';

interface Resident {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt?: string;
  moveInDate?: string | null;
  propertyAssignment?: string | null;
  roomAssignment?: string | null;
  employmentStatus?: string | null;
  // Extended fields from /api/residents/:id
  stage?: number;
  justiceStatus?: string;
  enrollmentDate?: string;
  progressScore?: number;
}

function ResidentTimeline({ residentId }: { residentId: string }) {
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/clients/${residentId}/timeline`],
    queryFn: () => apiRequest('GET', `/api/clients/${residentId}/timeline`).then(r => r.json()),
  });

  const iconMap: Record<string, React.ReactNode> = {
    file: <ClipboardList className="h-3 w-3" />,
    check: <CheckCircle2 className="h-3 w-3" />,
    home: <Home className="h-3 w-3" />,
    star: <TrendingUp className="h-3 w-3" />,
  };
  const colorMap: Record<string, string> = {
    case_note: 'bg-blue-100 text-blue-600',
    touchpoint: 'bg-green-100 text-green-600',
    housing: 'bg-purple-100 text-purple-600',
    milestone: 'bg-amber-100 text-amber-600',
  };

  if (isLoading) return <p className="text-xs text-gray-400 py-2">Loading…</p>;
  if (!events.length) return <p className="text-xs text-gray-400 py-2">No activity recorded yet.</p>;

  return (
    <div className="relative space-y-3 max-h-64 overflow-y-auto pr-1">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
      {events.map((evt: any) => (
        <div key={evt.id} className="flex gap-3 relative">
          <div className={`z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${colorMap[evt.type] ?? 'bg-gray-100 text-gray-500'}`}>
            {iconMap[evt.icon] ?? <ClipboardList className="h-3 w-3" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-xs font-medium text-gray-900 leading-tight">{evt.title}</p>
            {evt.description && <p className="text-xs text-gray-500 truncate mt-0.5">{evt.description}</p>}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {evt.date ? new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Residents() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showCaseNotesModal, setShowCaseNotesModal] = useState(false);
  const { toast } = useToast();

  const { data: residents = [], isLoading } = useQuery<Resident[]>({
    queryKey: ['/api/residents'],
    queryFn: () => apiRequest('GET', '/api/residents').then((r) => r.json()),
  });

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resident.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || (resident.stage ?? 1).toString() === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageLabel = (stage: number) => {
    const stages = {
      1: 'Intake',
      2: 'Design',
      3: 'Training',
      4: 'Working',
      5: 'Overflow',
      6: 'Transition',
      7: 'Legacy'
    };
    return stages[stage as keyof typeof stages] || `Stage ${stage}`;
  };

  const getStageColor = (stage: number) => {
    if (stage <= 2) return 'bg-red-100 text-red-800';
    if (stage <= 4) return 'bg-yellow-100 text-yellow-800';
    if (stage <= 6) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
                <p className="text-sm text-gray-600">Manage your assigned client caseload through the 7-stage transformation program</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <Users className="w-3 h-3 mr-1" />
                  {filteredResidents.length} Active
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Stages</option>
                  {[1,2,3,4,5,6,7].map(stage => (
                    <option key={stage} value={stage.toString()}>
                      Stage {stage} - {getStageLabel(stage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Residents List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Clients ({filteredResidents.length})
              </h2>
              
              {filteredResidents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {searchTerm || stageFilter !== 'all' 
                        ? "Try adjusting your search criteria or filters" 
                        : "No clients have been added to the system yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : filteredResidents.map((resident: Resident) => (
                <Card 
                  key={resident.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedResident?.id === resident.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedResident(resident)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {resident.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{resident.name}</h3>
                          <p className="text-sm text-gray-500">{resident.email}</p>
                        </div>
                      </div>
                      {resident.stage != null && (
                        <Badge className={getStageColor(resident.stage)}>
                          Stage {resident.stage}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {resident.progressScore != null && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress Score</span>
                            <span className="font-medium">{resident.progressScore}%</span>
                          </div>
                          <Progress value={resident.progressScore} className="h-2" />
                        </>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                        {resident.propertyAssignment && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {resident.propertyAssignment}
                          </div>
                        )}
                        {resident.moveInDate && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(resident.moveInDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Client Details */}
            <div>
              {selectedResident ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img 
                            src="https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=100"
                            alt={`${selectedResident.name} profile`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.textContent = selectedResident.name.split(' ').map(n => n[0]).join('');
                              target.parentElement!.className += ' bg-blue-100 text-blue-800 font-semibold text-sm';
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{selectedResident.name}</h3>
                          {selectedResident.stage != null && (
                            <p className="text-sm text-gray-500">{getStageLabel(selectedResident.stage)}</p>
                          )}
                        </div>
                      </CardTitle>
                      {selectedResident.stage != null && (
                        <Badge className={getStageColor(selectedResident.stage)}>
                          Stage {selectedResident.stage}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="progress">Progress</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Info</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedResident.email}
                              </div>
                              {selectedResident.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  {selectedResident.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Housing</h4>
                            <div className="space-y-2 text-sm">
                              {selectedResident.propertyAssignment && (
                                <div className="flex items-center">
                                  <Bed className="w-4 h-4 mr-2 text-gray-400" />
                                  {selectedResident.propertyAssignment}
                                </div>
                              )}
                              {selectedResident.roomAssignment && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                  {selectedResident.roomAssignment}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Program Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {selectedResident.moveInDate && (
                              <div>
                                <span className="text-gray-600">Move-In Date:</span>
                                <span className="ml-2 font-medium">
                                  {new Date(selectedResident.moveInDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {selectedResident.employmentStatus && (
                              <div>
                                <span className="text-gray-600">Employment:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {selectedResident.employmentStatus}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="progress" className="space-y-4">
                        {selectedResident.progressScore != null ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-700">Overall Progress</h4>
                              <span className="text-lg font-bold text-blue-600">{selectedResident.progressScore}%</span>
                            </div>
                            <Progress value={selectedResident.progressScore} className="h-3" />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Progress data not yet available for this resident.</p>
                        )}
                        {selectedResident.stage != null && (
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-gray-600">Current Stage</span>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium">{getStageLabel(selectedResident.stage)}</span>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="activity" className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
                        <ResidentTimeline residentId={selectedResident.id} />
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex space-x-3">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowCaseNotesModal(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Case Notes
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate('/app/attendance')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Log Attendance
                      </Button>
                      <ReferResidentModal residentId={selectedResident.id}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Refer to Service
                        </Button>
                      </ReferResidentModal>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                      <img 
                        src="https://images.pexels.com/photos/7683897/pexels-photo-7683897.jpeg?auto=compress&cs=tinysrgb&w=200"
                        alt="Life House residents walking together"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Resident</h3>
                    <p className="text-gray-500">Choose a resident from the list to view their details and progress through the Life House program.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        </main>

        {/* Case Notes Modal */}
        {selectedResident && (
          <CaseNoteModal 
            isOpen={showCaseNotesModal} 
            onClose={() => setShowCaseNotesModal(false)}
            onSave={async (note) => {
              await apiRequest('POST', '/api/staff-case-notes', {
                clientId: note.residentId,
                noteType: note.type,
                title: note.subject,
                summary: note.content,
                details: note.content,
                priority: note.priority === 'urgent' ? 4 : note.priority === 'high' ? 3 : note.priority === 'medium' ? 2 : 1,
                confidential: note.confidential,
                followUpDate: note.followUpDate,
                tags: note.tags,
                actionItems: note.actionItems,
              });
              setShowCaseNotesModal(false);
            }}
            note={undefined}
            residents={residents.map(r => ({ id: r.id, name: r.name }))}
          />
        )}
      </div>
  );
}
