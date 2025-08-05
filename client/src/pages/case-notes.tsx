import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Clock,
  Edit,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Star,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { CaseNoteModal } from "@/components/case-note-modal";
import { toast } from "@/hooks/use-toast";

interface CaseNote {
  id: string;
  residentId: string;
  residentName: string;
  staffId: string;
  staffName: string;
  type: 'one_on_one' | 'incident' | 'milestone' | 'check_in' | 'referral' | 'crisis' | 'goal_update';
  subject: string;
  content: string;
  date: string;
  followUpDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  confidential: boolean;
  actionItems: string[];
  status: 'draft' | 'final' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const mockCaseNotes: CaseNote[] = [
  {
    id: '1',
    residentId: 'res1',
    residentName: 'Marcus Johnson',
    staffId: 'staff1',
    staffName: 'Sarah Williams',
    type: 'one_on_one',
    subject: 'Weekly Check-in - Progress Review',
    content: 'Marcus demonstrated excellent progress this week. He completed all assigned job readiness tasks and attended every scheduled workshop. We discussed his upcoming job interviews and practiced interview responses. He expressed confidence about his housing search and has identified 3 potential apartments within his budget.',
    date: '2024-01-25',
    followUpDate: '2024-02-01',
    priority: 'medium',
    tags: ['employment', 'housing', 'progress'],
    confidential: false,
    actionItems: [
      'Schedule mock interview session',
      'Review housing applications',
      'Connect with employment counselor'
    ],
    status: 'final',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '2',
    residentId: 'res2',
    residentName: 'David Rodriguez',
    staffId: 'staff1',
    staffName: 'Sarah Williams',
    type: 'milestone',
    subject: 'Advancement to Stage 5 - Job Readiness',
    content: 'David has successfully completed all Stage 4 requirements and is ready to advance to Stage 5. He has maintained stable housing, completed financial literacy training, and demonstrated consistent program compliance. His job readiness assessment shows strong potential for employment placement.',
    date: '2024-01-24',
    priority: 'high',
    tags: ['milestone', 'advancement', 'employment'],
    confidential: false,
    actionItems: [
      'Update stage in system',
      'Schedule employment services orientation',
      'Begin intensive job search support'
    ],
    status: 'final',
    createdAt: '2024-01-24',
    updatedAt: '2024-01-24'
  },
  {
    id: '3',
    residentId: 'res3',
    residentName: 'James Wilson',
    staffId: 'staff2',
    staffName: 'Michael Chen',
    type: 'incident',
    subject: 'Late Return to Housing - Policy Violation',
    content: 'James returned to the facility at 11:45 PM, violating the 11:00 PM curfew. He explained that he was attending a family emergency but failed to call ahead as required by house rules. This is his first curfew violation. We reviewed house policies and discussed the importance of communication.',
    date: '2024-01-23',
    followUpDate: '2024-01-30',
    priority: 'medium',
    tags: ['policy violation', 'curfew', 'first offense'],
    confidential: true,
    actionItems: [
      'Document violation in resident file',
      'Schedule follow-up meeting next week',
      'Review emergency contact procedures'
    ],
    status: 'final',
    createdAt: '2024-01-23',
    updatedAt: '2024-01-23'
  }
];

export default function CaseNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [residentFilter, setResidentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<CaseNote | null>(null);
  const [notesList, setNotesList] = useState<CaseNote[]>(mockCaseNotes);

  // Mock residents data for the modal
  const mockResidents = [
    { id: 'res1', name: 'Marcus Johnson' },
    { id: 'res2', name: 'David Rodriguez' },
    { id: 'res3', name: 'James Wilson' }
  ];

  const handleSaveNote = (note: CaseNote) => {
    if (note.id) {
      // Update existing note
      setNotesList(prev => prev.map(n => n.id === note.id ? { ...n, ...note, updatedAt: new Date().toISOString() } : n));
      toast({
        title: "Case note updated",
        description: "The case note has been updated successfully."
      });
    } else {
      // Create new note
      const newNote = {
        ...note,
        id: Date.now().toString(),
        staffId: 'current-user',
        staffName: 'Sarah Williams',
        residentName: mockResidents.find(r => r.id === note.residentId)?.name || '',
        status: 'final' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotesList(prev => [newNote, ...prev]);
      toast({
        title: "Case note created",
        description: "The case note has been created successfully."
      });
    }
    setIsCreating(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this case note?')) {
      setNotesList(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      toast({
        title: "Case note deleted",
        description: "The case note has been deleted successfully."
      });
    }
  };

  const filteredNotes = notesList.filter((note: CaseNote) => {
    const matchesSearch = note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResident = residentFilter === 'all' || note.residentId === residentFilter;
    const matchesType = typeFilter === 'all' || note.type === typeFilter;
    return matchesSearch && matchesResident && matchesType;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof FileText> = {
      one_on_one: User,
      incident: AlertTriangle,
      milestone: Star,
      check_in: CheckCircle,
      referral: ArrowRight,
      crisis: AlertTriangle,
      goal_update: FileText
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      one_on_one: 'bg-blue-100 text-blue-800',
      incident: 'bg-red-100 text-red-800',
      milestone: 'bg-green-100 text-green-800',
      check_in: 'bg-gray-100 text-gray-800',
      referral: 'bg-purple-100 text-purple-800',
      crisis: 'bg-orange-100 text-orange-800',
      goal_update: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Case Notes</h1>
                <p className="text-sm text-gray-600">Document resident interactions and progress through Life House programs</p>
              </div>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Case Note
              </Button>
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
                  placeholder="Search case notes by subject, content, or resident name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="one_on_one">One-on-One</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="goal_update">Goal Update</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={residentFilter} onValueChange={setResidentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Resident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Residents</SelectItem>
                    <SelectItem value="res1">Marcus Johnson</SelectItem>
                    <SelectItem value="res2">David Rodriguez</SelectItem>
                    <SelectItem value="res3">James Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Notes List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Case Notes ({filteredNotes.length})
              </h2>
              
              {filteredNotes.map((note: CaseNote) => {
                const IconComponent = getTypeIcon(note.type);
                return (
                  <Card 
                    key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(note.type)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{note.subject}</h3>
                            <p className="text-sm text-gray-500">{note.residentName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={getPriorityColor(note.priority)}>
                            {note.priority}
                          </Badge>
                          {note.confidential && (
                            <Badge variant="outline" className="text-xs">
                              Confidential
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {note.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(note.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {note.staffName}
                          </div>
                        </div>
                        <Badge className={getTypeColor(note.type)} variant="outline">
                          {note.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      {note.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{note.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Note Details */}
            <div>
              {selectedNote ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(selectedNote.type)}`}>
                            {React.createElement(getTypeIcon(selectedNote.type), { className: "w-4 h-4" })}
                          </div>
                          <span>{selectedNote.subject}</span>
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedNote.residentName} • {new Date(selectedNote.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingNote(selectedNote)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteNote(selectedNote.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Note Content</h4>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{selectedNote.content}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Type & Priority</h4>
                            <div className="space-y-2">
                              <Badge className={getTypeColor(selectedNote.type)}>
                                {selectedNote.type.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(selectedNote.priority)}>
                                {selectedNote.priority} priority
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedNote.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">Action Items</h4>
                        {selectedNote.actionItems.length > 0 ? (
                          <div className="space-y-2">
                            {selectedNote.actionItems.map((action: string, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                <span className="text-sm text-gray-700">{action}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No action items recorded</p>
                        )}

                        {selectedNote.followUpDate && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Follow-up Date</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              {new Date(selectedNote.followUpDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Created By</h4>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img 
                                  src="https://images.pexels.com/photos/6150527/pexels-photo-6150527.jpeg?auto=compress&cs=tinysrgb&w=50"
                                  alt="Staff member"
                                  className="w-full h-full object-cover text-xs"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.textContent = selectedNote.staffName.split(' ').map((n: string) => n[0]).join('');
                                    target.parentElement!.className += ' bg-blue-100 text-blue-800 font-semibold text-xs';
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{selectedNote.staffName}</span>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                            <Badge variant={selectedNote.status === 'final' ? 'default' : 'secondary'}>
                              {selectedNote.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">
                              {new Date(selectedNote.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium">
                              {new Date(selectedNote.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidential:</span>
                            <span className="font-medium">
                              {selectedNote.confidential ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                      <img 
                        src="https://images.pexels.com/photos/4926703/pexels-photo-4926703.jpeg?auto=compress&cs=tinysrgb&w=200"
                        alt="Life House team members collaborating"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Case Note</h3>
                    <p className="text-gray-500">Choose a case note from the list to view details, action items, and follow-up information for Life House residents.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Case Note Modal */}
      <CaseNoteModal
        isOpen={isCreating || !!editingNote}
        onClose={() => {
          setIsCreating(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        note={editingNote || undefined}
        residents={mockResidents}
      />
      </div>
  );
}
