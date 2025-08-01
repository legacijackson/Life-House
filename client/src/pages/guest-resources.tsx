
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ExternalLink, Phone, Globe, MapPin, Home, TrendingUp, GraduationCap, Users, PiggyBank, Heart } from "lucide-react";
import { Logo } from "@/components/logo";
import { PublicMobileNav } from "@/components/public-mobile-nav";

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  eligibility: string;
  hours: string;
}

interface ProgramCardProps {
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  provider?: string;
  bgColor: string;
  iconBg: string;
  categoryBadge: string;
}

function ProgramCard({ title, description, category, categoryLabel, tags, provider, bgColor, iconBg, categoryBadge }: ProgramCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const getIcon = (category: string) => {
    switch (category) {
      case 'housing': return Home;
      case 'financial': return TrendingUp;
      case 'education': return GraduationCap;
      case 'coaching': return Users;
      case 'savings': return PiggyBank;
      case 'partnerships': return Heart;
      default: return Home;
    }
  };
  
  const Icon = getIcon(category);
  
  return (
    <>
      <Card 
        className={`${bgColor} border-0 cursor-pointer hover:shadow-lg transition-shadow duration-300`}
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-gray-700" />
            </div>
            <Badge className={`${categoryBadge} text-xs font-medium`}>
              {categoryLabel}
            </Badge>
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs text-gray-600 border-gray-300">
                {tag}
              </Badge>
            ))}
          </div>
          {provider && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              {provider}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <div className={`p-8 pb-6 ${bgColor}`}>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {title}
                    </DialogTitle>
                    <p className="text-gray-700 font-medium">
                      {getModalContent(title).subtitle}
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>
            
            <div className="p-8 pt-6 space-y-8 max-h-[calc(90vh-200px)] overflow-y-auto">
              {getModalContent(title).content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getModalContent(title: string) {
  switch (title) {
    case '7-Stage Reentry Housing Program':
      return {
        subtitle: 'Safe, structured living with comprehensive life-design support for formerly incarcerated individuals',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                Program Overview
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Life House provides safe, sober transitional housing for 90-730 days, paired with holistic life-design coaching, 
                case management, benefits enrollment, and pathways to permanent housing or homeownership.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                7-Stage Transformation Model
              </h3>
              <div className="space-y-4">
                {[
                  { stage: '1', title: 'Intake', desc: 'Assessment, stabilization, documents, benefits, initial plan' },
                  { stage: '2', title: 'Design', desc: 'Individualized goals, services map, accountability schedule' },
                  { stage: '3', title: 'Training', desc: 'Life skills, CBT groups, education/certifications, financial literacy' },
                  { stage: '4', title: 'Working', desc: 'Job placement, income stabilization, 30% contribution (25% savings + 5% brokerage)' },
                  { stage: '5', title: 'Overflow', desc: 'Step-down independence, continued coaching, housing search' },
                  { stage: '6', title: 'Transition', desc: 'Permanent housing/homeownership secured, move-out readiness' },
                  { stage: '7', title: 'Legacy', desc: 'Alumni network, mentoring, aftercare check-ins' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {item.stage}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Safe, structured, sober living environment',
                  'Individual life-design coaching',
                  'Case management and benefits navigation',
                  'Document assistance (ID, SSN)',
                  'Financial literacy and credit repair',
                  'Job readiness and employer partnerships'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      };

    case 'CureMyCredit700 Partnership':
      return {
        subtitle: 'Professional credit repair through CureMyCredit700 - proven strategies for housing and financial stability',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                Service Overview
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable 
                information on credit reports through proven strategies and personalized approaches.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                Core Services
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Credit Report Analysis', desc: 'Expert identification of negative items affecting credit scores' },
                  { title: 'Dispute Processing', desc: 'Strategic challenges to inaccurate information with credit bureaus' },
                  { title: 'Credit Building Guidance', desc: 'Personalized strategies for improving credit health long-term' }
                ].map((service, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{service.title}</h4>
                      <p className="text-gray-600 text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                Proven Results
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">4.9/5</div>
                  <div className="text-sm text-gray-600">Customer Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">400+</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">3-6</div>
                  <div className="text-sm text-gray-600">Typical Timeline</div>
                </div>
              </div>
            </section>
          </div>
        )
      };

    case 'Financial Literacy Program':
      return {
        subtitle: 'Global Investment Company partnership - comprehensive financial education for lifelong stability',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                Program Structure
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Comprehensive financial literacy education through Global Investment Company's proven curriculum, 
                covering essential money management skills for successful reentry and long-term stability.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                Curriculum Areas
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Budgeting & Money Management', desc: 'Creating and maintaining personal budgets, expense tracking' },
                  { title: 'Debt Management', desc: 'Strategies for paying down debt and avoiding financial traps' },
                  { title: 'Investment Basics', desc: 'Introduction to investing, risk management, portfolio building' },
                  { title: 'Insurance & Risk Management', desc: 'Types of insurance, determining best options' },
                  { title: 'Retirement Planning', desc: 'Catching up strategies, plan options, setup guidance' }
                ].map((area, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{area.title}</h4>
                      <p className="text-gray-600 text-sm">{area.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                Program Details
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">$179.99</div>
                  <div className="text-sm text-gray-600">Monthly Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">GIC</div>
                  <div className="text-sm text-gray-600">Provider</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">40+</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
              </div>
            </section>
          </div>
        )
      };

    case 'Business Coaching Program':
      return {
        subtitle: 'Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and build a legacy that serves you"',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-orange-600 mr-3 rounded-full"></span>
                Legacy Business Method
              </h3>
              <p className="text-gray-700 leading-relaxed">
                This isn't just business coaching—it's building an intentional, soul-aligned ecosystem that supports you 
                financially, spiritually, and creatively. The "Earn While You Learn!" framework helps residents generate real 
                revenue while building their brand.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                Business Development Stages
              </h3>
              <div className="space-y-4">
                {[
                  { stage: '1', title: 'Clarity & Messaging', desc: 'Define who you serve and speak their language, not expert-speak' },
                  { stage: '2', title: 'Offer Testing & Validation', desc: 'Test ideas with real humans before building the full program' },
                  { stage: '3', title: 'Revenue Ecosystem', desc: 'Build signature offers and pricing strategies that reflect your value' },
                  { stage: '4', title: 'Systems & Structure', desc: 'Create repeatable workflows and delegate effectively' },
                  { stage: '5', title: 'Legacy & Leadership', desc: 'Scale without burnout and design your exit strategy' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {item.stage}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                Core Philosophy
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                {[
                  'You can earn while you learn - no need to wait for perfection',
                  'Build a body of work, not just a business',
                  'Soul-aligned ecosystem supporting you holistically',
                  'Focus on transformation, not just transactions',
                  'Create systems that honor your natural rhythms',
                  'Build sustainable revenue without burnout'
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></div>
                    <span className="text-gray-700 text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                Business Alignment Diagnostic Areas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">💰 Money + Offers</h4>
                  <p className="text-gray-600 text-sm">Revenue ecosystem, signature offers, confident pricing</p>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">👁️ Visibility + Marketing</h4>
                  <p className="text-gray-600 text-sm">Messaging alignment, content strategy, sales conversations</p>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">🧠 Structure + Systems</h4>
                  <p className="text-gray-600 text-sm">Team roles, operations workflow, data tracking</p>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">🏆 Legacy + Leadership</h4>
                  <p className="text-gray-600 text-sm">Scaling strategies, sabbatical planning, method licensing</p>
                </div>
              </div>
            </section>

            <div className="bg-orange-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">This Isn't Hustle Culture—It's Holistic Culture</h4>
              <p className="text-gray-700 italic">
                "You are not a machine. You are not an algorithm. You are a unique and worthy soul who gets to choose their own rhythm. 
                Your business must honor that whole person—not just your tasks."
              </p>
            </div>
          </div>
        )
      };

    case 'Brokerage & Savings Program':
      return {
        subtitle: 'Professional wealth-building services with transparent trust account model and client beneficial ownership',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                Trust Account Model
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Building on Global Investment Company's experience with institutional trustee services, this program provides 
                professional investment management while clients retain beneficial ownership of all funds with structured access 
                during program participation.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                Program Support Services
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Financial Literacy Education', desc: 'Required before account opening to ensure informed decisions' },
                  { title: 'Monthly Financial Coaching', desc: 'Ongoing support sessions while participating in program' },
                  { title: 'Graduated Investment Access', desc: 'Investment options expand based on demonstrated financial knowledge' },
                  { title: 'Emergency Hardship Provisions', desc: 'Partial/full withdrawal options for qualifying circumstances' }
                ].map((service, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{service.title}</h4>
                      <p className="text-gray-600 text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-orange-600 mr-3 rounded-full"></span>
                Account Setup Features
              </h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                {[
                  'Standard brokerage terms for all clients',
                  'Full disclosure during normal application process',
                  'Multiple partner options: Credit unions, Fidelity, discount brokers',
                  'Leverages NorCal FDC relationship and city partnerships'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                Ethical Safeguards & Client Protections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">✓ Client Beneficial Ownership</h4>
                  <p className="text-gray-600 text-sm">Clients retain beneficial ownership of all funds at all times</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">✓ Transparent Fee Structure</h4>
                  <p className="text-gray-600 text-sm">Trustee fees separate from brokerage fees, fully disclosed</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">✓ Clear Graduation Provisions</h4>
                  <p className="text-gray-600 text-sm">Well-defined timeline to full account control upon program completion</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">✓ Institutional Trust Experience</h4>
                  <p className="text-gray-600 text-sm">GIC acts as institutional trustee/fiduciary with proven track record</p>
                </div>
              </div>
            </section>
          </div>
        )
      };

    case 'Community Partnerships':
      return {
        subtitle: 'Strategic healing-centered engagement network for comprehensive wraparound services',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-pink-600 mr-3 rounded-full"></span>
                Partnership Network
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Life House maintains strategic partnerships with key organizations to provide comprehensive wraparound 
                services, ensuring residents have access to all necessary support systems for successful reentry and 
                long-term stability.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-orange-600 mr-3 rounded-full"></span>
                Key Partners
              </h3>
              <div className="space-y-3">
                {[
                  'Parole and Probation Departments',
                  'STOP Prime Contractors',
                  'Medi-Cal Managed Care Plans',
                  'CalAIM ECM Providers',
                  'Community Support Organizations',
                  'Licensed Clinical Providers'
                ].map((partner, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                    <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{partner}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                Healing-Centered Approach
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Trauma-Informed Care', desc: 'Recognition and response to trauma impacts throughout services' },
                  { title: 'Cultural Responsiveness', desc: 'Services aligned with community values and cultural practices' },
                  { title: 'Strength-Based Support', desc: 'Focus on individual assets and community resilience building' },
                  { title: 'Referral Pathways', desc: 'Streamlined connections to essential services and ongoing support' }
                ].map((approach, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-pink-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{approach.title}</h4>
                      <p className="text-gray-600 text-sm">{approach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      };

    default:
      return {
        subtitle: '',
        content: <div>Program details coming soon...</div>
      };
  }
}

export default function GuestResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  const searchResources = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resources?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors: Record<string, string> = {
    'Housing': 'bg-blue-100 text-blue-800',
    'Employment': 'bg-green-100 text-green-800',
    'Healthcare': 'bg-red-100 text-red-800',
    'Legal': 'bg-purple-100 text-purple-800',
    'Education': 'bg-yellow-100 text-yellow-800',
    'Transportation': 'bg-orange-100 text-orange-800',
    'Food': 'bg-pink-100 text-pink-800',
    'Mental Health': 'bg-indigo-100 text-indigo-800',
    'Substance Abuse': 'bg-gray-100 text-gray-800'
  };

  return (
    <PublicMobileNav>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Community Resources</h1>
                <p className="text-gray-600">Find support services in your area</p>
              </div>
            </div>
            <div className="flex space-x-4">
              {/* Navigation simplified to focus only on resources */}
            </div>
          </div>
        </div>
      </div>

      {/* Life House Programs & Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Life House Programs & Services</h2>
          <p className="text-gray-600 mb-8">Comprehensive wraparound services designed for successful reentry</p>
          
          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <ProgramCard
              title="7-Stage Reentry Housing Program"
              description="Our comprehensive structured pathway guides residents from Intake through Legacy stages. Each stage includes specific milestones: sober housing, life-design coaching, job placement..."
              category="housing"
              categoryLabel="housing"
              tags={["housing", "reentry", "support-services", "+1 more"]}
              provider="Life House, CA"
              bgColor="bg-green-50"
              iconBg="bg-green-100"
              categoryBadge="bg-green-100 text-green-800"
            />
            
            <ProgramCard
              title="CureMyCredit700 Partnership"
              description="Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information on credit reports. 4.9/5 stars, 400+ reviews..."
              category="financial"
              categoryLabel="financial"
              tags={["credit-repair", "financial-health", "housing-ready", "+2 more"]}
              provider="CureMyCredit700"
              bgColor="bg-blue-50"
              iconBg="bg-blue-100"
              categoryBadge="bg-blue-100 text-blue-800"
            />
            
            <ProgramCard
              title="Financial Literacy Program"
              description="Global Investment Company partnership offering comprehensive financial education. $179.99/month program covering budgeting, investing, credit, insurance..."
              category="education"
              categoryLabel="education"
              tags={["financial-literacy", "budgeting", "investing", "+3 more"]}
              provider="Global Investment Co."
              bgColor="bg-purple-50"
              iconBg="bg-purple-100"
              categoryBadge="bg-purple-100 text-purple-800"
            />
            
            <ProgramCard
              title="Business Coaching Program"
              description="Building Your Dream Legacy by Kai Shariff - \"Serve your gifts, talents and magic to people who get you and build a legacy that serves you\""
              category="coaching"
              categoryLabel="coaching"
              tags={["entrepreneurship", "coaching"]}
              provider=""
              bgColor="bg-orange-50"
              iconBg="bg-orange-100"
              categoryBadge="bg-orange-100 text-orange-800"
            />
            
            <ProgramCard
              title="Brokerage & Savings Program"
              description="Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation..."
              category="savings"
              categoryLabel="savings"
              tags={["wealth-building", "client-ownership"]}
              provider=""
              bgColor="bg-green-50"
              iconBg="bg-green-100"
              categoryBadge="bg-green-100 text-green-800"
            />
            
            <ProgramCard
              title="Community Partnerships"
              description="Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contractors, CalAIM ECM providers..."
              category="partnerships"
              categoryLabel="partnerships"
              tags={["wraparound-services", "healing-centered"]}
              provider=""
              bgColor="bg-pink-50"
              iconBg="bg-pink-100"
              categoryBadge="bg-pink-100 text-pink-800"
            />
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Community Resources</h2>
          <p className="text-gray-600 mb-4">Additional resources and support services in our network</p>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for services, programs, or organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchResources()}
              />
            </div>
            <Button onClick={searchResources} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <Badge className={categoryColors[resource.category] || 'bg-gray-100 text-gray-800'}>
                    {resource.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                
                <div className="space-y-2 text-sm">
                  {resource.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{resource.address}</span>
                    </div>
                  )}
                  
                  {resource.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">
                        {resource.phone}
                      </a>
                    </div>
                  )}
                  
                  {resource.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a 
                        href={resource.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>

                {resource.eligibility && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Eligibility:</strong> {resource.eligibility}
                    </p>
                  </div>
                )}

                {resource.hours && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <strong>Hours:</strong> {resource.hours}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {resources.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Use the search above to find community resources and support services.
            </p>
          </div>
        )}
      </div>
      </div>
    </PublicMobileNav>
  );
}
