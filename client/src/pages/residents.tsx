import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Bed,
  ExternalLink
} from 'lucide-react';

interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: number;
  dateOfBirth?: string;
  enrollmentDate: string;
  releaseDate?: string;
  justiceStatus: string;
  currentProperty?: string;
  currentRoom?: string;
  caseManagerId: string;
  lastAttendance?: string;
  progressScore: number;
  recentActivity: {
    type: string;
    date: string;
    description: string;
  }[];
}

const mockResidents: Resident[] = [
  {
    id: '1',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    phone: '(555) 123-4567',
    stage: 3,
    enrollmentDate: '2024-01-15',
    releaseDate: '2024-01-10',
    justiceStatus: 'parole',
    currentProperty: 'Main Street House',
    currentRoom: 'Room 12A',
    caseManagerId: 'current-user',
    lastAttendance: '2024-01-25',
    progressScore: 75,
    recentActivity: [
      { type: 'attendance', date: '2024-01-25', description: 'Life Skills Workshop' },
      { type: 'case_note', date: '2024-01-23', description: 'Weekly check-in completed' },
      { type: 'service', date: '2024-01-20', description: 'Job readiness training' }
    ]
  },
  {
    id: '2',
    name: 'David Rodriguez',
    email: 'david.r@email.com',
    phone: '(555) 234-5678',
    stage: 5,
    enrollmentDate: '2023-11-20',
    releaseDate: '2023-11-15',
    justiceStatus: 'probation',
    currentProperty: 'Oak Avenue House',
    currentRoom: 'Room 8B',
    caseManagerId: 'current-user',
    lastAttendance: '2024-01-24',
    progressScore: 88,
    recentActivity: [
      { type: 'milestone', date: '2024-01-24', description: 'Advanced to Stage 5' },
      { type: 'employment', date: '2024-01-22', description: 'Started part-time job' },
      { type: 'attendance', date: '2024-01-24', description: 'Housing navigation session' }
    ]
  }
];

interface CaseNote {
  id: string;
  residentId: string;
  authorName: string;
  authorRole: string;
  date: string;
  type: string;
  content: string;
  followUpRequired: boolean;
  tags: string[];
}

const mockCaseNotes: CaseNote[] = [
  {
    id: '1',
    residentId: '1',
    authorName: 'Kairia Shariff',
    authorRole: 'Case Manager',
    date: '2024-01-23',
    type: 'Progress Note',
    content: 'Marcus continues to show excellent progress in Stage 3. He has been consistently attending all scheduled programs and group sessions. His engagement in life skills workshops has been particularly noteworthy. Discussed his goals for employment and we\'ve identified several job readiness programs that align with his interests.',
    followUpRequired: false,
    tags: ['Employment', 'Progress', 'Life Skills']
  },
  {
    id: '2',
    residentId: '1',
    authorName: 'Julius Jackson',
    authorRole: 'Program Director',
    date: '2024-01-20',
    type: 'Milestone Achievement',
    content: 'Marcus successfully completed the financial literacy workshop series. He demonstrated strong understanding of budgeting concepts and has started creating his personal savings plan. Recommended for advancement to Stage 4 pending completion of job readiness training.',
    followUpRequired: true,
    tags: ['Financial Literacy', 'Milestone', 'Stage Advancement']
  },
  {
    id: '3',
    residentId: '2',
    authorName: 'Brittney Jackson',
    authorRole: 'Support Specialist',
    date: '2024-01-24',
    type: 'Check-In',
    content: 'David had his weekly check-in today. He shared that his new part-time job is going well and he\'s adjusting to the schedule. We discussed strategies for time management and balancing work with program requirements. He expressed interest in additional vocational training opportunities.',
    followUpRequired: false,
    tags: ['Employment', 'Check-In', 'Time Management']
  }
];

export default function Residents() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showCaseNotesModal, setShowCaseNotesModal] = useState(false);
  const [newCaseNote, setNewCaseNote] = useState('');
  const [caseNoteType, setCaseNoteType] = useState('Progress Note');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const { toast } = useToast();

  // In a real app, this would fetch from API
  const { data: residents = mockResidents, isLoading } = useQuery<Resident[]>({
    queryKey: ['/api/residents'],
    enabled: false // Using mock data for now
  });

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || resident.stage.toString() === stageFilter;
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
                <h1 className="text-2xl font-bold text-gray-900">My Residents</h1>
                <p className="text-sm text-gray-600">Manage your assigned resident caseload through the 7-stage transformation program</p>
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
                  placeholder="Search residents by name or email..."
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
                Residents ({filteredResidents.length})
              </h2>
              
              {filteredResidents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No residents found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {searchTerm || stageFilter !== 'all' 
                        ? "Try adjusting your search criteria or filters" 
                        : "No residents have been added to the system yet"}
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
                      <Badge className={getStageColor(resident.stage)}>
                        Stage {resident.stage}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress Score</span>
                        <span className="font-medium">{resident.progressScore}%</span>
                      </div>
                      <Progress value={resident.progressScore} className="h-2" />
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {resident.currentProperty}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {resident.lastAttendance && new Date(resident.lastAttendance).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resident Details */}
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
                          <p className="text-sm text-gray-500">{getStageLabel(selectedResident.stage)}</p>
                        </div>
                      </CardTitle>
                      <Badge className={getStageColor(selectedResident.stage)}>
                        Stage {selectedResident.stage}
                      </Badge>
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
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedResident.phone}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Housing</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <Bed className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedResident.currentProperty}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedResident.currentRoom}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Program Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Enrollment Date:</span>
                              <span className="ml-2 font-medium">
                                {new Date(selectedResident.enrollmentDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Justice Status:</span>
                              <span className="ml-2 font-medium capitalize">
                                {selectedResident.justiceStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="progress" className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Overall Progress</h4>
                            <span className="text-lg font-bold text-blue-600">{selectedResident.progressScore}%</span>
                          </div>
                          <Progress value={selectedResident.progressScore} className="h-3" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-gray-600">Program Compliance</span>
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium">Excellent</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-gray-600">Attendance Rate</span>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium">92%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600">Goals Completed</span>
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium">8/12</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="activity" className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
                        <div className="space-y-3">
                          {selectedResident.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.date).toLocaleDateString()} • {activity.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
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
            onSave={(note) => {
              // Handle saving the case note
              console.log('Case note saved:', note);
              setShowCaseNotesModal(false);
            }}
            note={undefined}
            residents={residentsData.map(r => ({ id: r.id, name: r.name }))}
          />
        )}
      </div>
  );
}
