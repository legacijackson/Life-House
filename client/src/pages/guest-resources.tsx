
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ExternalLink, Phone, Globe, MapPin, X, Home, DollarSign, GraduationCap, Users, Heart, Briefcase, Star, TrendingUp } from "lucide-react";
import { Logo } from "@/components/logo";
import { PublicMobileNav } from "@/components/public-mobile-nav";
import { HighlightCarousel } from "@/components/highlight-carousel";

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
  tags?: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
  benefitAmount?: string;
  status?: string;
}

export default function GuestResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      'education': GraduationCap,
      'employment': Briefcase,
      'healthcare': Heart,
      'community': Users,
      'default': Heart
    };
    const IconComponent = icons[category.toLowerCase()] || icons.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'housing': 'from-green-500 to-green-600',
      'financial': 'from-blue-500 to-blue-600', 
      'education': 'from-purple-500 to-purple-600',
      'employment': 'from-orange-500 to-orange-600',
      'healthcare': 'from-red-500 to-red-600',
      'community': 'from-pink-500 to-pink-600',
      'default': 'from-gray-500 to-gray-600'
    };
    return colors[category.toLowerCase()] || colors.default;
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
          
          <HighlightCarousel />
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
            <Card 
              key={resource.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 border-0 shadow-md"
              onClick={() => openResourceModal(resource)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getCategoryColor(resource.category)} flex items-center justify-center text-white shadow-lg`}>
                    {getCategoryIcon(resource.category)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{resource.name}</CardTitle>
                    <Badge className={`mt-1 ${categoryColors[resource.category] || 'bg-gray-100 text-gray-800'}`}>
                      {resource.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 line-clamp-3">{resource.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {resource.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                    )}
                    {resource.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>Contact</span>
                      </div>
                    )}
                  </div>
                </div>

                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        +{resource.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    openResourceModal(resource);
                  }}
                >
                  View Details
                </Button>
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

                    {selectedResource.eligibility && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">Eligibility Requirements</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{selectedResource.eligibility}</p>
                        </div>
                      </div>
                    )}

                    {selectedResource.hours && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
                        <p className="text-gray-600">{selectedResource.hours}</p>
                      </div>
                    )}
                  </div>

                  {/* Core Services & Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Core Services
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      {selectedResource.address && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Location</h4>
                            <p className="text-sm text-gray-600">{selectedResource.address}</p>
                          </div>
                        </div>
                      )}

                      {selectedResource.phone && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Phone</h4>
                            <a href={`tel:${selectedResource.phone}`} className="text-sm text-blue-600 hover:underline">
                              {selectedResource.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedResource.website && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Website</h4>
                            <a 
                              href={selectedResource.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Visit Website
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
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
                          <div className="text-xs text-gray-600">Testimonials</div>
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
                {selectedResource.tags && selectedResource.tags.length > 0 && (
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
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  {selectedResource.phone && (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${getCategoryColor(selectedResource.category)} text-white hover:opacity-90`}
                      onClick={() => window.open(`tel:${selectedResource.phone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  )}
                  {selectedResource.website && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(selectedResource.website, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicMobileNav>
  );
}
