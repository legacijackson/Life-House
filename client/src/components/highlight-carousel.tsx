
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building, Heart, Briefcase, DollarSign, GraduationCap, Smartphone } from 'lucide-react';

interface HighlightResource {
  id: string;
  title: string;
  description: string;
  category: string;
  url?: string;
  status: string;
}

const categoryIcons = {
  financial: DollarSign,
  housing: Building,
  healing: Heart,
  jobreadiness: Briefcase,
  business: Briefcase,
  community: GraduationCap,
  default: Smartphone
};

const categoryColors = {
  financial: "bg-green-100 text-green-800",
  housing: "bg-blue-100 text-blue-800", 
  healing: "bg-purple-100 text-purple-800",
  jobreadiness: "bg-orange-100 text-orange-800",
  business: "bg-indigo-100 text-indigo-800",
  community: "bg-pink-100 text-pink-800",
  default: "bg-gray-100 text-gray-800"
};

export function HighlightCarousel() {
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources/highlight'],
    queryFn: async () => {
      const response = await fetch('/api/resources/highlight');
      if (!response.ok) throw new Error('Failed to fetch highlight resources');
      return response.json();
    }
  });

  if (!resources.length) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No flagship programs available at this time.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {resources.map((resource: HighlightResource) => {
            const IconComponent = categoryIcons[resource.category as keyof typeof categoryIcons] || categoryIcons.default;
            const colorClass = categoryColors[resource.category as keyof typeof categoryColors] || categoryColors.default;
            
            return (
              <Card key={resource.id} className="w-80 flex-shrink-0 border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-purple-600" />
                      <Badge className={colorClass}>
                        {resource.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">
                      Life House Program
                    </span>
                    {resource.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Learn More
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HighlightCarousel;
