import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  CalendarIcon,
  Plus,
  X,
  FileText,
  User,
  AlertTriangle,
  Star,
  CheckCircle,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CaseNote {
  id?: string;
  residentId: string;
  residentName?: string;
  type: 'one_on_one' | 'incident' | 'milestone' | 'check_in' | 'referral' | 'crisis' | 'goal_update';
  subject: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  confidential: boolean;
  actionItems: string[];
  followUpDate?: Date;
}

interface CaseNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: CaseNote) => void;
  note?: CaseNote;
  residents?: Array<{ id: string; name: string }>;
}

const caseNoteSchema = z.object({
  residentId: z.string().min(1, "Please select a resident"),
  type: z.enum(['one_on_one', 'incident', 'milestone', 'check_in', 'referral', 'crisis', 'goal_update']),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  confidential: z.boolean().default(false),
  followUpDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([])
});

export function CaseNoteModal({
  isOpen,
  onClose,
  onSave,
  note,
  residents = []
}: CaseNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [actionItemInput, setActionItemInput] = useState('');
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const form = useForm<z.infer<typeof caseNoteSchema>>({
    resolver: zodResolver(caseNoteSchema),
    defaultValues: {
      residentId: note?.residentId || '',
      type: note?.type || 'check_in',
      subject: note?.subject || '',
      content: note?.content || '',
      priority: note?.priority || 'medium',
      confidential: note?.confidential || false,
      followUpDate: note?.followUpDate,
      tags: note?.tags || [],
      actionItems: note?.actionItems || []
    }
  });

  // AI assistance mutation
  const aiAssistMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return await apiRequest('POST', '/api/ai/notes', {
        prompt,
        residentId: form.getValues('residentId'),
        noteType: form.getValues('type')
      });
    },
    onSuccess: (data: any) => {
      form.setValue('content', data.noteText || data.content || '');
      setShowAIAssist(false);
      setAiPrompt('');
      toast({
        title: "AI Suggestion Applied",
        description: "Review and edit the generated content as needed.",
      });
    },
    onError: () => {
      toast({
        title: "AI Assistance Failed",
        description: "Unable to generate suggestion. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (note) {
      form.reset({
        residentId: note.residentId,
        type: note.type,
        subject: note.subject,
        content: note.content,
        priority: note.priority,
        confidential: note.confidential,
        followUpDate: note.followUpDate,
        tags: note.tags || [],
        actionItems: note.actionItems || []
      });
    }
  }, [note, form]);

  const handleSubmit = async (values: z.infer<typeof caseNoteSchema>) => {
    setIsSubmitting(true);
    try {
      onSave({
        ...values,
        id: note?.id
      });
      toast({
        title: note ? "Case note updated" : "Case note created",
        description: "The case note has been saved successfully."
      });
      onClose();
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save case note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags').includes(tagInput.trim())) {
      form.setValue('tags', [...form.getValues('tags'), tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags').filter(tag => tag !== tagToRemove));
  };

  const addActionItem = () => {
    if (actionItemInput.trim()) {
      form.setValue('actionItems', [...form.getValues('actionItems'), actionItemInput.trim()]);
      setActionItemInput('');
    }
  };

  const removeActionItem = (index: number) => {
    const items = form.getValues('actionItems');
    form.setValue('actionItems', items.filter((_, i) => i !== index));
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      one_on_one: User,
      incident: AlertTriangle,
      milestone: Star,
      check_in: CheckCircle,
      referral: ArrowRight,
      crisis: AlertTriangle,
      goal_update: FileText
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Edit Case Note' : 'New Case Note'}
          </DialogTitle>
          <DialogDescription>
            Document resident interactions and progress through Life House programs
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="residentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resident</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resident" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {residents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_on_one">One-on-One</SelectItem>
                        <SelectItem value="check_in">Check-in</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="crisis">Crisis</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="goal_update">Goal Update</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of the note" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the interaction or observation" 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    {!showAIAssist ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIAssist(true)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Assist
                      </Button>
                    ) : (
                      <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                        <Label>Describe the interaction or key points:</Label>
                        <Textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g., Met with resident about employment goals, discussed resume building and job applications..."
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => aiAssistMutation.mutate(aiPrompt)}
                            disabled={!aiPrompt.trim() || aiAssistMutation.isPending}
                          >
                            {aiAssistMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Generate
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAIAssist(false);
                              setAiPrompt('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Follow-up Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="confidential"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Confidential</FormLabel>
                    <FormDescription>
                      Mark this note as confidential if it contains sensitive information
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.getValues('tags').length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.getValues('tags').map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="space-y-2">
              <Label>Action Items</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an action item"
                  value={actionItemInput}
                  onChange={(e) => setActionItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                />
                <Button type="button" variant="secondary" onClick={addActionItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.getValues('actionItems').length > 0 && (
                <ul className="space-y-1 mt-2">
                  {form.getValues('actionItems').map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">• {item}</span>
                      <button
                        type="button"
                        onClick={() => removeActionItem(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {note ? 'Update' : 'Create'} Case Note
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}