import { useState, useRef, useEffect } from 'react';
import { X, Send, ArrowLeft, Paperclip, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from: string;
  to?: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  threadId: string;
  attachments?: string[];
  sender: 'user' | 'other';
}

interface MessageChatProps {
  message: {
    id: string;
    from: string;
    subject: string;
    preview: string;
    timestamp: string;
    read: boolean;
  };
  onClose: () => void;
}

export function MessageChat({ message, onClose }: MessageChatProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch full message thread
  const { data: thread, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/messages/thread', message.id],
    enabled: !!message.id,
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/messages/${message.id}/read`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-data'] });
    },
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('/api/messages/reply', {
        method: 'POST',
        body: JSON.stringify({
          threadId: message.id,
          content,
          to: message.from,
        }),
      });
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages/thread', message.id] });
      toast({
        title: 'Reply sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    // Mark as read when opened
    if (!message.read) {
      markAsReadMutation.mutate();
    }
  }, [message.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSendReply = () => {
    if (replyContent.trim()) {
      sendReplyMutation.mutate(replyContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Simulate typing indicator when other user is typing
  useEffect(() => {
    if (sendReplyMutation.isPending) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sendReplyMutation.isPending]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mock thread data if not available
  const messages: Message[] = thread?.messages || [
    {
      id: message.id,
      from: message.from,
      subject: message.subject,
      content: message.preview,
      timestamp: message.timestamp,
      read: true,
      threadId: message.id,
      sender: 'other',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl h-[85vh] flex flex-col bg-white">
        {/* Header */}
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {getInitials(message.from)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{message.from}</h3>
                <p className="text-sm text-gray-600">{message.subject}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hidden md:flex"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id + index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    msg.sender === 'user'
                      ? 'order-2'
                      : 'order-1'
                  }`}
                >
                  {msg.sender === 'other' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(msg.from)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">{msg.from}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((attachment, i) => (
                          <div
                            key={i}
                            className={`flex items-center space-x-1 text-xs ${
                              msg.sender === 'user' ? 'text-purple-100' : 'text-gray-600'
                            }`}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{attachment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                    {msg.sender === 'user' && msg.read && (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply Input */}
        <CardContent className="border-t p-4">
          <div className="flex items-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="mb-1"
              onClick={() => {
                toast({
                  title: 'Coming soon',
                  description: 'File attachments will be available soon.',
                });
              }}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your reply..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sendReplyMutation.isPending}
              className="mb-1"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}