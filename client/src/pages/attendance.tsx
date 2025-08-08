import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GeofenceCheckinModal } from "@/components/geofence-checkin-modal";
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  X,
  MapPin,
  User,
  GraduationCap,
  Coffee,
  Briefcase,
  Heart
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  residentId: string;
  residentName: string;
  sessionId: string;
  sessionTitle: string;
  sessionType: 'workshop' | 'one_on_one' | 'group_meeting' | 'life_skills' | 'job_training' | 'counseling' | 'recreation';
  date: string;
  startTime: string;
  endTime: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  location: string;
  facilitator: string;
  notes?: string;
  stage: number;
}

interface Session {
  id: string;
  title: string;
  type: 'workshop' | 'one_on_one' | 'group_meeting' | 'life_skills' | 'job_training' | 'counseling' | 'recreation';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  facilitator: string;
  capacity: number;
  enrolled: number;
  description: string;
  requiredStages: number[];
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    residentId: 'res1',
    residentName: 'Marcus Johnson',
    sessionId: 'sess1',
    sessionTitle: 'Life Skills Workshop',
    sessionType: 'life_skills',
    date: '2024-01-25',
    startTime: '10:00',
    endTime: '11:30',
    status: 'present',
    location: 'Main Conference Room',
    facilitator: 'Sarah Williams',
    notes: 'Excellent participation in budgeting exercise',
    stage: 3
  },
  {
    id: '2',
    residentId: 'res2',
    residentName: 'David Rodriguez',
    sessionId: 'sess2',
    sessionTitle: 'Job Interview Skills',
    sessionType: 'job_training',
    date: '2024-01-24',
    startTime: '14:00',
    endTime: '15:30',
    status: 'present',
    location: 'Training Room B',
    facilitator: 'Michael Chen',
    stage: 5
  },
  {
    id: '3',
    residentId: 'res3',
    residentName: 'James Wilson',
    sessionId: 'sess1',
    sessionTitle: 'Life Skills Workshop',
    sessionType: 'life_skills',
    date: '2024-01-25',
    startTime: '10:00',
    endTime: '11:30',
    status: 'absent',
    location: 'Main Conference Room',
    facilitator: 'Sarah Williams',
    notes: 'Family emergency - excused absence',
    stage: 2
  }
];

