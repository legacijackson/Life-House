import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building,
  Bed,
  Users,
  MapPin,
  Phone,
  Calendar,
  Settings,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Car,
  Coffee,
  Shield
} from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bedsTotal: number;
  bedsAvailable: number;
  occupancyLimit: number;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
}

interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  beds: number;
  occupants: string[];
  amenities?: string[];
}

interface Occupant {
  id: string;
  name: string;
  stage: number;
  moveInDate: string;
}

const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main Street',
    city: 'Oakland',
    state: 'CA',
    zip: '94607',
    bedrooms: 8,
    bedsTotal: 16,
    bedsAvailable: 3,
    occupancyLimit: 16,
    amenities: ['wifi', 'laundry', 'parking', 'kitchen', 'security'],
    createdAt: '2023-01-15',
    updatedAt: '2024-01-20',
    rooms: [
      { id: 'r1', propertyId: '1', roomNumber: '101A', beds: 2, occupants: ['res1', 'res2'] },
      { id: 'r2', propertyId: '1', roomNumber: '101B', beds: 2, occupants: ['res3'] },
      { id: 'r3', propertyId: '1', roomNumber: '102A', beds: 2, occupants: ['res4', 'res5'] },
      { id: 'r4', propertyId: '1', roomNumber: '102B', beds: 2, occupants: [] },
      { id: 'r5', propertyId: '1', roomNumber: '201A', beds: 2, occupants: ['res6'] },
      { id: 'r6', propertyId: '1', roomNumber: '201B', beds: 2, occupants: ['res7', 'res8'] },
      { id: 'r7', propertyId: '1', roomNumber: '202A', beds: 2, occupants: ['res9'] },
      { id: 'r8', propertyId: '1', roomNumber: '202B', beds: 2, occupants: [] }
    ]
  },
  {
    id: '2',
    address: '456 Oak Avenue',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    bedrooms: 6,
    bedsTotal: 12,
    bedsAvailable: 1,
    occupancyLimit: 12,
    amenities: ['wifi', 'laundry', 'kitchen', 'security', 'garden'],
    createdAt: '2023-03-10',
    updatedAt: '2024-01-18',
    rooms: [
      { id: 'r9', propertyId: '2', roomNumber: 'A1', beds: 2, occupants: ['res10', 'res11'] },
      { id: 'r10', propertyId: '2', roomNumber: 'A2', beds: 2, occupants: ['res12', 'res13'] },
      { id: 'r11', propertyId: '2', roomNumber: 'B1', beds: 2, occupants: ['res14'] },
      { id: 'r12', propertyId: '2', roomNumber: 'B2', beds: 2, occupants: ['res15', 'res16'] },
      { id: 'r13', propertyId: '2', roomNumber: 'C1', beds: 2, occupants: ['res17', 'res18'] },
      { id: 'r14', propertyId: '2', roomNumber: 'C2', beds: 2, occupants: ['res19'] }
    ]
  }
];

const mockOccupants: Record<string, Occupant> = {
  'res1': { id: 'res1', name: 'Marcus Johnson', stage: 3, moveInDate: '2024-01-15' },
  'res2': { id: 'res2', name: 'David Rodriguez', stage: 5, moveInDate: '2023-11-20' },
  'res3': { id: 'res3', name: 'James Wilson', stage: 2, moveInDate: '2024-01-20' },
  'res4': { id: 'res4', name: 'Robert Brown', stage: 4, moveInDate: '2023-12-10' },
  'res5': { id: 'res5', name: 'Michael Davis', stage: 3, moveInDate: '2024-01-05' },
  'res6': { id: 'res6', name: 'William Garcia', stage: 6, moveInDate: '2023-10-15' },
  'res7': { id: 'res7', name: 'Richard Martinez', stage: 2, moveInDate: '2024-01-22' },
  'res8': { id: 'res8', name: 'Charles Anderson', stage: 5, moveInDate: '2023-09-30' },
  'res9': { id: 'res9', name: 'Thomas Taylor', stage: 1, moveInDate: '2024-01-25' },
  'res10': { id: 'res10', name: 'Christopher Moore', stage: 4, moveInDate: '2023-12-20' },
  'res11': { id: 'res11', name: 'Daniel Jackson', stage: 3, moveInDate: '2024-01-10' },
  'res12': { id: 'res12', name: 'Matthew White', stage: 2, moveInDate: '2024-01-18' },
  'res13': { id: 'res13', name: 'Anthony Harris', stage: 5, moveInDate: '2023-11-25' },
  'res14': { id: 'res14', name: 'Donald Clark', stage: 1, moveInDate: '2024-01-23' },
  'res15': { id: 'res15', name: 'Steven Lewis', stage: 4, moveInDate: '2023-12-05' },
  'res16': { id: 'res16', name: 'Paul Robinson', stage: 3, moveInDate: '2024-01-12' },
  'res17': { id: 'res17', name: 'Andrew Walker', stage: 6, moveInDate: '2023-08-20' },
  'res18': { id: 'res18', name: 'Joshua Hall', stage: 2, moveInDate: '2024-01-19' },
  'res19': { id: 'res19', name: 'Kenneth Allen', stage: 5, moveInDate: '2023-10-30' }
};

