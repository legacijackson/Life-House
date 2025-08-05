import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Home, Target, Building2, DollarSign, Users, Shield, BookOpen, UserCheck, HelpCircle } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  tags: string[];
  duration?: string;
  modalContent: {
    overview: string;
    sections: Array<{
      title: string;
      items: Array<{
        title?: string;
        description: string;
        isNumbered?: boolean;
      }>;
    }>;
    additionalInfo?: Array<{
      title: string;
      content: string;
    }>;
  };
}

const programs: Program[] = [
  {
    id: 'housing',
    title: '7-Stage Reentry Housing Program',
    subtitle: 'housing',
    description: 'Our comprehensive structured pathway guides residents from shelter through Legacy stages. Each stage includes specific milestones: sober housing, life-design coaching, job placement...',
    icon: <Home className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    textColor: 'text-green-800',
    tags: ['housing', 'reentry', 'support-services', '+1 more'],
    modalContent: {
      overview: 'Life House provides safe, sober transitional housing for 90-730 days, paired with holistic life-design coaching, case management, benefits enrollment, and pathways to permanent housing or homeownership.',
      sections: [
        {
          title: 'Program Overview',
          items: [
            { description: '• Safe, structured, sober living environment' },
            { description: '• Individual life-design coaching' },
            { description: '• Case management and benefits navigation' },
            { description: '• Document assistance (ID, SSN)' },
            { description: '• Financial literacy and credit repair' },
            { description: '• Job readiness and employer partnerships' }
          ]
        },
        {
          title: '7-Stage Transformation Model',
          items: [
            { title: '1. Intake', description: 'Assessment, stabilization, documents, benefits, initial plan' },
            { title: '2. Design', description: 'Individualized goals, services map, accountability schedule' },
            { title: '3. Training', description: 'Life skills, CBT groups, education/certifications, financial literacy' },
            { title: '4. Working', description: 'Job placement, income stabilization, 30% contribution (25% savings + 5% brokerage)' },
            { title: '5. Overflow', description: 'Step-down independence, continued coaching, housing search' },
            { title: '6. Transition', description: 'Permanent housing/homeownership secured, move-out readiness' },
            { title: '7. Legacy', description: 'Alumni network, mentoring, aftercare check-ins' }
          ]
        }
      ]
    }
  },
  {
    id: 'credit',
    title: 'CureMyCredit700 Partnership',
    subtitle: 'financial',
    description: 'Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information: 4.9/5 stars, 400+ reviews...',
    icon: <Target className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    textColor: 'text-blue-800',
    tags: ['credit-repair', 'financial-health', 'housing-ready', '+2 more'],
    modalContent: {
      overview: 'Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information on credit reports through proven strategies and personalized approaches.',
      sections: [
        {
          title: 'Service Overview',
          items: [
            { description: '✓ Credit Report Analysis - Expert identification of negative items affecting credit scores' },
            { description: '✓ Dispute Processing - Strategic challenges to inaccurate information with credit bureaus' },
            { description: '✓ Credit Building Guidance - Personalized strategies for improving credit health long-term' }
          ]
        },
        {
          title: 'Proven Results',
          items: [
            { description: 'Customer Rating: 4.9/5 stars' },
            { description: 'Reviews: 400+ testimonials' },
            { description: 'Typical Timeline: 3-6 months' }
          ]
        }
      ]
    }
  },
  {
    id: 'financial-literacy',
    title: 'Financial Literacy Program',
    subtitle: 'education',
    description: 'Global Investment Company partnership offering comprehensive financial education: $179.99/month program covering budgeting, investing, credit, insurance...',
    icon: <DollarSign className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    textColor: 'text-purple-800',
    tags: ['financial-literacy', 'budgeting', 'investing', '+3 more'],
    modalContent: {
      overview: 'Comprehensive financial literacy education through Global Investment Company\'s proven curriculum, covering essential money management skills for successful reentry and long-term stability.',
      sections: [
        {
          title: 'Program Structure',
          items: [
            { description: 'Monthly Cost: $179.99' },
            { description: 'Provider: Global Investment Co.' },
            { description: 'Experience: 40+ years' }
          ]
        },
        {
          title: 'Curriculum Areas',
          items: [
            { title: '• Budgeting & Money Management', description: 'Creating sustainable personal budgets, expense tracking' },
            { title: '• Debt Management', description: 'Strategies for paying down debt and avoiding financial traps' },
            { title: '• Investment Basics', description: 'Introduction to investing, risk management, portfolio building' },
            { title: '• Insurance & Risk Management', description: 'Types of insurance, determining best options' },
            { title: '• Retirement Planning', description: 'Catching up strategies, plan options, setup guidance' }
          ]
        }
      ]
    }
  },
  {
    id: 'business-coaching',
    title: 'Business Coaching Program',
    subtitle: 'coaching',
    description: 'Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and build a legacy that serves you"',
    icon: <Building2 className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
    textColor: 'text-orange-800',
    tags: ['entrepreneurship', 'coaching', 'legacy-building', '+2 more'],
    modalContent: {
      overview: 'Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and build a legacy that serves you"',
      sections: [
        {
          title: 'Legacy Business Method',
          items: [
            { description: 'This isn\'t just business coaching—it\'s building an intentional, soul-aligned ecosystem that supports you financially, spiritually, and creatively. The "Earn While You Learn" framework helps residents generate real revenue while building their brand.' }
          ]
        },
        {
          title: 'Core Philosophy',
          items: [
            { description: '• You can earn while you learn - no need to wait for perfection' },
            { description: '• Build a body of work, not just a business' },
            { description: '• Soul-aligned ecosystem supporting you holistically' },
            { description: '• Focus on transformation, not just transactions' },
            { description: '• Create systems that honor your natural rhythms' },
            { description: '• Build sustainable revenue without burnout' }
          ]
        },
        {
          title: 'Business Development Stages',
          items: [
            { title: '1. Clarify & Messaging', description: 'Define who you serve and speak their language, not expert-speak' },
            { title: '2. Offer Testing & Validation', description: 'Test ideas with real humans before building the full program' },
            { title: '3. Revenue Ecosystem', description: 'Build signature offers and pricing strategies that reflect your value' },
            { title: '4. Systems & Structure', description: 'Create repeatable workflows and delegate effectively' },
            { title: '5. Legacy & Leadership', description: 'Scale without burnout and design your exit strategy' }
          ]
        },
        {
          title: 'Business Alignment Diagnostic Areas',
          items: [
            { title: '💰 Money + Offers', description: 'Revenue ecosystem, signature offers, confident pricing' },
            { title: '🏗️ Structure + Systems', description: 'Team roles, operations workflow, data tracking' },
            { title: '👁️ Visibility + Marketing', description: 'Messaging alignment, content strategy, sales conversations' },
            { title: '⚖️ Legacy + Leadership', description: 'Scaling strategies, sabbatical planning, method licensing' }
          ]
        }
      ],
      additionalInfo: [
        {
          title: 'This Isn\'t Hustle Culture—It\'s Holistic Culture',
          content: '"You are not a machine. You are not an algorithm. You are a unique and worthy soul who gets to choose their own rhythm. Your business must honor that whole person—not just your tasks."'
        }
      ]
    }
  },
  {
    id: 'brokerage',
    title: 'Brokerage & Savings Program',
    subtitle: 'savings',
    description: 'Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation.',
    icon: <Shield className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    textColor: 'text-green-800',
    tags: ['wealth-building', 'client-ownership', 'trust-model', '+2 more'],
    modalContent: {
      overview: 'Professional wealth-building services with transparent trust account model and client beneficial ownership',
      sections: [
        {
          title: 'Trust Account Model',
          items: [
            { description: 'Building on Global Investment Company\'s experience with institutional trustee services, this program provides professional investment management while clients retain beneficial ownership of all funds with structured access during program participation.' }
          ]
        },
        {
          title: 'Account Setup Features',
          items: [
            { description: '• Standard brokerage terms for all clients' },
            { description: '• Full disclosure during normal application process' },
            { description: '• Multiple partner options: Credit unions, Fidelity, discount brokers' },
            { description: '• Leverages NorCal FDC relationship and city partnerships' }
          ]
        },
        {
          title: 'Ethical Safeguards & Client Protections',
          items: [
            { title: '✓ Client Beneficial Ownership', description: 'Clients retain beneficial ownership of all funds at all times' },
            { title: '✓ Clear Graduation Provisions', description: 'Well-defined timeline to full account control upon program completion' },
            { title: '✓ Transparent Fee Structure', description: 'Trustee fees separate from brokerage fees, fully disclosed' },
            { title: '✓ Institutional Trust Experience', description: 'GIC acts as institutional trustee/fiduciary with proven track record' }
          ]
        },
        {
          title: 'Program Support Services',
          items: [
            { title: '• Financial Literacy Education', description: 'Required before account opening to ensure informed decisions' },
            { title: '• Monthly Financial Coaching', description: 'Ongoing support sessions while participating in program' },
            { title: '• Graduated Investment Access', description: 'Investment options expand based on demonstrated financial knowledge' },
            { title: '• Emergency Hardship Provisions', description: 'Partial/full withdrawal options for qualifying circumstances' }
          ]
        }
      ]
    }
  },
  {
    id: 'partnerships',
    title: 'Community Partnerships',
    subtitle: 'partnerships',
    description: 'Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contractors, CalAIM ECM providers...',
    icon: <Users className="w-8 h-8 text-white" />,
    bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    textColor: 'text-purple-800',
    tags: ['wraparound-services', 'healing-centered', 'community', '+3 more'],
    modalContent: {
      overview: 'Strategic healing-centered engagement network for comprehensive wraparound services',
      sections: [
        {
          title: 'Partnership Network',
          items: [
            { description: 'Life House maintains strategic partnerships with key organizations to provide comprehensive wraparound services, ensuring residents have access to all necessary support systems for successful reentry and long-term stability.' }
          ]
        },
        {
          title: 'Key Partners',
          items: [
            { description: '• Parole and Probation Departments' },
            { description: '• STOP Prime Contractors' },
            { description: '• Medi-Cal Managed Care Plans' },
            { description: '• CalAIM ECM Providers' },
            { description: '• Community Support Organizations' },
            { description: '• Licensed Clinical Providers' }
          ]
        },
        {
          title: 'Healing-Centered Approach',
          items: [
            { title: '• Trauma-Informed Care', description: 'Recognition and response to trauma impacts throughout services' },
            { title: '• Cultural Responsiveness', description: 'Services aligned with community values and cultural practices' },
            { title: '• Strength-Based Support', description: 'Focus on individual assets and community resilience building' },
            { title: '• Referral Pathways', description: 'Streamlined connections to essential services and ongoing support' }
          ]
        }
      ]
    }
  }
];

