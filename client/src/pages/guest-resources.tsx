import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Phone, Globe, X, Home, DollarSign, GraduationCap, Users, Heart, Briefcase, Star, TrendingUp, ExternalLink } from "lucide-react";
import { Logo } from "@/components/logo";

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  tags: string[];
}

export default function GuestResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Life House flagship programs from the screenshots
  const lifeHousePrograms: Resource[] = [
    {
      id: "housing-program",
      name: "Life House 7-Stage Housing Program",
      description: "Comprehensive transitional housing program supporting individuals in their reentry journey with structured stages from emergency shelter to independent living.",
      category: "housing",
      location: "Oakland, CA",
      phone: "(510) 555-0123",
      email: "housing@lifehousereentry.com",
      tags: ["transitional housing", "case management", "reentry support"]
    },
    {
      id: "business-coaching",
      name: "Building Your Dream Legacy - Business Coaching",
      description: "Entrepreneurship and business development program helping formerly incarcerated individuals start and grow sustainable businesses.",
      category: "employment",
      location: "Oakland, CA", 
      phone: "(510) 555-0124",
      email: "business@lifehousereentry.com",
      tags: ["entrepreneurship", "business coaching", "financial literacy"]
    },
    {
      id: "financial-literacy",
      name: "Financial Literacy Program",
      description: "Global Investment Company partnership offering comprehensive financial education. $179.99/month program covering budgeting, investing, credit, insurance...",
      category: "financial",
      location: "Oakland, CA",
      phone: "(510) 555-0125", 
      email: "financial@lifehousereentry.com",
      tags: ["financial-literacy", "budgeting", "investing"]
    },
    {
      id: "coaching-program",
      name: "Business Coaching Program",
      description: "Building Your Dream Legacy by Kai Shariff - 'Serve your gifts, talents and magic to people who get you and build a legacy that serves you!'",
      category: "coaching",
      location: "Oakland, CA",
      phone: "(510) 555-0126",
      email: "coaching@lifehousereentry.com", 
      tags: ["entrepreneurship", "coaching", "legacy-building"]
    },
    {
      id: "savings-program",
      name: "Brokerage & Savings Program",
      description: "Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation...",
      category: "savings",
      location: "Oakland, CA",
      phone: "(510) 555-0127",
      email: "savings@lifehousereentry.com",
      tags: ["wealth-building", "client-ownership", "trust-model"]
    },
    {
      id: "partnerships",
      name: "Community Partnerships",
      description: "Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contractors, CalAIM ECM Providers...",
      category: "partnerships",
      location: "California Network",
      phone: "(510) 555-0128",
      email: "partnerships@lifehousereentry.com",
      tags: ["wraparound-services", "healing-centered", "community"]
    }
  ];

  const openResourceModal = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const closeResourceModal = () => {
    setSelectedResource(null);
    setIsModalOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'housing': Home,
      'financial': DollarSign,
      'employment': Briefcase,
      'coaching': Users,
      'savings': TrendingUp,
      'partnerships': Heart,
      'default': Heart
    };
    const IconComponent = icons[category.toLowerCase()] || icons.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'housing': 'from-green-500 to-green-600',
      'financial': 'from-blue-500 to-blue-600', 
      'employment': 'from-orange-500 to-orange-600',
      'coaching': 'from-red-500 to-red-600',
      'savings': 'from-green-500 to-green-600',
      'partnerships': 'from-red-500 to-red-600',
      'default': 'from-gray-500 to-gray-600'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'housing': 'bg-green-100 text-green-800',
      'financial': 'bg-blue-100 text-blue-800',
      'employment': 'bg-orange-100 text-orange-800', 
      'coaching': 'bg-red-100 text-red-800',
      'savings': 'bg-green-100 text-green-800',
      'partnerships': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  return (
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
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Life House Programs & Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Life House Programs & Services</h2>
          <p className="text-gray-600">Comprehensive wraparound services designed for successful reentry</p>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lifeHousePrograms.map((program) => (
            <Card 
              key={program.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border bg-white"
              onClick={() => openResourceModal(program)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                    {program.name}
                  </CardTitle>
                  <Badge className={getCategoryBadgeColor(program.category)}>
                    {program.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {program.description}
                </p>
                
                <div className="space-y-2 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{program.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{program.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{program.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {program.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    openResourceModal(program);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Beautiful Resource Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedResource && (
            <div className="relative">
              {/* Header with Category Color */}
              <div className={`bg-gradient-to-r ${getCategoryColor(selectedResource.category)} text-white p-6 rounded-t-lg`}>
                <button 
                  onClick={closeResourceModal}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {getCategoryIcon(selectedResource.category)}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white mb-2">
                      {selectedResource.name}
                    </DialogTitle>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {selectedResource.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Service Overview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Service Overview
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {selectedResource.description}
                    </p>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Professional credit repair through CureMyCredit700</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information on credit reports through proven strategies and personalized approaches.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Core Services & Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Core Services
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Credit Report Analysis</h4>
                          <p className="text-sm text-gray-600">Comprehensive review of all negative items affecting credit scores</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Dispute Processing</h4>
                          <p className="text-sm text-gray-600">Strategic challenges to inaccurate information with credit bureaus</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Credit Building Guidance</h4>
                          <p className="text-sm text-gray-600">Personalized strategies for improving credit health long-term</p>
                        </div>
                      </div>
                    </div>

                    {/* Proven Results Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Proven Results
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">4.9/5</div>
                          <div className="text-xs text-gray-600">Customer Rating</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">400+</div>
                          <div className="text-xs text-gray-600">testimonials</div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <div className="text-lg font-semibold text-purple-600">3-6 months</div>
                        <div className="text-xs text-gray-600">Typical Timeline</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Related Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  <Button 
                    className={`flex-1 bg-gradient-to-r ${getCategoryColor(selectedResource.category)} text-white hover:opacity-90`}
                    onClick={() => window.open(`tel:${selectedResource.phone}`, '_self')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`mailto:${selectedResource.email}`, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Email Contact
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}