export default function Properties() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // In a real app, this would fetch from API
  const { data: properties = mockProperties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    enabled: false // Using mock data for now
  });

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, typeof Wifi> = {
      wifi: Wifi,
      laundry: Settings,
      parking: Car,
      kitchen: Coffee,
      security: Shield,
      garden: Building
    };
    return icons[amenity] || Building;
  };

  const getOccupancyStatus = (property: Property) => {
    const occupancyRate = ((property.bedsTotal - property.bedsAvailable) / property.bedsTotal) * 100;
    if (occupancyRate >= 90) return { label: 'Full', color: 'bg-red-100 text-red-800' };
    if (occupancyRate >= 80) return { label: 'High', color: 'bg-yellow-100 text-yellow-800' };
    if (occupancyRate >= 60) return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Low', color: 'bg-green-100 text-green-800' };
  };

  const getStageColor = (stage: number) => {
    if (stage <= 2) return 'bg-red-100 text-red-800';
    if (stage <= 4) return 'bg-yellow-100 text-yellow-800';
    if (stage <= 6) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Life House Properties</h1>
                <p className="text-sm text-gray-600">Manage transitional housing properties and bed assignments</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Property Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                  </div>
                  <Building className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Beds</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {properties.reduce((sum: number, p: Property) => sum + p.bedsTotal, 0)}
                    </p>
                  </div>
                  <Bed className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Beds</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {properties.reduce((sum: number, p: Property) => sum + p.bedsAvailable, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Properties List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Properties ({properties.length})
              </h2>
              
              {properties.map((property: Property) => {
                const occupancyStatus = getOccupancyStatus(property);
                return (
                  <Card 
                    key={property.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{property.address}</h3>
                          <p className="text-sm text-gray-500">
                            {property.city}, {property.state} {property.zip}
                          </p>
                        </div>
                        <Badge className={occupancyStatus.color}>
                          {occupancyStatus.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{property.bedrooms}</p>
                          <p className="text-xs text-gray-500">Bedrooms</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{property.bedsTotal}</p>
                          <p className="text-xs text-gray-500">Total Beds</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-green-600">{property.bedsAvailable}</p>
                          <p className="text-xs text-gray-500">Available</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 4).map((amenity: string) => {
                          const IconComponent = getAmenityIcon(amenity);
                          return (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              <IconComponent className="w-3 h-3 mr-1" />
                              {amenity}
                            </Badge>
                          );
                        })}
                        {property.amenities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Property Details */}
            <div>
              {selectedProperty ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedProperty.address}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="rooms" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rooms">Rooms</TabsTrigger>
                        <TabsTrigger value="occupants">Occupants</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="rooms" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {selectedProperty.rooms.map((room) => (
                            <Card key={room.id} className="border">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{room.roomNumber}</h4>
                                  <Badge variant={room.occupants.length < room.beds ? "secondary" : "outline"}>
                                    {room.occupants.length}/{room.beds}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  {room.occupants.length > 0 ? (
                                    room.occupants.map((occupantId) => {
                                      const occupant = mockOccupants[occupantId];
                                      return (
                                        <div key={occupantId} className="flex items-center justify-between text-xs">
                                          <span className="text-gray-600">{occupant?.name}</span>
                                          <Badge className={`text-xs ${getStageColor(occupant?.stage || 1)}`}>
                                            S{occupant?.stage}
                                          </Badge>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-xs text-gray-400 italic">Available</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="occupants" className="space-y-3">
                        {selectedProperty.rooms
                          .filter(room => room.occupants.length > 0)
                          .map((room) => (
                            <div key={room.id}>
                              <h4 className="font-medium text-gray-700 mb-2">Room {room.roomNumber}</h4>
                              <div className="space-y-2 mb-4">
                                {room.occupants.map((occupantId) => {
                                  const occupant = mockOccupants[occupantId];
                                  return (
                                    <div key={occupantId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-medium text-blue-700">
                                            {occupant?.name.split(' ').map(n => n[0]).join('')}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{occupant?.name}</p>
                                          <p className="text-xs text-gray-500">
                                            Moved in: {occupant?.moveInDate && new Date(occupant.moveInDate).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge className={getStageColor(occupant?.stage || 1)}>
                                        Stage {occupant?.stage}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        }
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Property Info</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bedrooms:</span>
                                <span className="font-medium">{selectedProperty.bedrooms}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Beds:</span>
                                <span className="font-medium">{selectedProperty.bedsTotal}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Occupancy Limit:</span>
                                <span className="font-medium">{selectedProperty.occupancyLimit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Available Beds:</span>
                                <span className="font-medium text-green-600">{selectedProperty.bedsAvailable}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedProperty.amenities.map((amenity) => {
                                const IconComponent = getAmenityIcon(amenity);
                                return (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {amenity}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Occupancy Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Current Occupancy</span>
                              <span className="font-medium">
                                {selectedProperty.bedsTotal - selectedProperty.bedsAvailable}/{selectedProperty.bedsTotal} beds
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${((selectedProperty.bedsTotal - selectedProperty.bedsAvailable) / selectedProperty.bedsTotal) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
                    <p className="text-gray-500">Choose a property from the list to view details, room assignments, and occupancy information.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
