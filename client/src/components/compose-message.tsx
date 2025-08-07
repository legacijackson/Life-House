import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface ComposeMessageProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ComposeMessage({ isOpen, onClose, defaultRecipient }: ComposeMessageProps) {
  const [recipient, setRecipient] = useState(defaultRecipient || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Fetch all users for recipient selection
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserName: string; subject: string; body: string }) => {
      return apiRequest('/api/messages/send', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      // Reset form
      setRecipient('');
      setSubject('');
      setBody('');
      
      // Invalidate queries to refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/staff/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
      
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    if (!recipient || !subject.trim() || !body.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      toUserName: recipient,
      subject,
      body,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Compose New Message</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">To</Label>
            <Select
              value={recipient}
              onValueChange={setRecipient}
            >
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {users?.filter(u => u.role === 'Admin' || u.role === 'CaseManager').map(user => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject"
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sendMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMessageMutation.isPending || !recipient || !subject.trim() || !body.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}