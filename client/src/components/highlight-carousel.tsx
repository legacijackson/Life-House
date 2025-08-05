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
    id: 'stop-touchpoint',
    name: '🛑 STOP TouchPoint',
    description: 'Strengthening The Opportunity for Peace – Daily accountability check-ins that build consistency, community connection, and help residents stay focused on their recovery and reentry goals.',
    category: 'Program',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['daily check-in', 'accountability', 'community support']
  },
  {
    id: 'stop-arms',
    name: '🛡️ STOP ARMS',
    description: 'Addiction Recovery Management System – Comprehensive substance abuse support combining peer mentorship, structured accountability, and evidence-based recovery strategies for lasting sobriety.',
    category: 'Recovery',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['addiction recovery', 'peer support', 'sobriety']
  },
  {
    id: 'dream-legacy',
    name: '🚀 Building Your Dream Legacy',
    description: 'Entrepreneurship bootcamp teaching business fundamentals, financial literacy, and practical skills to help residents launch sustainable businesses and create generational wealth.',
    category: 'Business',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['entrepreneurship', 'business training', 'financial freedom']
  },
  {
    id: 'fatherhood-focus',
    name: '👨‍👧‍👦 Fatherhood Focus',
    description: 'Dedicated program helping fathers rebuild relationships with their children, develop healthy parenting skills, and navigate co-parenting challenges during reentry.',
    category: 'Family',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['parenting', 'family reunification', 'co-parenting']
  },
  {
    id: 'mens-circle',
    name: '🤝 Men\'s Circle',
    description: 'Weekly peer support group providing a safe space for men to process emotions, build healthy masculinity, and develop brotherhood through vulnerability and authentic connection.',
    category: 'Support',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['peer support', 'emotional wellness', 'brotherhood']
  },
  {
    id: 'reentry-navigation',
    name: '🧭 Re-entry Navigation',
    description: 'Comprehensive case management helping residents obtain vital documents, access benefits, navigate legal requirements, and connect with essential community resources.',
    category: 'Services',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['case management', 'benefits assistance', 'resource connection']
  },
  {
    id: 'financial-literacy',
    name: '💰 Financial Literacy',
    description: 'Intensive financial education covering budgeting, credit repair, banking, investing, and building long-term wealth through our unique 25% savings program with brokerage accounts.',
    category: 'Finance',
    geo: { city: 'Sacramento', state: 'CA' },
    tags: ['money management', 'credit repair', 'investment education']
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

            {/* Location */}
            {resource.geo && (
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {resource.geo.city}, {resource.geo.state}
                </div>
              </div>
            )}

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


          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default HighlightCarousel;