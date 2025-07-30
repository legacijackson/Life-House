
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Save, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  purpose: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EditableNoteCardProps {
  note: Note;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function EditableNoteCard({ note, canEdit = true, canDelete = true }: EditableNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    editable: isEditing,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] p-3',
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedContent: string) =>
      apiRequest(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: updatedContent }),
      }),
    onSuccess: () => {
      toast.success('Note updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update note');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/notes/${note.id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
    },
    onError: () => {
      toast.error('Failed to delete note');
    },
  });

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      updateMutation.mutate(content);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(note.content);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'incident':
        return 'bg-red-100 text-red-800';
      case 'progress':
        return 'bg-green-100 text-green-800';
      case 'touchpoint':
        return 'bg-blue-100 text-blue-800';
      case 'achievement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{note.title}</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPurposeColor(note.purpose)}>
                {note.purpose}
              </Badge>
              <Badge variant="secondary">{note.type}</Badge>
            </div>
            <div className="text-sm text-gray-500">
              By {note.createdBy} • {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
              {note.updatedAt !== note.createdAt && (
                <span> • Updated {format(new Date(note.updatedAt), 'MMM d, yyyy h:mm a')}</span>
              )}
            </div>
          </div>
          
          {(canEdit || canDelete) && (
            <div className="flex space-x-1">
              {canEdit && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              
              {isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {canDelete && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-md">
          <EditorContent editor={editor} />
        </div>
        
        {note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
