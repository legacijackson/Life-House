import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  HelpCircle, 
  X, 
  Send, 
  MessageCircle,
  Book,
  Phone,
  Mail,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  weight: number;
}

interface HelpDeskProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function HelpDesk({ isOpen: externalIsOpen, onClose }: HelpDeskProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined && onClose ? onClose : () => setInternalIsOpen(!internalIsOpen);
  
  const [selectedCategory, setSelectedCategory] = useState<'faq' | 'contact'>('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });

  const { user } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Fetch contextual FAQs based on user role and current page
  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: ['/api/support', (user as any)?.role, location],
    queryFn: () => apiRequest(`/api/support?page=${encodeURIComponent(location)}`),
    enabled: !!user && isOpen,
  });

  // Filter FAQs based on search term
  const filteredFaqs = (Array.isArray(faqs) ? faqs : []).filter((faq: FAQItem) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FAQ feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: ({ faqId, helpful }: { faqId: string; helpful: boolean }) =>
      apiRequest('/api/support/feedback', 'POST', { faqId, helpful }),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    }
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the support request
    toast.success("Support request submitted! We'll get back to you within 24 hours.");
    
    setContactForm({ subject: '', message: '' });
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Help Button - only show if not controlled externally */}
      {externalIsOpen === undefined && (
        <Button
          onClick={() => setInternalIsOpen(!internalIsOpen)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <HelpCircle className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* Help Desk Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[600px] shadow-xl z-40 overflow-hidden">
          <CardHeader className="bg-primary text-white pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Category Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setSelectedCategory('faq')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedCategory === 'faq' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Book className="h-4 w-4 inline mr-2" />
                FAQs
              </button>
              <button
                onClick={() => setSelectedCategory('contact')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedCategory === 'contact' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Contact Support
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {selectedCategory === 'faq' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      {user && typeof user === 'object' && 'role' in user ? `Help for ${(user as any).role} - ${location}` : 'Find quick answers to common questions'}
                    </p>
                    {Array.isArray(faqs) && faqs.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {filteredFaqs.length} of {faqs.length} FAQs
                      </span>
                    )}
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {faqsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading help articles...</p>
                    </div>
                  ) : filteredFaqs.length === 0 ? (
                    <div className="text-center py-4">
                      <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {searchTerm ? 'No FAQs match your search.' : 'No help articles available for this page.'}
                      </p>
                    </div>
                  ) : (
                    filteredFaqs.map((faq: FAQItem) => (
                      <details key={faq.id} className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{faq.question}</p>
                            </div>
                            <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 ml-2" />
                          </div>
                        </summary>
                        <div className="p-3 text-sm text-gray-600 mt-1 bg-gray-25 rounded-b-lg">
                          <p className="mb-3">{faq.answer}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">Was this helpful?</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => feedbackMutation.mutate({ faqId: faq.id, helpful: true })}
                                className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => feedbackMutation.mutate({ faqId: faq.id, helpful: false })}
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </details>
                    ))
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-900 mb-2">
                      Need more help?
                    </h4>
                    <div className="space-y-2 text-sm">
                      <a 
                        href="tel:1-800-LIFEHOUSE" 
                        className="flex items-center text-blue-700 hover:text-blue-900"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        1-800-LIFEHOUSE
                      </a>
                      <a 
                        href="mailto:support@lifehouse.org" 
                        className="flex items-center text-blue-700 hover:text-blue-900"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        support@lifehouse.org
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Send us a message and we'll respond within 24 hours
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Please provide details about your issue or question..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <div className="text-center text-sm text-gray-500 mt-4">
                    <p>For urgent issues, please call:</p>
                    <a href="tel:1-800-LIFEHOUSE" className="font-medium text-primary">
                      1-800-LIFEHOUSE
                    </a>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}