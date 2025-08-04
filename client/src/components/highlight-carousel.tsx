import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Phone, Mail } from 'lucide-react';

interface HighlightResource {
  id: string;
  name: string;
  description: string;
  category: string;
  geo?: {
    city: string;
    state: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  url?: string;
  tags?: string[];
}

const flagshipResources: HighlightResource[] = [
  {
    id: 'flagship-1',
    name: 'Life House 7-Stage Housing Program',
    description: 'Comprehensive transitional housing program supporting individuals in their reentry journey with structured stages from emergency shelter to independent living.',
    category: 'housing',
    geo: { city: 'Oakland', state: 'CA' },
    contact: {
      phone: '(510) 555-0123',
      email: 'housing@lifehousereentry.com',
      address: '123 Housing Way, Oakland CA 94612'
    },
    url: 'https://lifehousereentry.com/housing',
    tags: ['transitional housing', 'case management', 'reentry support']
  },
  {
    id: 'flagship-2',
    name: 'Building Your Dream Legacy - Business Coaching',
    description: 'Entrepreneurship and business development program helping formerly incarcerated individuals start and grow sustainable businesses.',
    category: 'employment',
    geo: { city: 'Oakland', state: 'CA' },
    contact: {
      phone: '(510) 555-0124',
      email: 'business@lifehousereentry.com'
    },
    url: 'https://lifehousereentry.com/business',
    tags: ['entrepreneurship', 'business coaching', 'financial literacy']
  },
  {
    id: 'flagship-3',
    name: 'Credit Repair & Financial Literacy',
    description: 'Comprehensive financial wellness program including credit repair, budgeting, savings, and financial planning for long-term stability.',
    category: 'money',
    geo: { city: 'Oakland', state: 'CA' },
    contact: {
      phone: '(510) 555-0125',
      email: 'financial@lifehousereentry.com'
    },
    url: 'https://lifehousereentry.com/financial',
    tags: ['credit repair', 'financial literacy', 'budgeting', 'savings']
  }
];

export function HighlightCarousel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flagshipResources.map((resource) => (
        <Card key={resource.id} className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg font-semibold leading-tight">
                {resource.name}
              </CardTitle>
              <Badge variant="secondary" className="shrink-0">
                {resource.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-gray-600 mb-4 flex-1">
              {resource.description}
            </p>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              {resource.geo && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {resource.geo.city}, {resource.geo.state}
                </div>
              )}
              {resource.contact?.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="h-4 w-4 mr-2" />
                  {resource.contact.phone}
                </div>
              )}
              {resource.contact?.email && (
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  {resource.contact.email}
                </div>
              )}
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Button */}
            {resource.url && (
              <Button variant="outline" size="sm" className="mt-auto" asChild>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn More
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default HighlightCarousel;