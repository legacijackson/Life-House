import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Edit,
  AlertTriangle,
  Star,
  CheckCircle,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { CaseNoteModal } from "@/components/case-note-modal";
import { toast } from "@/hooks/use-toast";

interface CaseNote {
  id: string;
  clientId: string;
  staffId: string;
  caseManagerId?: string;
  noteType: string;
  title: string;
  summary: string;
  details?: string;
  priority: number;
  confidential: boolean;
  followUpDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // joined fields
  clientName?: string;
  staffName?: string;
}

interface Resident {
  id: string;
  name: string;
}

const PRIORITY_LABELS: Record<number, string> = { 1: 'urgent', 2: 'high', 3: 'medium', 4: 'low' };
const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-blue-100 text-blue-800',
  4: 'bg-gray-100 text-gray-800',
};

export default function CaseNotes() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [residentFilter, setResidentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const { data: caseNotes = [], isLoading } = useQuery<CaseNote[]>({
    queryKey: ['/api/staff-case-notes'],
    queryFn: () => apiRequest('GET', '/api/staff-case-notes').then((r) => r.json()),
  });

  const { data: residents = [] } = useQuery<Resident[]>({
    queryKey: ['/api/residents'],
    queryFn: () => apiRequest('GET', '/api/residents').then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/notes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/staff-case-notes'] });
      setSelectedNote(null);
      toast({ title: 'Case note deleted', description: 'The note has been archived.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return apiRequest('PATCH', `/api/staff-case-notes/${data.id}`, data).then((r) => r.json());
      }
      return apiRequest('POST', '/api/staff-case-notes', data).then((r) => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/staff-case-notes'] });
      setIsCreating(false);
      setEditingNote(null);
      toast({ title: 'Saved', description: 'Case note saved successfully.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' }),
  });

  const handleSaveNote = (note: any) => {
    const payload: any = {
      clientId: note.residentId ?? note.clientId,
      noteType: note.type ?? note.noteType,
      title: note.subject ?? note.title,
      summary: note.content ?? note.summary,
      details: note.details,
      priority: note.priority ?? 4,
      confidential: note.confidential ?? false,
      followUpDate: note.followUpDate,
      status: 'submitted',
    };
    if (note.id) payload.id = note.id;
    saveMutation.mutate(payload);
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this case note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  const filteredNotes = caseNotes.filter((note: CaseNote) => {
    const clientName = note.clientName ?? note.clientId ?? '';
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResident = residentFilter === 'all' || note.clientId === residentFilter;
    const matchesType = typeFilter === 'all' || note.noteType === typeFilter;
    return matchesSearch && matchesResident && matchesType;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof FileText> = {
      'one_on_one': User,
      'incident': AlertTriangle,
      'milestone': Star,
      'check-in': CheckCircle,
      'check_in': CheckCircle,
      'referral': ArrowRight,
      'crisis': AlertTriangle,
      'goal-update': FileText,
      'goal_update': FileText,
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'one_on_one': 'bg-blue-100 text-blue-800',
      'incident': 'bg-red-100 text-red-800',
      'milestone': 'bg-green-100 text-green-800',
      'check-in': 'bg-gray-100 text-gray-800',
      'check_in': 'bg-gray-100 text-gray-800',
      'referral': 'bg-purple-100 text-purple-800',
      'crisis': 'bg-orange-100 text-orange-800',
      'goal-update': 'bg-indigo-100 text-indigo-800',
      'goal_update': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
                  placeholder="Search case notes by title, content, or resident..."
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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="check-in">Check-in</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="goal-update">Goal Update</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={residentFilter} onValueChange={setResidentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Resident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Residents</SelectItem>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
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

              {isLoading ? (
                <Card><CardContent className="p-6 text-center text-gray-500">Loading…</CardContent></Card>
              ) : filteredNotes.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-gray-500">No case notes found.</CardContent></Card>
              ) : filteredNotes.map((note: CaseNote) => {
                const IconComponent = getTypeIcon(note.noteType);
                const priorityLabel = PRIORITY_LABELS[note.priority] ?? 'general';
                const priorityColor = PRIORITY_COLORS[note.priority] ?? 'bg-gray-100 text-gray-800';
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
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(note.noteType)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{note.title}</h3>
                            <p className="text-sm text-gray-500">{note.clientName ?? note.clientId}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={priorityColor}>{priorityLabel}</Badge>
                          {note.confidential && (
                            <Badge variant="outline" className="text-xs">Confidential</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{note.summary}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {note.staffName ?? note.staffId}
                          </div>
                        </div>
                        <Badge className={getTypeColor(note.noteType)} variant="outline">
                          {note.noteType.replace(/[_-]/g, ' ')}
                        </Badge>
                      </div>
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
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(selectedNote.noteType)}`}>
                            {React.createElement(getTypeIcon(selectedNote.noteType), { className: "w-4 h-4" })}
                          </div>
                          <span>{selectedNote.title}</span>
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedNote.clientName ?? selectedNote.clientId} • {new Date(selectedNote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingNote({
                            ...selectedNote,
                            residentId: selectedNote.clientId,
                            type: selectedNote.noteType,
                            subject: selectedNote.title,
                            content: selectedNote.summary,
                          })}
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
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{selectedNote.summary}</p>
                          </div>
                        </div>
                        {selectedNote.details && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{selectedNote.details}</p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Type</h4>
                            <Badge className={getTypeColor(selectedNote.noteType)}>
                              {selectedNote.noteType.replace(/[_-]/g, ' ')}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
                            <Badge className={PRIORITY_COLORS[selectedNote.priority] ?? 'bg-gray-100 text-gray-800'}>
                              {PRIORITY_LABELS[selectedNote.priority] ?? 'general'}
                            </Badge>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="space-y-4">
                        {selectedNote.followUpDate ? (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Follow-up Date</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              {new Date(selectedNote.followUpDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No follow-up date set</p>
                        )}
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Staff:</span>
                            <span className="font-medium">{selectedNote.staffName ?? selectedNote.staffId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <Badge variant={selectedNote.status === 'submitted' ? 'default' : 'secondary'}>
                              {selectedNote.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">{new Date(selectedNote.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium">{new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidential:</span>
                            <span className="font-medium">{selectedNote.confidential ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Case Note</h3>
                    <p className="text-gray-500">Choose a case note from the list to view details and follow-up information.</p>
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
        residents={residents}
      />
    </div>
  );
}
