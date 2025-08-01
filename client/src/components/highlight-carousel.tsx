import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, Fragment } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HighlightCarouselProps {
  onResourceClick?: (resource: Resource) => void;
}

export default function HighlightCarousel({ onResourceClick }: HighlightCarouselProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  const { data: highlightResources = [], isLoading } = useQuery({
    queryKey: ['/api/resources/highlight'],
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[350px] h-[280px] bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if ((highlightResources as any[]).length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      financial: 'bg-green-100 text-green-800 border-green-300',
      healing: 'bg-purple-100 text-purple-800 border-purple-300',
      jobreadiness: 'bg-blue-100 text-blue-800 border-blue-300',
      housing: 'bg-orange-100 text-orange-800 border-orange-300',
      community: 'bg-pink-100 text-pink-800 border-pink-300',
      business: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handleCardClick = (resource: Resource) => {
    if (onResourceClick) {
      onResourceClick(resource);
    } else {
      setSelectedResource(resource);
    }
  };

  return (
    <>
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {(highlightResources as Resource[]).map((resource) => {
          const categories = resource.categories as string[] | null;
          return (
          <Card 
            key={resource.id}
            className="min-w-[380px] max-w-[380px] cursor-pointer group hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-300 bg-gradient-to-br from-white to-green-50"
            onClick={() => handleCardClick(resource)}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  {resource.image ? (
                    <img src={resource.image} alt={resource.name} className="w-12 h-12" />
                  ) : (
                    <div className="w-12 h-12 bg-green-600 rounded-full" />
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  Life House Program
                </Badge>
              </div>
              
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2">
                  {resource.name}
                </CardTitle>
                {categories && categories.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {categories.map((cat, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(cat)}`}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="text-gray-600 line-clamp-3 text-sm">
                {resource.summary || resource.description}
              </CardDescription>
              
              <div className="mt-4 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-green-700 hover:text-green-800 hover:bg-green-100 font-semibold group"
                >
                  Learn More 
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                
                {resource.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(resource.url!, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            {/* Header with gradient background */}
            <div className={`p-8 pb-6 ${
              Array.isArray(selectedResource?.categories) && selectedResource.categories[0] === 'financial' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
              Array.isArray(selectedResource?.categories) && selectedResource.categories[0] === 'healing' ? 'bg-gradient-to-br from-purple-50 to-purple-100' :
              Array.isArray(selectedResource?.categories) && selectedResource.categories[0] === 'housing' ? 'bg-gradient-to-br from-green-50 to-green-100' :
              Array.isArray(selectedResource?.categories) && selectedResource.categories[0] === 'jobreadiness' ? 'bg-gradient-to-br from-orange-50 to-orange-100' :
              Array.isArray(selectedResource?.categories) && selectedResource.categories[0] === 'community' ? 'bg-gradient-to-br from-pink-50 to-pink-100' :
              'bg-gradient-to-br from-gray-50 to-gray-100'
            }`}>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedResource?.image && (
                    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0">
                      <img src={selectedResource.image} alt={selectedResource.name} className="w-12 h-12" />
                    </div>
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedResource?.name}
                    </DialogTitle>
                    {selectedResource?.summary && (
                      <p className="text-gray-700 font-medium">
                        {selectedResource.summary}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>
            </div>
            
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="p-8 pt-6 space-y-8">
                {/* Main Description */}
                {selectedResource?.description && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-1 h-6 bg-green-600 mr-3 rounded-full"></span>
                      Program Overview
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {String(selectedResource.description)}
                    </p>
                  </section>
                )}

                {/* Key Features */}
                {selectedResource?.tags && Array.isArray(selectedResource.tags) && selectedResource.tags.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-1 h-6 bg-blue-600 mr-3 rounded-full"></span>
                      Key Features
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(selectedResource.tags as string[]).map((tag, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-700 text-sm capitalize">
                            {tag.replace(/-/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Eligibility */}
                {selectedResource?.eligibility && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                      Who Can Apply
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{String(selectedResource.eligibility || '')}</p>
                    </div>
                  </section>
                )}

                {/* Categories */}
                {selectedResource?.categories && Array.isArray(selectedResource.categories) && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-1 h-6 bg-orange-600 mr-3 rounded-full"></span>
                      Program Categories
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedResource.categories as string[]).map((cat, idx) => (
                        <Badge 
                          key={idx} 
                          className={`${getCategoryColor(cat)} text-sm px-4 py-1.5`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Provider Info */}
                <section className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{selectedResource?.isLifehouse ? 'Life House Program' : 'Partner Service'}</span>
                    </div>
                    
                    {selectedResource?.url && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                        onClick={() => window.open(selectedResource.url!, '_blank')}
                      >
                        Learn More
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}