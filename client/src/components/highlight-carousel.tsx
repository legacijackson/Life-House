import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
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
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{selectedResource?.name}</DialogTitle>
                {selectedResource?.categories && Array.isArray(selectedResource.categories) && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(selectedResource.categories as string[]).map((cat, idx) => (
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
              {selectedResource?.image && (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center ml-4">
                  <img src={selectedResource.image} alt={selectedResource.name} className="w-16 h-16" />
                </div>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="mt-4 max-h-[60vh]">
            <div className="space-y-4">
              <DialogDescription className="text-base text-gray-700">
                {selectedResource?.description}
              </DialogDescription>
              
              {selectedResource?.eligibility && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Eligibility</h3>
                  <p className="text-gray-600">{selectedResource.eligibility}</p>
                </div>
              )}
              
              {selectedResource?.url && (
                <div className="pt-4">
                  <Button 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(selectedResource.url!, '_blank')}
                  >
                    Visit Program Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}