export function LifeHousePrograms() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Life House Programs & Services</h2>
        <p className="text-gray-600 mb-8">Comprehensive wraparound services designed for successful reentry</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className={`${program.bgColor} border-0 cursor-pointer hover:shadow-lg transition-all duration-300 h-full`}
              onClick={() => setSelectedProgram(program)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className={`text-lg font-bold ${program.textColor}`}>
                      {program.title}
                    </CardTitle>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    program.id === 'housing' ? 'bg-green-500' :
                    program.id === 'credit' ? 'bg-blue-500' :
                    program.id === 'financial-literacy' ? 'bg-purple-500' :
                    program.id === 'business-coaching' ? 'bg-orange-500' :
                    program.id === 'brokerage' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}>
                    {program.icon}
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2 w-fit">
                  {program.subtitle}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {program.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {program.tags.map((tag, index) => (
                    <span key={index} className="text-xs text-gray-600">
                      {tag}
                      {index < program.tags.length - 1 && <span className="mx-1">•</span>}
                    </span>
                  ))}
                </div>
                {program.duration && (
                  <p className="text-sm font-medium text-gray-700 mt-3">
                    {program.duration}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="program-detail-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedProgram.id === 'housing' ? 'bg-green-500' :
                  selectedProgram.id === 'credit' ? 'bg-blue-500' :
                  selectedProgram.id === 'financial-literacy' ? 'bg-purple-500' :
                  selectedProgram.id === 'business-coaching' ? 'bg-orange-500' :
                  selectedProgram.id === 'brokerage' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}>
                  {selectedProgram.icon}
                </div>
                {selectedProgram.title}
              </DialogTitle>
              <DialogDescription id="program-detail-description" className="text-base mt-3">
                {selectedProgram.modalContent.overview}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {selectedProgram.modalContent.sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="text-sm text-gray-700">
                        {item.title && (
                          <span className="font-medium">{item.title}</span>
                        )}
                        {item.title && item.description && <span className="mx-1">-</span>}
                        <span>{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {selectedProgram.modalContent.additionalInfo && (
                <div className="space-y-4 mt-6 pt-6 border-t">
                  {selectedProgram.modalContent.additionalInfo.map((info, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{info.title}</h4>
                      <p className="text-sm text-gray-700 italic">{info.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}