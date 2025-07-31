import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceAddModal } from "@/components/resource-add-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser } from '@/lib/rbac';
import { Logo } from "@/components/logo";
import HighlightCarousel from "@/components/highlight-carousel";
import CsvUpload from "@/components/csv-upload";
import { 
  Search,
  Filter,
  Plus,
  MapPin,
  Phone,
  ExternalLink,
  DollarSign,
  Users,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Car,
  Stethoscope,
  Shield,
  Baby,
  Scale,
  Info
} from 'lucide-react';

interface Resource {
  id: string;
  category: 'housing' | 'food' | 'id_docs' | 'healthcare' | 'sud_mh_referral' | 'employment' | 'training' | 'legal' | 'transport' | 'family' | 'money' | 'emergency' | 'education';
  name: string;
  description: string;
  eligibility: string;
  benefitAmount?: number;
  geo: {
    zip: string;
    city: string;
    county: string;
    state: string;
  };
  url?: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  languages: string[];
  status: 'active' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const mockResources: Resource[] = [
  {
    id: '1',
    category: 'housing',
    name: 'Bay Area Housing Coalition',
    description: 'Provides rental assistance and housing navigation services for individuals transitioning from homelessness.',
    eligibility: 'Must be chronically homeless or at risk. Income below 50% AMI.',
    benefitAmount: 2500,
    geo: { zip: '94607', city: 'Oakland', county: 'Alameda', state: 'CA' },
    url: 'https://bayareahousing.org',
    contact: { phone: '(510) 555-0123', email: 'intake@bayareahousing.org', address: '123 Housing St, Oakland CA' },
    languages: ['en', 'es'],
    status: 'active',
    tags: ['rental assistance', 'permanent housing', 'navigation'],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    category: 'employment',
    name: 'Second Chance Employment Services',
    description: 'Job placement and training program specifically for formerly incarcerated individuals.',
    eligibility: 'Recent release from incarceration (within 2 years). Must complete orientation.',
    geo: { zip: '94110', city: 'San Francisco', county: 'San Francisco', state: 'CA' },
    contact: { phone: '(415) 555-0124', email: 'jobs@secondchance.org' },
    languages: ['en', 'es', 'zh'],
    status: 'active',
    tags: ['job placement', 'formerly incarcerated', 'training'],
    createdAt: '2023-02-10',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    category: 'healthcare',
    name: 'Community Health Center Network',
    description: 'Comprehensive healthcare services including primary care, mental health, and substance abuse treatment.',
    eligibility: 'Open to all. Sliding scale fees based on income.',
    geo: { zip: '94607', city: 'Oakland', county: 'Alameda', state: 'CA' },
    url: 'https://chcnetwork.org',
    contact: { phone: '(510) 555-0125', address: '456 Health Ave, Oakland CA' },
    languages: ['en', 'es', 'vi'],
    status: 'active',
    tags: ['primary care', 'mental health', 'substance abuse', 'sliding scale'],
    createdAt: '2023-03-05',
    updatedAt: '2024-01-15'
  },
  {
    id: '4',
    category: 'food',
    name: 'East Bay Food Bank',
    description: 'Weekly food distribution and emergency food assistance.',
    eligibility: 'Income at or below 200% federal poverty level.',
    benefitAmount: 150,
    geo: { zip: '94601', city: 'Oakland', county: 'Alameda', state: 'CA' },
    contact: { phone: '(510) 555-0126', address: '789 Food Blvd, Oakland CA' },
    languages: ['en', 'es'],
    status: 'active',
    tags: ['food pantry', 'weekly distribution', 'emergency assistance'],
    createdAt: '2023-01-20',
    updatedAt: '2024-01-22'
  },
  {
    id: '5',
    category: 'legal',
    name: 'Legal Aid Society of Alameda County',
    description: 'Free legal services for low-income individuals including expungement, family law, and housing issues.',
    eligibility: 'Income below 125% federal poverty level.',
    geo: { zip: '94612', city: 'Oakland', county: 'Alameda', state: 'CA' },
    url: 'https://legalaid-alameda.org',
    contact: { phone: '(510) 555-0127', email: 'help@legalaid-alameda.org' },
    languages: ['en', 'es'],
    status: 'active',
    tags: ['expungement', 'family law', 'housing law', 'free'],
    createdAt: '2023-04-12',
    updatedAt: '2024-01-10'
  }
];

export default function Resources() {
  const { data: user } = useCurrentUser();
  const isGuest = !user;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Fetch resources from API (supports both guest and authenticated access)
  const { data: resources = mockResources } = useQuery({
    queryKey: ['/api/resources'],
  });

  const filteredResources = (resources as Resource[]).filter((resource: Resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    return matchesSearch && matchesCategory && resource.status === 'active';
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, typeof Home> = {
      housing: Home,
      employment: Briefcase,
      healthcare: Stethoscope,
      food: Heart,
      legal: Scale,
      education: GraduationCap,
      transport: Car,
      family: Baby,
      money: DollarSign,
      emergency: Shield,
      training: Users,
      id_docs: Shield,
      sud_mh_referral: Stethoscope
    };
    return icons[category] || Heart;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      housing: 'bg-blue-100 text-blue-800',
      employment: 'bg-green-100 text-green-800',
      healthcare: 'bg-red-100 text-red-800',
      food: 'bg-orange-100 text-orange-800',
      legal: 'bg-purple-100 text-purple-800',
      education: 'bg-indigo-100 text-indigo-800',
      transport: 'bg-yellow-100 text-yellow-800',
      family: 'bg-pink-100 text-pink-800',
      money: 'bg-emerald-100 text-emerald-800',
      emergency: 'bg-gray-100 text-gray-800',
      training: 'bg-cyan-100 text-cyan-800',
      id_docs: 'bg-slate-100 text-slate-800',
      sud_mh_referral: 'bg-rose-100 text-rose-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'housing', label: 'Housing' },
    { value: 'employment', label: 'Employment' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'food', label: 'Food' },
    { value: 'legal', label: 'Legal' },
    { value: 'education', label: 'Education' },
    { value: 'training', label: 'Training' },
    { value: 'transport', label: 'Transportation' },
    { value: 'family', label: 'Family Services' },
    { value: 'money', label: 'Financial' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'id_docs', label: 'ID/Documents' },
    { value: 'sud_mh_referral', label: 'Mental Health/SUD' }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {!isGuest && <Sidebar />}
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isGuest && <Logo className="h-10" />}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Community Resources</h1>
                  <p className="text-sm text-gray-600">
                    {isGuest 
                      ? "Discover housing, employment, healthcare, and other support services" 
                      : "Find and manage community resources for Life House residents"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isGuest && (
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Back to Home
                  </Button>
                )}
                {!isGuest && (
                  <div className="flex items-center space-x-2">
                    <CsvUpload />
                    <ResourceAddModal />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Flagship Programs Carousel */}
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Our Flagship Programs</h2>
              <p className="text-gray-600 mt-1">Transformative Life House programs designed for lasting change</p>
            </div>
            <HighlightCarousel onResourceClick={(resource) => setSelectedResource(resource as Resource)} />
          </section>

          {/* Guest Banner */}
          {isGuest && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You're browsing as a guest. <button 
                  onClick={() => window.location.href = '/'}
                  className="font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  Login to save resources
                </button> and access additional features.
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resources by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Resources List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Resources ({filteredResources.length})
              </h2>
              
              {filteredResources.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No resources found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {searchTerm || categoryFilter !== 'all' 
                        ? "Try adjusting your search criteria or filters" 
                        : "No resources have been added to the system yet. Click 'Add Resource' to get started."}
                    </p>
                  </CardContent>
                </Card>
              ) : filteredResources.map((resource: Resource) => {
                const IconComponent = getCategoryIcon(resource.category);
                return (
                  <Card 
                    key={resource.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedResource?.id === resource.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedResource(resource)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(resource.category)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{resource.name}</h3>
                            <p className="text-sm text-gray-500">{resource.geo.city}, {resource.geo.state}</p>
                          </div>
                        </div>
                        <Badge className={getCategoryColor(resource.category)}>
                          {resource.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {resource.description}
                      </p>

                      <div className="flex items-center justify-between">
                        {resource.benefitAmount && (
                          <div className="flex items-center text-green-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">${resource.benefitAmount}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {resource.url && (
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          )}
                          {resource.contact.phone && (
                            <Phone className="w-4 h-4 text-gray-400" />
                          )}
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Resource Details */}
            <div>
              {selectedResource ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(selectedResource.category)}`}>
                          {React.createElement(getCategoryIcon(selectedResource.category), { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{selectedResource.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {selectedResource.geo.city}, {selectedResource.geo.county} County, {selectedResource.geo.state}
                          </p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(selectedResource.category)}>
                        {selectedResource.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedResource.description}</p>
                        </div>

                        {selectedResource.benefitAmount && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Benefit Amount</h4>
                            <div className="flex items-center text-green-600">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span className="font-medium">${selectedResource.benefitAmount}</span>
                              <span className="text-sm text-gray-500 ml-2">estimated value</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedResource.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Languages Supported</h4>
                          <div className="flex space-x-2">
                            {selectedResource.languages.map((lang: string) => (
                              <Badge key={lang} variant="secondary" className="text-xs">
                                {lang.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="contact" className="space-y-4">
                        {selectedResource.contact.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedResource.contact.phone}</p>
                              <p className="text-xs text-gray-500">Phone</p>
                            </div>
                          </div>
                        )}

                        {selectedResource.contact.email && (
                          <div className="flex items-center space-x-3">
                            <span className="w-4 h-4 text-gray-400">@</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedResource.contact.email}</p>
                              <p className="text-xs text-gray-500">Email</p>
                            </div>
                          </div>
                        )}

                        {selectedResource.contact.address && (
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedResource.contact.address}</p>
                              <p className="text-xs text-gray-500">Address</p>
                            </div>
                          </div>
                        )}

                        {selectedResource.url && (
                          <div className="flex items-center space-x-3">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <div>
                              <a 
                                href={selectedResource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                              >
                                {selectedResource.url}
                              </a>
                              <p className="text-xs text-gray-500">Website</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="eligibility" className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Eligibility Requirements</h4>
                          <p className="text-sm text-gray-600">{selectedResource.eligibility}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Service Area</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">ZIP Code:</span>
                              <span className="font-medium">{selectedResource.geo.zip}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">City:</span>
                              <span className="font-medium">{selectedResource.geo.city}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">County:</span>
                              <span className="font-medium">{selectedResource.geo.county}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">State:</span>
                              <span className="font-medium">{selectedResource.geo.state}</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex space-x-3">
                      <Button size="sm" className="flex-1">
                        <Users className="w-4 h-4 mr-2" />
                        Refer Resident
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Heart className="w-4 h-4 mr-2" />
                        Save Resource
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Resource</h3>
                    <p className="text-gray-500">Choose a resource from the list to view details, contact information, and eligibility requirements.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
