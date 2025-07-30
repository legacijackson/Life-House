import { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I add a new resident?",
    answer: "Navigate to the Residents page and click the 'Add Resident' button. Fill in the required information and submit the form.",
    category: "Residents"
  },
  {
    question: "How do I log case notes?",
    answer: "Go to the resident's profile and click 'View Case Notes'. Then click 'Add Note' to create a new case note entry.",
    category: "Case Management"
  },
  {
    question: "How do I generate reports?",
    answer: "Visit the Reports page, select your report type and date range, then click the 'Generate Report' button to download your report.",
    category: "Reports"
  },
  {
    question: "How do I track attendance?",
    answer: "Use the Attendance page to log daily check-ins. You can view attendance history and compliance rates there.",
    category: "Attendance"
  },
  {
    question: "How do I refer a resident to services?",
    answer: "From the resident's profile, click 'Refer to Service' and select the appropriate program or resource from the available options.",
    category: "Referrals"
  }
];

interface HelpDeskProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function HelpDesk({ isOpen: externalIsOpen, onClose }: HelpDeskProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined && onClose ? onClose : () => setInternalIsOpen(!internalIsOpen);
  
  const [selectedCategory, setSelectedCategory] = useState<'faq' | 'contact'>('faq');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
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
                  <p className="text-sm text-gray-600 mb-4">
                    Find quick answers to common questions
                  </p>
                  
                  {faqs.map((faq, index) => (
                    <details key={index} className="group">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div>
                            <p className="font-medium text-sm">{faq.question}</p>
                            <p className="text-xs text-gray-500 mt-1">{faq.category}</p>
                          </div>
                          <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                      </summary>
                      <div className="p-3 text-sm text-gray-600 mt-1">
                        {faq.answer}
                      </div>
                    </details>
                  ))}

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