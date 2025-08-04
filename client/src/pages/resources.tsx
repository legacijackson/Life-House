import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from '@/lib/rbac';
import { Search, Heart, TrendingUp, Users, ChartBar, Settings, FileBox } from 'lucide-react';
import { HighlightCarousel } from '@/components/highlight-carousel';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  category: string;
  name: string;
  description: string;
  status: string;
}

// Simplified sidebar for resources page
function SimplifiedSidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
            T
          </div>
          <div>
            <div className="font-medium text-gray-900">Test Admin</div>
            <div className="text-sm text-gray-500">Guest</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {/* Resources - Current Page */}
        <Link href="/resources" className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          "bg-gray-100 text-gray-900"
        )}>
          <FileBox className="h-5 w-5" />
          <span className="font-medium">Resources</span>
        </Link>

        {/* Portal Features Section */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Portal Features
          </h3>
          
          <div className="space-y-1">
            <Link href="/portal" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Resident Portal</span>
              </div>
              <Badge className="bg-green-50 text-green-700 text-xs">New</Badge>
            </Link>

            <Link href="/dashboard" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <ChartBar className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Staff Dashboard</span>
              </div>
              <Badge className="bg-green-50 text-green-700 text-xs">New</Badge>
            </Link>

            <Link href="/admin" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Admin Panel</span>
              </div>
              <Badge className="bg-green-50 text-green-700 text-xs">New</Badge>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}

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
            {/* Flagship Resources */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Programs</h2>
              <HighlightCarousel />
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
        <SimplifiedSidebar />
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
            {/* Flagship Resources */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Programs</h2>
              <HighlightCarousel />
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