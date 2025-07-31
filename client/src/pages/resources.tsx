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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Info,
  TrendingUp,
  Target
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
  const [selectedLifeHouseProgram, setSelectedLifeHouseProgram] = useState<string | null>(null);

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
          {/* Life House Programs Section */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Life House Programs & Services</h2>
              <p className="text-gray-600 text-lg">Comprehensive life-design support system for formerly incarcerated individuals</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Housing Program Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-green-100 hover:border-green-300" onClick={() => setSelectedLifeHouseProgram('housing')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Transitional Housing</CardTitle>
                      <p className="text-sm text-gray-500">Safe, Structured Living</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Safe, sober transitional housing (90-730 days) with life-design coaching, case management, and pathway to permanent housing or homeownership.</p>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <span>7-Stage Transformation Model</span>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Repair Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-blue-100 hover:border-blue-300" onClick={() => setSelectedLifeHouseProgram('credit')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Credit Repair Service</CardTitle>
                      <p className="text-sm text-gray-500">CureMyCrédit700</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Professional credit repair services with proven strategies to challenge inaccurate items and improve credit scores for housing and financial stability.</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>4.9/5 Star Rating • 400+ Reviews</span>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Literacy Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-purple-100 hover:border-purple-300" onClick={() => setSelectedLifeHouseProgram('financial')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Financial Literacy</CardTitle>
                      <p className="text-sm text-gray-500">Global Pathway Program</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Comprehensive financial education covering budgeting, investing, retirement planning, and wealth building strategies with 40+ years of proven expertise.</p>
                  <div className="flex items-center text-purple-600 text-sm font-medium">
                    <span>$0 to Financial Freedom</span>
                  </div>
                </CardContent>
              </Card>

              {/* Business Coaching Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-orange-100 hover:border-orange-300" onClick={() => setSelectedLifeHouseProgram('business')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Business Coaching</CardTitle>
                      <p className="text-sm text-gray-500">Building Your Dream Legacy</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Entrepreneurship development, business planning, and legacy building coaching to help residents create sustainable income and generational wealth.</p>
                  <div className="flex items-center text-orange-600 text-sm font-medium">
                    <span>Personal & Business Credit Building</span>
                  </div>
                </CardContent>
              </Card>

              {/* Brokerage & Savings Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-300" onClick={() => setSelectedLifeHouseProgram('brokerage')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Brokerage & Savings</CardTitle>
                      <p className="text-sm text-gray-500">Forced Savings Program</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Mandatory savings program where 25% of housing contributions are invested in brokerage accounts, building wealth while residents stabilize their lives.</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <span>$1,500 Cap + 5% Investment Growth</span>
                  </div>
                </CardContent>
              </Card>

              {/* Community Partnerships Card */}
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-red-100 hover:border-red-300" onClick={() => setSelectedLifeHouseProgram('partnerships')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Community Partnerships</CardTitle>
                      <p className="text-sm text-gray-500">Healing & Support Network</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Strategic partnerships with parole/probation, STOP contractors, and Medi-Cal managed care plans for comprehensive wraparound services.</p>
                  <div className="flex items-center text-red-600 text-sm font-medium">
                    <span>Healing-Centered Engagement</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Flagship Programs Carousel */}
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Community Resources</h2>
              <p className="text-gray-600 mt-1">Additional resources and support services in our network</p>
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

      {/* Life House Program Detail Modal */}
      <Dialog open={!!selectedLifeHouseProgram} onOpenChange={() => setSelectedLifeHouseProgram(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLifeHouseProgram === 'housing' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <Home className="w-6 h-6 text-green-600 mr-3" />
                  Transitional Housing Program
                </DialogTitle>
                <DialogDescription className="text-base">
                  Safe, structured living with comprehensive life-design support for formerly incarcerated individuals
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Overview</h3>
                    <p className="text-gray-600">Life House provides safe, sober transitional housing for 90-730 days, paired with holistic life-design coaching, case management, benefits enrollment, and pathways to permanent housing or homeownership.</p>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Key Features</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Safe, structured, sober living environment</li>
                        <li>• Individual life-design coaching</li>
                        <li>• Case management and benefits navigation</li>
                        <li>• Document assistance (ID, SSN)</li>
                        <li>• Financial literacy and credit repair</li>
                        <li>• Job readiness and employer partnerships</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">7-Stage Transformation Model</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">1</div>
                        <div>
                          <p className="font-medium text-sm">Intake</p>
                          <p className="text-xs text-gray-600">Assessment, stabilization, documents, benefits, initial plan</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">2</div>
                        <div>
                          <p className="font-medium text-sm">Design</p>
                          <p className="text-xs text-gray-600">Individualized goals, services map, accountability schedule</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">3</div>
                        <div>
                          <p className="font-medium text-sm">Training</p>
                          <p className="text-xs text-gray-600">Life skills, CBT groups, education/certifications, financial literacy</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">4</div>
                        <div>
                          <p className="font-medium text-sm">Working</p>
                          <p className="text-xs text-gray-600">Job placement, income stabilization, 30% contribution (25% savings + 5% brokerage)</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">5</div>
                        <div>
                          <p className="font-medium text-sm">Overflow</p>
                          <p className="text-xs text-gray-600">Step-down independence, continued coaching, housing search</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">6</div>
                        <div>
                          <p className="font-medium text-sm">Transition</p>
                          <p className="text-xs text-gray-600">Permanent housing/homeownership secured, move-out readiness</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">7</div>
                        <div>
                          <p className="font-medium text-sm">Legacy</p>
                          <p className="text-xs text-gray-600">Alumni network, mentoring, aftercare check-ins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'credit' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                  Credit Repair Service Partnership
                </DialogTitle>
                <DialogDescription className="text-base">
                  Professional credit repair through CureMyCrédit700 - proven strategies for housing and financial stability
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Service Overview</h3>
                    <p className="text-gray-600">Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information on credit reports through proven strategies and personalized approaches.</p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Proven Results</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span>Customer Rating:</span>
                          <span className="font-medium">4.9/5 stars</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reviews:</span>
                          <span className="font-medium">400+ testimonials</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Typical Timeline:</span>
                          <span className="font-medium">3-6 months</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Core Services</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Credit Report Analysis</p>
                          <p className="text-xs text-gray-600">Expert identification of negative items affecting credit scores</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Bureau Disputes</p>
                          <p className="text-xs text-gray-600">Challenge questionable items with all three credit bureaus</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Financial Education</p>
                          <p className="text-xs text-gray-600">Understanding FICO factors: payment history, utilization, credit mix</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Personalized Strategy</p>
                          <p className="text-xs text-gray-600">Tailored approach based on individual financial situations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Recent Client Success Stories</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>"Got approved for a $4,000 card. Sonia answered all my questions and I followed her lead." - Corey S.</p>
                    <p>"Amazing experience with so much knowledge. My credit is excellent and I'm purchasing my new house." - Nina D.</p>
                    <p>"Highly recommend Sonia - she was patient and knowledgeable, setting realistic expectations." - Quispe-Nogales</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'financial' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <DollarSign className="w-6 h-6 text-purple-600 mr-3" />
                  Financial Literacy Program
                </DialogTitle>
                <DialogDescription className="text-base">
                  Global Pathway to Financial Freedom - comprehensive education from $0 to financial independence
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Overview</h3>
                    <p className="text-gray-600">Comprehensive financial education through Global Investment Company's "Global Pathway to Financial Freedom" - a proven system developed over 40+ years of experience with minority and woman-owned financial firm expertise.</p>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Program Structure</h4>
                      <div className="space-y-2 text-sm text-purple-700">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">6 months @ $179.99/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="font-medium">Self-paced + Live sessions</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experience:</span>
                          <span className="font-medium">40+ years proven expertise</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Curriculum Modules</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Setting Up Your Finances</p>
                          <p className="text-xs text-gray-600">Budget, cash flow management, and financial foundation</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Financial Planning</p>
                          <p className="text-xs text-gray-600">Discovery, planning overview, automation, next best dollar strategies</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Investment Management</p>
                          <p className="text-xs text-gray-600">Investment options, asset allocation, brokerage account setup</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Insurance & Risk Management</p>
                          <p className="text-xs text-gray-600">Types of insurance, determining best options</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Retirement Planning</p>
                          <p className="text-xs text-gray-600">Catching up strategies, plan options, setup guidance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'business' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <Target className="w-6 h-6 text-orange-600 mr-3" />
                  Business Coaching Program
                </DialogTitle>
                <DialogDescription className="text-base">
                  Building Your Dream Legacy - entrepreneurship development and generational wealth building
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Overview</h3>
                    <p className="text-gray-600">Comprehensive business coaching focused on entrepreneurship development, business planning, and legacy building to help residents create sustainable income streams and build generational wealth.</p>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Core Focus Areas</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Personal and business credit building</li>
                        <li>• Business plan development</li>
                        <li>• Revenue stream diversification</li>
                        <li>• Legacy planning and wealth transfer</li>
                        <li>• Market analysis and customer development</li>
                        <li>• Financial systems and cash flow management</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Coaching Components</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">One-on-One Coaching</p>
                          <p className="text-xs text-gray-600">Personalized business development sessions with experienced coaches</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Group Workshops</p>
                          <p className="text-xs text-gray-600">Peer learning environment with other aspiring entrepreneurs</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Business Credit Building</p>
                          <p className="text-xs text-gray-600">Establish business credit separate from personal credit history</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Legacy Planning</p>
                          <p className="text-xs text-gray-600">Building sustainable businesses that create generational wealth</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'brokerage' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <Shield className="w-6 h-6 text-emerald-600 mr-3" />
                  Brokerage & Savings Program
                </DialogTitle>
                <DialogDescription className="text-base">
                  Forced savings program building wealth while residents stabilize their lives
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Structure</h3>
                    <p className="text-gray-600">As part of the working stage in our 7-step transformation model, residents contribute 30% of their income to housing costs. Of this contribution, 25% is placed in a reimbursable savings account (capped at $1,500) and 5% is invested in a brokerage account for long-term wealth building.</p>
                    
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h4 className="font-medium text-emerald-800 mb-2">Financial Breakdown</h4>
                      <div className="space-y-2 text-sm text-emerald-700">
                        <div className="flex justify-between">
                          <span>Housing Contribution:</span>
                          <span className="font-medium">30% of income</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Savings (Reimbursable):</span>
                          <span className="font-medium">25% (max $1,500)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Investment Account:</span>
                          <span className="font-medium">5% (brokerage)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Benefits</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Automatic Wealth Building</p>
                          <p className="text-xs text-gray-600">Consistent investment while focusing on life stabilization</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Professional Management</p>
                          <p className="text-xs text-gray-600">Investments managed through Global Investment Company expertise</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Financial Education</p>
                          <p className="text-xs text-gray-600">Learn investing principles through hands-on experience</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Long-term Perspective</p>
                          <p className="text-xs text-gray-600">Building assets for future housing and life goals</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'partnerships' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <Users className="w-6 h-6 text-red-600 mr-3" />
                  Community Partnerships
                </DialogTitle>
                <DialogDescription className="text-base">
                  Strategic healing-centered engagement network for comprehensive wraparound services
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Partnership Network</h3>
                    <p className="text-gray-600">Life House maintains strategic partnerships with key organizations to provide comprehensive wraparound services, ensuring residents have access to all necessary support systems for successful reentry and long-term stability.</p>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Key Partners</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Parole and Probation Departments</li>
                        <li>• STOP Prime Contractors</li>
                        <li>• Medi-Cal Managed Care Plans</li>
                        <li>• CalAIM ECM Providers</li>
                        <li>• Community Support Organizations</li>
                        <li>• Licensed Clinical Providers</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Healing-Centered Approach</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Trauma-Informed Care</p>
                          <p className="text-xs text-gray-600">Understanding the impact of incarceration and providing healing-focused services</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Wraparound Services</p>
                          <p className="text-xs text-gray-600">Coordinated care addressing housing, healthcare, mental health, and social needs</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Community Integration</p>
                          <p className="text-xs text-gray-600">Building connections and support networks for long-term success</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Referral Pathways</p>
                          <p className="text-xs text-gray-600">Streamlined connections to essential services and ongoing support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
