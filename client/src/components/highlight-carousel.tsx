import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Resource {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  categories?: string[];
  url?: string;
  category: string;
  image?: string;
}

export function HighlightCarousel() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  const { data: highlightResources, isLoading } = useQuery({
    queryKey: ['/api/resources/highlight'],
    queryFn: async () => {
      const response = await fetch('/api/resources/highlight');
      if (!response.ok) throw new Error('Failed to fetch highlight resources');
      return response.json() as Promise<Resource[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!highlightResources || highlightResources.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-100">
        {highlightResources.map((resource) => (
          <Card
            key={resource.id}
            className="flex-shrink-0 w-80 p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-purple-400"
            onClick={() => setSelectedResource(resource)}
          >
            <div className="h-full flex flex-col">
              {/* Image placeholder with gradient background */}
              <div className="h-32 mb-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                {resource.image ? (
                  <img 
                    src={resource.image} 
                    alt={resource.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center p-4">
                    <svg 
                      className="w-16 h-16 mx-auto mb-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                      />
                    </svg>
                    <span className="text-sm font-medium">Life House</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {resource.name}
              </h3>
              
              {/* Category badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {resource.categories && resource.categories.length > 0 ? (
                  resource.categories.slice(0, 3).map((cat, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs bg-purple-100 text-purple-700"
                    >
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {resource.category}
                  </Badge>
                )}
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-600 line-clamp-3 flex-grow">
                {resource.summary || resource.description || 'Learn more about this Life House program.'}
              </p>

              {/* Learn More button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3 text-purple-600 hover:text-purple-700 p-0 h-auto font-medium"
              >
                Learn More 
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Resource Detail Modal */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedResource?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {/* Full image */}
            <div className="h-48 mb-4 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
              {selectedResource?.image ? (
                <img 
                  src={selectedResource.image} 
                  alt={selectedResource.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-center">
                  <svg 
                    className="w-24 h-24 mx-auto mb-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                    />
                  </svg>
                  <span className="text-lg font-medium">Life House Program</span>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedResource?.categories?.map((cat, idx) => (
                <Badge 
                  key={idx} 
                  className="bg-purple-100 text-purple-700"
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Summary */}
            {selectedResource?.summary && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-gray-600">{selectedResource.summary}</p>
              </div>
            )}

            {/* Full Description */}
            <DialogDescription className="text-base">
              {selectedResource?.description || selectedResource?.summary || 
                'This Life House program is designed to support residents in their journey toward stability and success.'}
            </DialogDescription>

            {/* Program URL */}
            {selectedResource?.url && (
              <div className="mt-6">
                <Button asChild className="w-full">
                  <a 
                    href={selectedResource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Program Website
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}