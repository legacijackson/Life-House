import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Globe, X, Home, DollarSign, GraduationCap, Users, Heart, Briefcase, Star, TrendingUp, ExternalLink, Search, Scale, Shield, UserCheck } from "lucide-react";
import { Logo } from "@/components/logo";

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  phone: string;
  email?: string;
  website?: string;
  tags: string[];
  languages?: string[];
  eligibility?: string;
}

export default function GuestResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"life-house" | "community">("life-house");

  // Community resources from CSV files
  const communityResources: Resource[] = [
    // Sacramento County Resources
    {
      id: "saint-johns-program",
      name: "Saint John's Program for Real Change",
      description: "Provides transitional housing, job training, mental health support, and child care for formerly incarcerated women and children.",
      category: "housing",
      location: "95811, Sacramento, Sacramento, CA",
      phone: "916-453-1482",
      website: "https://saintjohnsprogram.org",
      tags: ["housing", "job training", "mental health", "women", "child care"],
      eligibility: "Formerly incarcerated women with children; must be sober"
    },
    {
      id: "voa-mather",
      name: "Volunteers of America - Mather Community Campus",
      description: "Offers transitional housing, employment services, and case management for homeless individuals including those recently released from incarceration.",
      category: "housing",
      location: "95655, Mather, Sacramento, CA",
      phone: "916-228-3100",
      website: "https://www.voa-ncnn.org/mather-community-campus",
      tags: ["housing", "employment", "case management", "homeless", "reentry"],
      eligibility: "Adults recently released from incarceration; homeless; must commit to case plan"
    },
    {
      id: "wind-youth",
      name: "Wind Youth Services",
      description: "Serves youth ages 12–24, including reentry youth, with shelter, counseling, and educational support.",
      category: "youth",
      location: "95814, Sacramento, Sacramento, CA",
      phone: "916-504-3313",
      website: "https://www.windyouth.org",
      tags: ["youth", "shelter", "counseling", "education", "reentry"],
      eligibility: "Youth ages 12-24; includes youth on probation or post-incarceration"
    },
    {
      id: "sacramento-county-education",
      name: "Sacramento County Office of Education - Reentry Services",
      description: "Supports reentry with vocational training, high school diploma/GED services, and job placement.",
      category: "education",
      location: "Sacramento, Sacramento, CA",
      phone: "916-228-2500",
      website: "https://www.scoe.net",
      tags: ["education", "GED", "job placement", "vocational training"],
      eligibility: "Reentry youth and adults; Sacramento County"
    },
    {
      id: "my-sisters-house",
      name: "My Sister's House",
      description: "Shelter and legal advocacy for Asian and Pacific Islander women survivors of domestic violence, human trafficking, and incarceration.",
      category: "legal",
      location: "95811, Sacramento, Sacramento, CA",
      phone: "916-428-3271",
      website: "https://www.my-sisters-house.org",
      tags: ["domestic violence", "legal aid", "housing", "women", "AAPI"],
      eligibility: "Women; survivors of DV, HT, or incarceration"
    },
    // Alameda County Resources
    {
      id: "eocp",
      name: "East Oakland Community Project (EOCP)",
      description: "Emergency & transitional housing, meals, case management for formerly incarcerated adults.",
      category: "housing",
      location: "Oakland, Alameda, CA",
      phone: "510-532-3211",
      website: "https://www.eocp.net",
      tags: ["housing", "meals", "case management"],
      eligibility: "Formerly incarcerated adults"
    },
    {
      id: "abode-services",
      name: "Abode Services",
      description: "Permanent & transitional housing placements and support services across East Bay.",
      category: "housing",
      location: "Hayward / Oakland area, Alameda, CA",
      phone: "510-657-7409",
      website: "https://www.abodeservices.org",
      tags: ["housing", "transitional", "permanent"],
      eligibility: "Low-income formerly incarcerated adults"
    },
    {
      id: "boss-oakland",
      name: "Building Opportunities for Self-Sufficiency (BOSS)",
      description: "Employment and transitional housing services, court advocacy, job training.",
      category: "employment",
      location: "East Bay, Alameda, CA",
      phone: "510-649-1930",
      website: "https://self-sufficiency.org",
      tags: ["employment", "housing", "court advocacy"],
      eligibility: "Justice-impacted individuals, AB109 referrals"
    },
    {
      id: "ceo-oakland",
      name: "Center for Employment Opportunities (CEO)",
      description: "Employment readiness & placement exclusively for people with criminal records supervised by probation/parole.",
      category: "employment",
      location: "Oakland, Alameda, CA",
      phone: "510-251-2240",
      website: "http://ceoworks.org",
      tags: ["job placement", "job readiness"],
      eligibility: "AB109 or parole referrals"
    },
    {
      id: "oakland-pic",
      name: "Oakland Private Industry Council Inc.",
      description: "Career counseling, job search assistance, pre-employment & life-skills training.",
      category: "employment",
      location: "Oakland, Alameda, CA",
      phone: "510-768-4400",
      website: "https://www.oaklandpic.org",
      tags: ["employment", "counseling", "training"],
      eligibility: "Adult reentry individuals, US eligible"
    },
    {
      id: "ebclc",
      name: "East Bay Community Law Center (EBCLC)",
      description: "Walk-in legal clinic, Clean Slate expungement, housing law, public benefits.",
      category: "legal",
      location: "Oakland / Dublin, Alameda, CA",
      phone: "510-548-4064",
      website: "https://www.ebclc.org",
      tags: ["legal aid", "expungement", "housing law", "free"],
      eligibility: "Low-income formerly incarcerated adults"
    },
    {
      id: "bay-area-legal-aid",
      name: "Bay Area Legal Aid",
      description: "Free legal services for issues including expungement, public benefits, housing, driver's license restoration.",
      category: "legal",
      location: "Alameda County, CA",
      phone: "510-250-5270",
      website: "https://www.baylegal.org",
      tags: ["legal aid", "expungement", "benefits", "housing"],
      eligibility: "Low-income residents including formerly incarcerated"
    },
    // San Francisco Resources
    {
      id: "reentry-sf",
      name: "Reentry SF – CASC Reentry Center",
      description: "San Francisco Adult Probation's one-stop center offering case management, peer support, housing navigation, employment services, behavioral health referrals, and benefits enrollment.",
      category: "reentry",
      location: "94103, San Francisco, CA",
      phone: "415-489-7300",
      website: "https://www.sf.gov/services/reentry-sf",
      tags: ["case management", "housing", "employment", "behavioral health", "peer support"],
      languages: ["EN", "ES", "ZH", "VI", "Filipino"],
      eligibility: "Justice-involved adults in San Francisco"
    },
    {
      id: "community-housing-partnership",
      name: "Community Housing Partnership",
      description: "Supportive/transitional housing, job training, and case management for formerly homeless and justice-impacted individuals.",
      category: "housing",
      location: "San Francisco, CA",
      phone: "(415) 821-1010",
      website: "https://www.housing.org/",
      tags: ["housing", "job training", "case management", "supportive services"],
      eligibility: "Formerly incarcerated or homeless adults"
    },
    {
      id: "delancey-street",
      name: "Delancey Street Foundation",
      description: "Long-term residential rehabilitation community providing vocational training, housing, education and social enterprise employment.",
      category: "residential",
      location: "San Francisco, CA",
      website: "http://delanceystreetfoundation.org",
      phone: "415-957-9800",
      tags: ["residential rehab", "vocational training", "housing"],
      eligibility: "Justice-involved adults seeking residential support"
    },
    {
      id: "episcopal-community",
      name: "Episcopal Community Services – Residential Reentry Program",
      description: "Up to 6 months of supportive transitional housing for those recently released from state prison, with weekly case management & peer specialist support.",
      category: "housing",
      location: "San Francisco, CA",
      phone: "415-487-3300",
      website: "https://ecs-sf.org/residential-reentry2/",
      tags: ["transitional housing", "case management", "peer support"],
      eligibility: "Recently released parolees at risk of homelessness"
    },
    {
      id: "swords-to-plowshares",
      name: "Swords to Plowshares",
      description: "Veteran-specific services including low-barrier transitional and permanent housing, benefits advocacy, job training and legal assistance.",
      category: "veterans",
      location: "San Francisco / Oakland, CA",
      phone: "415-252-4788",
      website: "https://swords-to-plowshares.org",
      tags: ["veteran services", "housing", "legal aid", "training"],
      eligibility: "Low-income veterans with criminal justice history (Bay Area)"
    },
    {
      id: "five-keys-home-free",
      name: "Five Keys Charter School – Home Free Program",
      description: "Housing navigation and transitional apartments on Treasure Island for formerly incarcerated women survivors of violence; includes life skills, job retention, case management.",
      category: "housing",
      location: "San Francisco, CA",
      phone: "415-282-3335",
      website: "https://www.fivekeyscharter.org/program-reentry",
      tags: ["housing", "women", "job training", "survivors", "reentry"],
      eligibility: "Formerly incarcerated women survivors"
    },
    {
      id: "ycd-sf",
      name: "Young Community Developers (YCD)",
      description: "Job readiness, employment support and career pathways for adults including formerly incarcerated individuals in San Francisco.",
      category: "employment",
      location: "San Francisco, CA",
      phone: "415-647-4700",
      website: "https://www.ycdjobs.org",
      tags: ["job training", "employment", "reentry adults"],
      eligibility: "Adults 18+ reentering workforce including justice-impacted"
    },
    {
      id: "arc-sf",
      name: "Anti-Recidivism Coalition (ARC)",
      description: "Peer mentorship, housing support, employment programs and advocacy for justice-impacted individuals statewide, with presence in SF.",
      category: "advocacy",
      location: "San Francisco, CA",
      phone: "213-479-1805",
      website: "https://antirecidivism.org",
      tags: ["mentorship", "housing support", "employment", "advocacy"],
      eligibility: "Formerly and currently incarcerated Californians"
    }
  ];

  // Life House flagship programs from the screenshots
  const lifeHousePrograms: Resource[] = [
    {
      id: "housing-program",
      name: "Life House 7-Stage Housing Program",
      description: "Comprehensive transitional housing program supporting individuals in their reentry journey with structured stages from emergency shelter to independent living.",
      category: "housing",
      location: "Oakland, CA",
      phone: "(510) 555-0123",
      email: "housing@lifehousereentry.com",
      tags: ["transitional housing", "case management", "reentry support"]
    },
    {
      id: "business-coaching",
      name: "Building Your Dream Legacy - Business Coaching",
      description: "Entrepreneurship and business development program helping formerly incarcerated individuals start and grow sustainable businesses.",
      category: "employment",
      location: "Oakland, CA", 
      phone: "(510) 555-0124",
      email: "business@lifehousereentry.com",
      tags: ["entrepreneurship", "business coaching", "financial literacy"]
    },
    {
      id: "financial-literacy",
      name: "Financial Literacy Program",
      description: "Global Investment Company partnership offering comprehensive financial education. $179.99/month program covering budgeting, investing, credit, insurance...",
      category: "financial",
      location: "Oakland, CA",
      phone: "(510) 555-0125", 
      email: "financial@lifehousereentry.com",
      tags: ["financial-literacy", "budgeting", "investing"]
    },
    {
      id: "coaching-program",
      name: "Business Coaching Program",
      description: "Building Your Dream Legacy by Kai Shariff - 'Serve your gifts, talents and magic to people who get you and build a legacy that serves you!'",
      category: "coaching",
      location: "Oakland, CA",
      phone: "(510) 555-0126",
      email: "coaching@lifehousereentry.com", 
      tags: ["entrepreneurship", "coaching", "legacy-building"]
    },
    {
      id: "savings-program",
      name: "Brokerage & Savings Program",
      description: "Professional investment services with transparent trust account model. Clients retain beneficial ownership with structured access during program participation...",
      category: "savings",
      location: "Oakland, CA",
      phone: "(510) 555-0127",
      email: "savings@lifehousereentry.com",
      tags: ["wealth-building", "client-ownership", "trust-model"]
    },
    {
      id: "partnerships",
      name: "Community Partnerships",
      description: "Strategic healing-centered engagement network for comprehensive wraparound services including parole, STOP contractors, CalAIM ECM Providers...",
      category: "partnerships",
      location: "California Network",
      phone: "(510) 555-0128",
      email: "partnerships@lifehousereentry.com",
      tags: ["wraparound-services", "healing-centered", "community"]
    }
  ];

  const openResourceModal = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const closeResourceModal = () => {
    setSelectedResource(null);
    setIsModalOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'housing': Home,
      'financial': DollarSign,
      'employment': Briefcase,
      'coaching': Users,
      'savings': TrendingUp,
      'partnerships': Heart,
      'education': GraduationCap,
      'legal': Scale,
      'youth': UserCheck,
      'reentry': Shield,
      'veterans': Shield,
      'residential': Home,
      'advocacy': Heart,
      'default': Heart
    };
    const IconComponent = icons[category.toLowerCase()] || icons.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'housing': 'from-green-500 to-green-600',
      'financial': 'from-blue-500 to-blue-600', 
      'employment': 'from-orange-500 to-orange-600',
      'coaching': 'from-red-500 to-red-600',
      'savings': 'from-green-500 to-green-600',
      'partnerships': 'from-red-500 to-red-600',
      'education': 'from-purple-500 to-purple-600',
      'legal': 'from-indigo-500 to-indigo-600',
      'youth': 'from-pink-500 to-pink-600',
      'reentry': 'from-teal-500 to-teal-600',
      'veterans': 'from-amber-500 to-amber-600',
      'residential': 'from-emerald-500 to-emerald-600',
      'advocacy': 'from-rose-500 to-rose-600',
      'default': 'from-gray-500 to-gray-600'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'housing': 'bg-green-100 text-green-800',
      'financial': 'bg-blue-100 text-blue-800',
      'employment': 'bg-orange-100 text-orange-800', 
      'coaching': 'bg-red-100 text-red-800',
      'savings': 'bg-green-100 text-green-800',
      'partnerships': 'bg-red-100 text-red-800',
      'education': 'bg-purple-100 text-purple-800',
      'legal': 'bg-indigo-100 text-indigo-800',
      'youth': 'bg-pink-100 text-pink-800',
      'reentry': 'bg-teal-100 text-teal-800',
      'veterans': 'bg-amber-100 text-amber-800',
      'residential': 'bg-emerald-100 text-emerald-800',
      'advocacy': 'bg-rose-100 text-rose-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  // Filter resources based on search query
  const filterResources = (resources: Resource[], query: string) => {
    if (!query.trim()) return resources;
    
    const searchLower = query.toLowerCase();
    return resources.filter(resource => 
      resource.name.toLowerCase().includes(searchLower) ||
      resource.description.toLowerCase().includes(searchLower) ||
      resource.category.toLowerCase().includes(searchLower) ||
      resource.location.toLowerCase().includes(searchLower) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  };

  const getCurrentResources = () => {
    if (activeTab === "life-house") {
      return filterResources(lifeHousePrograms, searchQuery);
    } else {
      return filterResources(communityResources, searchQuery);
    }
  };

  return (
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
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("life-house")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "life-house"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Life House Programs
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "community"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Community Resources
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === "life-house" ? "Life House Programs & Services" : "Community Resources"}
          </h2>
          <p className="text-gray-600">
            {activeTab === "life-house" 
              ? "Comprehensive wraparound services designed for successful reentry"
              : "Additional resources and support services in our network"
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={`Search ${activeTab === "life-house" ? "Life House programs" : "community resources"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getCurrentResources().map((resource) => (
            <Card 
              key={resource.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border bg-white"
              onClick={() => openResourceModal(resource)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                    {resource.name}
                  </CardTitle>
                  <Badge className={getCategoryBadgeColor(resource.category)}>
                    {resource.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {resource.description}
                </p>
                
                <div className="space-y-2 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{resource.phone}</span>
                  </div>
                  {resource.email && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{resource.email}</span>
                    </div>
                  )}
                  {resource.website && !resource.email && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Website Available</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{resource.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    openResourceModal(resource);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {getCurrentResources().length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or browse a different category.
            </p>
          </div>
        )}
      </div>

      {/* Beautiful Resource Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedResource && (
            <div className="relative">
              {/* Header with Category Color */}
              <div className={`bg-gradient-to-r ${getCategoryColor(selectedResource.category)} text-white p-6 rounded-t-lg`}>
                <button 
                  onClick={closeResourceModal}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {getCategoryIcon(selectedResource.category)}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white mb-2">
                      {selectedResource.name}
                    </DialogTitle>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {selectedResource.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Service Overview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Service Overview
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {selectedResource.description}
                    </p>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Professional credit repair through CureMyCredit700</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          Professional credit repair services specializing in challenging inaccurate, outdated, and unverifiable information on credit reports through proven strategies and personalized approaches.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Core Services & Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Core Services
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Credit Report Analysis</h4>
                          <p className="text-sm text-gray-600">Comprehensive review of all negative items affecting credit scores</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Dispute Processing</h4>
                          <p className="text-sm text-gray-600">Strategic challenges to inaccurate information with credit bureaus</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Credit Building Guidance</h4>
                          <p className="text-sm text-gray-600">Personalized strategies for improving credit health long-term</p>
                        </div>
                      </div>
                    </div>

                    {/* Proven Results Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Proven Results
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">4.9/5</div>
                          <div className="text-xs text-gray-600">Customer Rating</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">400+</div>
                          <div className="text-xs text-gray-600">testimonials</div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <div className="text-lg font-semibold text-purple-600">3-6 months</div>
                        <div className="text-xs text-gray-600">Typical Timeline</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Related Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  {selectedResource.phone && (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${getCategoryColor(selectedResource.category)} text-white hover:opacity-90`}
                      onClick={() => window.open(`tel:${selectedResource.phone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  )}
                  {selectedResource.website && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(selectedResource.website, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                  {selectedResource.email && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`mailto:${selectedResource.email}`, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Email Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}