const mockSessions: Session[] = [
  {
    id: 'sess1',
    title: 'Life Skills Workshop',
    type: 'life_skills',
    date: '2024-01-26',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Main Conference Room',
    facilitator: 'Sarah Williams',
    capacity: 15,
    enrolled: 12,
    description: 'Weekly workshop covering budgeting, time management, and daily living skills.',
    requiredStages: [1, 2, 3, 4]
  },
  {
    id: 'sess2',
    title: 'Job Readiness Training',
    type: 'job_training',
    date: '2024-01-26',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Training Room B',
    facilitator: 'Michael Chen',
    capacity: 10,
    enrolled: 8,
    description: 'Resume building, interview skills, and workplace expectations.',
    requiredStages: [4, 5, 6]
  }
];

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);

  // In a real app, this would fetch from API
  const { data: attendance = mockAttendance } = useQuery({
    queryKey: ['/api/attendance'],
    enabled: false // Using mock data for now
  });

  const { data: sessions = mockSessions } = useQuery({
    queryKey: ['/api/sessions'],
    enabled: false // Using mock data for now
  });

  const filteredAttendance = (attendance as AttendanceRecord[]).filter((record: AttendanceRecord) => {
    const matchesSearch = record.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSessionTypeIcon = (type: string) => {
    const icons: Record<string, typeof GraduationCap> = {
      workshop: GraduationCap,
      one_on_one: User,
      group_meeting: Users,
      life_skills: Heart,
      job_training: Briefcase,
      counseling: Heart,
      recreation: Coffee
    };
    return icons[type] || GraduationCap;
  };

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-blue-100 text-blue-800',
      one_on_one: 'bg-green-100 text-green-800',
      group_meeting: 'bg-purple-100 text-purple-800',
      life_skills: 'bg-pink-100 text-pink-800',
      job_training: 'bg-orange-100 text-orange-800',
      counseling: 'bg-red-100 text-red-800',
      recreation: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, typeof CheckCircle> = {
      present: CheckCircle,
      absent: X,
      late: Clock,
      excused: CheckCircle
    };
    return icons[status] || CheckCircle;
  };

  const attendanceStats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((r: AttendanceRecord) => r.status === 'present').length,
    absent: filteredAttendance.filter((r: AttendanceRecord) => r.status === 'absent').length,
    late: filteredAttendance.filter((r: AttendanceRecord) => r.status === 'late').length
  };

  return (
    <div className="flex-1 overflow-hidden">
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Program Attendance</h1>
                <p className="text-sm text-gray-600">Track Life House workshop and coaching session attendance</p>
              </div>
              <Button onClick={() => setShowGeofenceModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log Attendance
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Attendance Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                  </div>
                  <X className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Late</p>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by resident name or session title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Tabs defaultValue="records" className="w-full">
            <TabsList>
              <TabsTrigger value="records">Attendance Records</TabsTrigger>
              <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="records" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Attendance List */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Records ({filteredAttendance.length})
                  </h2>
                  
                  {filteredAttendance.map((record: AttendanceRecord) => {
                    const StatusIcon = getStatusIcon(record.status);
                    return (
                      <Card 
                        key={record.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedRecord?.id === record.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {record.residentName.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{record.residentName}</h3>
                                <p className="text-sm text-gray-500">{record.sessionTitle}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(record.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {record.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {record.startTime} - {record.endTime}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {record.location}
                            </div>
                          </div>

                          {record.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              {record.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Record Details */}
                <div>
                  {selectedRecord ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {selectedRecord.residentName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{selectedRecord.residentName}</h3>
                            <p className="text-sm text-gray-500">{selectedRecord.sessionTitle}</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Session Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="font-medium">{new Date(selectedRecord.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Time:</span>
                                <span className="font-medium">{selectedRecord.startTime} - {selectedRecord.endTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{selectedRecord.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Facilitator:</span>
                                <span className="font-medium">{selectedRecord.facilitator}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Info</h4>
                            <div className="space-y-2">
                              <Badge className={getStatusColor(selectedRecord.status)}>
                                {React.createElement(getStatusIcon(selectedRecord.status), { className: "w-3 h-3 mr-1" })}
                                {selectedRecord.status}
                              </Badge>
                              <Badge className={getSessionTypeColor(selectedRecord.sessionType)}>
                                {React.createElement(getSessionTypeIcon(selectedRecord.sessionType), { className: "w-3 h-3 mr-1" })}
                                {selectedRecord.sessionType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {selectedRecord.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                              {selectedRecord.notes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Attendance Record</h3>
                        <p className="text-gray-500">Choose a record from the list to view detailed information.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Sessions ({sessions.length})
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(sessions as Session[]).map((session: Session) => {
                    const TypeIcon = getSessionTypeIcon(session.type);
                    return (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSessionTypeColor(session.type)}`}>
                                <TypeIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{session.title}</h3>
                                <p className="text-sm text-gray-500">{session.facilitator}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(session.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {session.startTime} - {session.endTime}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {session.location}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              {session.enrolled}/{session.capacity} enrolled
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">{session.description}</p>
                            <div className="flex justify-between items-center">
                              <Badge className={getSessionTypeColor(session.type)} variant="outline">
                                {session.type.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Stages: {session.requiredStages.join(', ')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Geofence Check-in Modal */}
      <GeofenceCheckinModal
        isOpen={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
        propertyId="oak-avenue"
        propertyName="Oak Avenue House"
        propertyAddress="123 Oak Avenue, San Francisco, CA 94102"
        onCheckinComplete={(success, overrideReason) => {
          if (success) {
            // In a real app, this would save to the database
            console.log('Check-in successful', overrideReason ? `with override: ${overrideReason}` : '');
            setShowGeofenceModal(false);
          }
        }}
      />
    </div>
  );
}