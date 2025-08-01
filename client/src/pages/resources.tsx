import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from '@/lib/rbac';
import { Search, Heart, TrendingUp, Home, DollarSign, GraduationCap, Users, PiggyBank, Handshake } from 'lucide-react';

interface Resource {
  id: string;
  category: string;
  name: string;
  description: string;
  status: string;
}

// Category cards data
const categoryCards = [
  {
    id: 'housing',
    title: '7-Stage Reentry Housing Program',
    description: 'Our comprehensive structured pathway guides residents from intake through Legacy stages. Each stage includes specific milestones, sober housing, life-design coaching, job placement...',
    icon: Home,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    tags: ['housing', 'reentry', 'support-services', '+1 more'],
    provider: 'Life House, CA'
  },
  {
    id: 'financial',
    title: 'CureMyCrédit700 Partnership',
    description: 'Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information. 4.9/5 stars, 400+ reviews...',
    icon: TrendingUp,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    tags: ['credit-repair', 'financial-health', 'housing-ready', '+2 more'],
    provider: 'Partner Service'
  },
  {
    id: 'education',
    title: 'Financial Literacy Program',
    description: 'Global Investment Company partnership offering comprehensive financial education. $179.99/month program covering budgeting, investing, credit, insurance...',
    icon: GraduationCap,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    tags: ['financial-literacy', 'budgeting', 'investing', '+3 more'],
    provider: 'Global Investment Co.'
  },
  {
    id: 'coaching',
    title: 'Business Coaching Program',
    description: 'Building Your Dream Legacy by Kai Shariff - "Serve your gifts, talents and magic to people who get you and help build a legacy that serves our...',
    icon: Users,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    tags: ['entrepreneurship', 'coaching', 'legacy-building', '+2 more'],
    provider: 'Kai Shariff Method'
  },
  {
    id: 'savings',
    title: 'Brokerage & Savings Program',
    description: 'Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation...',
    icon: PiggyBank,
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    tags: ['wealth-building', 'client-ownership', 'trust-model', '+2 more'],
    provider: 'Global Investment Co.'
  },
  {
    id: 'partnerships',
    title: 'Community Partnerships',
    description: 'Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contracts, CalAIM ECM providers...',
    icon: Handshake,
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    tags: ['wraparound-services', 'healing-centered', 'community', '+3 more'],
    provider: 'California Network'
  }
];

// Mock data for now
const mockResources: Resource[] = [
  {
    id: '1',
    category: 'housing',
    name: 'Bay Area Housing Coalition',
    description: 'Provides rental assistance and housing navigation services for individuals transitioning from homelessness.',
    status: 'active'
  },
  {
    id: '2',
    category: 'employment',
    name: 'Second Chance Employment Services',
    description: 'Job placement and training program specifically for formerly incarcerated individuals.',
    status: 'active'
  }
];

function Resources() {
  const { data: user } = useCurrentUser();
  const isGuest = !user;
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch resources from API (supports both guest and authenticated access)
  const { data: resources = mockResources } = useQuery({
    queryKey: ['/api/resources'],
  });

  const filteredResources = (resources as Resource[]).filter((resource: Resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && resource.status === 'active';
  });

  if (isGuest) {
    return (
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Community Resources</h1>
                  <p className="text-sm text-gray-600">Find support services in your area</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Category Cards */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryCards.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card key={category.id} className="cursor-pointer transition-all hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${category.bgColor}`}>
                            <IconComponent className={`w-5 h-5 ${category.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {category.id}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {category.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {category.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <span>📍 {category.provider}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              {filteredResources.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No resources found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Try adjusting your search criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredResources.map((resource: Resource) => (
                  <Card key={resource.id} className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.name}</h3>
                          <Badge className="mt-1">{resource.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MobileSidebar>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
                  <p className="text-sm text-gray-600">Find and manage community resources</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {(resources as Resource[]).length} Available
                  </Badge>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Category Cards */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryCards.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card key={category.id} className="cursor-pointer transition-all hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${category.bgColor}`}>
                            <IconComponent className={`w-5 h-5 ${category.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {category.id}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {category.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {category.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <span>📍 {category.provider}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              {filteredResources.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No resources found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Try adjusting your search criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredResources.map((resource: Resource) => (
                  <Card key={resource.id} className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.name}</h3>
                          <Badge className="mt-1">{resource.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </MobileSidebar>
  );
}

export default Resources;