
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Phone, Globe, MapPin } from "lucide-react";
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

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Resources</h2>
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
