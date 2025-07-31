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
import { CSVUpload } from "@/components/csv-upload";
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
  Target,
  Upload,
  Building,
  User
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
  const [showCSVUpload, setShowCSVUpload] = useState(false);


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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Life House Programs & Services</h2>
                <p className="text-gray-600">Comprehensive wraparound services designed for successful reentry</p>
              </div>
              {!isGuest && user && ['CaseManager', 'Admin'].includes((user as any).role) && (
                <Button 
                  onClick={() => setShowCSVUpload(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Community Resources
                </Button>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card 
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('housing')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">housing</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7-Stage Reentry Housing Program</h3>
                  <p className="text-sm text-gray-600 mb-4">Our comprehensive structured pathway guides residents from Intake through Legacy stages. Each stage includes specific milestones: sober housing, life-design coaching, job placement...</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">housing</Badge>
                    <Badge variant="outline" className="text-xs">reentry</Badge>
                    <Badge variant="outline" className="text-xs">support-services</Badge>
                    <Badge variant="outline" className="text-xs">+1 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    Life House, CA
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('credit')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">financial</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">CureMyCrédit700 Partnership</h3>
                  <p className="text-sm text-gray-600 mb-4">Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information. 4.9/5 stars, 400+ reviews...</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">credit-repair</Badge>
                    <Badge variant="outline" className="text-xs">financial-health</Badge>
                    <Badge variant="outline" className="text-xs">housing-ready</Badge>
                    <Badge variant="outline" className="text-xs">+2 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Partner Service
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('financial')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">education</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Literacy Program</h3>
                  <p className="text-sm text-gray-600 mb-4">Global Investment Company partnership offering comprehensive financial education. $179.99/month program covering budgeting, investing, credit, insurance...</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">financial-literacy</Badge>
                    <Badge variant="outline" className="text-xs">budgeting</Badge>
                    <Badge variant="outline" className="text-xs">investing</Badge>
                    <Badge variant="outline" className="text-xs">+3 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Building className="w-3 h-3 mr-1" />
                    Global Investment Co.
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('business')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                      <Target className="w-6 h-6 text-orange-600" />
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">coaching</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Coaching Program</h3>
                  <p className="text-sm text-gray-600 mb-4">Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and build a legacy that serves you"</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">entrepreneurship</Badge>
                    <Badge variant="outline" className="text-xs">coaching</Badge>
                    <Badge variant="outline" className="text-xs">legacy-building</Badge>
                    <Badge variant="outline" className="text-xs">+2 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="w-3 h-3 mr-1" />
                    Kai Shariff Method
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('brokerage')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">savings</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Brokerage & Savings Program</h3>
                  <p className="text-sm text-gray-600 mb-4">Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation...</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">wealth-building</Badge>
                    <Badge variant="outline" className="text-xs">client-ownership</Badge>
                    <Badge variant="outline" className="text-xs">trust-model</Badge>
                    <Badge variant="outline" className="text-xs">+2 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Global Investment Co.
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedLifeHouseProgram('partnerships')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <Badge className="bg-red-100 text-red-700 border-red-200">partnerships</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Partnerships</h3>
                  <p className="text-sm text-gray-600 mb-4">Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contractors, CalAIM ECM providers...</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">wraparound-services</Badge>
                    <Badge variant="outline" className="text-xs">healing-centered</Badge>
                    <Badge variant="outline" className="text-xs">community</Badge>
                    <Badge variant="outline" className="text-xs">+3 more</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    California Network
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Community Resources Section */}
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

      {/* CSV Upload Modal */}
      <Dialog open={showCSVUpload} onOpenChange={setShowCSVUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-primary" />
              Upload Community Resources
            </DialogTitle>
            <DialogDescription>
              Upload CSV files containing community resources. Files will be processed using AI to clean and categorize the data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CSVUpload />
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Detail Modal */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-2xl">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {React.createElement(getCategoryIcon(selectedResource.category), { className: "w-5 h-5 mr-2 text-primary" })}
                  {selectedResource.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedResource.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Category</h4>
                    <Badge className={getCategoryColor(selectedResource.category)}>
                      {selectedResource.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {(selectedResource as any).geo?.city}, {(selectedResource as any).geo?.state}
                    </p>
                  </div>
                </div>
                
                {selectedResource.eligibility && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Eligibility</h4>
                    <p className="text-sm text-muted-foreground">{selectedResource.eligibility}</p>
                  </div>
                )}
                
                {(selectedResource as any).contact && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      {(selectedResource as any).contact.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {(selectedResource as any).contact.phone}
                        </div>
                      )}
                      {(selectedResource as any).contact.email && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2">@</span>
                          {(selectedResource as any).contact.email}
                        </div>
                      )}
                      {(selectedResource as any).contact.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          {(selectedResource as any).contact.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(selectedResource as any).languages?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedResource as any).languages.map((lang: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(selectedResource as any).tags?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedResource as any).tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Life House Program Detail Modals */}
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
                          <p className="font-medium text-sm">Dispute Processing</p>
                          <p className="text-xs text-gray-600">Strategic challenges to inaccurate information with credit bureaus</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Credit Building Guidance</p>
                          <p className="text-xs text-gray-600">Personalized strategies for improving credit health long-term</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedLifeHouseProgram === 'financial' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <GraduationCap className="w-6 h-6 text-purple-600 mr-3" />
                  Financial Literacy Program
                </DialogTitle>
                <DialogDescription className="text-base">
                  Global Investment Company partnership - comprehensive financial education for lifelong stability
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Structure</h3>
                    <p className="text-gray-600">Comprehensive financial literacy education through Global Investment Company's proven curriculum, covering essential money management skills for successful reentry and long-term stability.</p>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Program Details</h4>
                      <div className="space-y-2 text-sm text-purple-700">
                        <div className="flex justify-between">
                          <span>Monthly Cost:</span>
                          <span className="font-medium">$179.99</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Provider:</span>
                          <span className="font-medium">Global Investment Co.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experience:</span>
                          <span className="font-medium">40+ years</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Curriculum Areas</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Budgeting & Money Management</p>
                          <p className="text-xs text-gray-600">Creating and maintaining personal budgets, expense tracking</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Debt Management</p>
                          <p className="text-xs text-gray-600">Strategies for paying down debt and avoiding financial traps</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Investment Basics</p>
                          <p className="text-xs text-gray-600">Introduction to investing, risk management, portfolio building</p>
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
                  Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and build a legacy that serves you"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Legacy Business Method</h3>
                    <p className="text-gray-600">This isn't just business coaching—it's building an intentional, soul-aligned ecosystem that supports you financially, spiritually, and creatively. The "Earn While You Learn" framework helps residents generate real revenue while building their brand.</p>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Core Philosophy</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• You can earn while you learn - no need to wait for perfection</li>
                        <li>• Build a body of work, not just a business</li>
                        <li>• Soul-aligned ecosystem supporting you holistically</li>
                        <li>• Focus on transformation, not just transactions</li>
                        <li>• Create systems that honor your natural rhythms</li>
                        <li>• Build sustainable revenue without burnout</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Business Development Stages</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">1</div>
                        <div>
                          <p className="font-medium text-sm">Clarity & Messaging</p>
                          <p className="text-xs text-gray-600">Define who you serve and speak their language, not expert-speak</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">2</div>
                        <div>
                          <p className="font-medium text-sm">Offer Testing & Validation</p>
                          <p className="text-xs text-gray-600">Test ideas with real humans before building the full program</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">3</div>
                        <div>
                          <p className="font-medium text-sm">Revenue Ecosystem</p>
                          <p className="text-xs text-gray-600">Build signature offers and pricing strategies that reflect your value</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">4</div>
                        <div>
                          <p className="font-medium text-sm">Systems & Structure</p>
                          <p className="text-xs text-gray-600">Create repeatable workflows and delegate effectively</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">5</div>
                        <div>
                          <p className="font-medium text-sm">Legacy & Leadership</p>
                          <p className="text-xs text-gray-600">Scale without burnout and design your exit strategy</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Business Alignment Diagnostic Areas</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-orange-600">💰 Money + Offers</p>
                      <p>Revenue ecosystem, signature offers, confident pricing</p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">📣 Visibility + Marketing</p>
                      <p>Messaging alignment, content strategy, sales conversations</p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">⚙️ Structure + Systems</p>
                      <p>Team roles, operations workflow, data tracking</p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">🏛️ Legacy + Leadership</p>
                      <p>Scaling strategies, sabbatical planning, method licensing</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">This Isn't Hustle Culture—It's Holistic Culture</h4>
                  <p className="text-sm text-orange-700">"You are not a machine. You are not an algorithm. You are a unique and worthy soul who gets to choose their own rhythm. Your business must honor that whole person—not just your tasks."</p>
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
                  Professional wealth-building services with transparent trust account model and client beneficial ownership
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Trust Account Model</h3>
                    <p className="text-gray-600">Building on Global Investment Company's experience with institutional trustee services, this program provides professional investment management while clients retain beneficial ownership of all funds with structured access during program participation.</p>
                    
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h4 className="font-medium text-emerald-800 mb-2">Account Setup Features</h4>
                      <div className="space-y-2 text-sm text-emerald-700">
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2"></div>
                          <span>Standard brokerage terms for all clients</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2"></div>
                          <span>Full disclosure during normal application process</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2"></div>
                          <span>Multiple partner options: Credit unions, Fidelity, discount brokers</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-600 mt-2"></div>
                          <span>Leverages NorCal FDC relationship and city partnerships</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Program Support Services</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Financial Literacy Education</p>
                          <p className="text-xs text-gray-600">Required before account opening to ensure informed decisions</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Monthly Financial Coaching</p>
                          <p className="text-xs text-gray-600">Ongoing support sessions while participating in program</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Graduated Investment Access</p>
                          <p className="text-xs text-gray-600">Investment options expand based on demonstrated financial knowledge</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Emergency Hardship Provisions</p>
                          <p className="text-xs text-gray-600">Partial/full withdrawal options for qualifying circumstances</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Ethical Safeguards & Client Protections</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-emerald-600 mb-1">✓ Client Beneficial Ownership</p>
                      <p>Clients retain beneficial ownership of all funds at all times</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600 mb-1">✓ Transparent Fee Structure</p>
                      <p>Trustee fees separate from brokerage fees, fully disclosed</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600 mb-1">✓ Clear Graduation Provisions</p>
                      <p>Well-defined timeline to full account control upon program completion</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600 mb-1">✓ Institutional Trust Experience</p>
                      <p>GIC acts as institutional trustee/fiduciary with proven track record</p>
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
                          <p className="text-xs text-gray-600">Recognition and response to trauma impacts throughout services</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Cultural Responsiveness</p>
                          <p className="text-xs text-gray-600">Services aligned with community values and cultural practices</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Strength-Based Support</p>
                          <p className="text-xs text-gray-600">Focus on individual assets and community resilience building</p>
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
