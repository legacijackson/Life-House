import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, ExternalLink, MapPin, Phone, Globe, Info } from "lucide-react";
import { Logo } from "@/components/logo";

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
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch public resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['/api/resources/public', searchTerm],
    queryFn: () => fetch(`/api/resources/public?q=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
  });

  // Ensure resources is always an array
  const resourcesList = Array.isArray(resources) ? resources : [];

  const handleLoginToSave = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-cream-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="h-12" />
          </div>
          <div className="flex items-center space-x-6">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Back to Home
            </Button>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Guest Banner */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You're browsing as a guest. <button 
              onClick={handleLoginToSave} 
              className="font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Login to save resources
            </button> and access additional features.
          </AlertDescription>
        </Alert>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Resources</h1>
          <p className="text-lg text-gray-600 mb-6">
            Discover housing, employment, healthcare, and other support services available in your area.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading resources...</p>
          </div>
        ) : resourcesList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No resources match your search.' : 'No resources available at this time.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourcesList.map((resource: Resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {resource.category}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{resource.description}</p>
                  
                  {resource.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{resource.address}</span>
                    </div>
                  )}
                  
                  {resource.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${resource.phone}`} className="text-blue-600 hover:text-blue-800">
                        {resource.phone}
                      </a>
                    </div>
                  )}
                  
                  {resource.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={resource.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Visit Website <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      onClick={handleLoginToSave}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      title="Login to save this resource"
                    >
                      Login to Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}