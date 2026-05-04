import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Building, Bed, Users, Calendar, Settings, Plus, Wifi, Car, Coffee, Shield, UserPlus, X, Loader2,
  BookOpen, Bell, Trash2,
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { AddPropertyModal } from "@/components/add-property-modal";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bedsTotal: number | null;
  bedsAvailable: number | null;
  occupancyLimit: number | null;
  amenities: string[] | null;
  createdAt: string;
}

interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  beds: number | null;
  occupants: string[] | null;
}

interface Client {
  id: string;
  name: string;
  profile?: { bedAssignment?: string; onboardingStatus?: string };
}

function getOccupancyStatus(bedsTotal: number, bedsAvailable: number) {
  const rate = ((bedsTotal - bedsAvailable) / Math.max(bedsTotal, 1)) * 100;
  if (rate >= 90) return { label: 'Full', color: 'bg-red-100 text-red-800' };
  if (rate >= 80) return { label: 'High', color: 'bg-yellow-100 text-yellow-800' };
  if (rate >= 60) return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
  return { label: 'Low', color: 'bg-green-100 text-green-800' };
}

function amenityIcon(amenity: string) {
  const map: Record<string, typeof Wifi> = { wifi: Wifi, parking: Car, kitchen: Coffee, security: Shield, laundry: Settings };
  return map[amenity] ?? Building;
}

interface HouseRule { id: string; title: string; content: string; category: string; sortOrder: number }
interface HousingNotice { id: string; title: string; content: string; priority: string; createdAt: string }

export default function Properties() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomBeds, setRoomBeds] = useState('1');
  const [assignOpen, setAssignOpen] = useState<Room | null>(null);
  const [assignClientId, setAssignClientId] = useState('');

  // House rules state
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ title: '', content: '', category: 'general' });
  // Notices state
  const [addNoticeOpen, setAddNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', priority: 'normal' });

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: () => apiRequest('GET', '/api/properties').then((r) => r.json()),
  });

  const { data: propertyRooms = [] } = useQuery<Room[]>({
    queryKey: ['/api/properties', selectedProperty?.id, 'rooms'],
    queryFn: () => apiRequest('GET', `/api/properties/${selectedProperty!.id}/rooms`).then((r) => r.json()),
    enabled: !!selectedProperty?.id,
  });

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: () => apiRequest('GET', '/api/clients').then((r) => r.json()),
  });

  const clientMap = Object.fromEntries((allClients as Client[]).map((c) => [c.id, c]));

  const createRoom = useMutation({
    mutationFn: () => apiRequest('POST', `/api/properties/${selectedProperty!.id}/rooms`, { roomNumber, beds: parseInt(roomBeds) || 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/properties', selectedProperty?.id, 'rooms'] });
      setAddRoomOpen(false);
      setRoomNumber('');
      setRoomBeds('1');
      toast({ title: 'Room added' });
    },
    onError: () => toast({ title: 'Failed to add room', variant: 'destructive' }),
  });

  const { data: houseRules = [] } = useQuery<HouseRule[]>({
    queryKey: ['/api/house-rules', selectedProperty?.id],
    queryFn: () => apiRequest('GET', `/api/house-rules?propertyId=${selectedProperty!.id}`).then(r => r.json()),
    enabled: !!selectedProperty?.id,
  });

  const { data: housingNotices = [] } = useQuery<HousingNotice[]>({
    queryKey: ['/api/housing/notices', selectedProperty?.id],
    queryFn: () => apiRequest('GET', `/api/housing/notices?propertyId=${selectedProperty!.id}`).then(r => r.json()),
    enabled: !!selectedProperty?.id,
  });

  const createRule = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/house-rules', { ...data, propertyId: selectedProperty?.id }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/house-rules', selectedProperty?.id] });
      setAddRuleOpen(false);
      setRuleForm({ title: '', content: '', category: 'general' });
      toast({ title: 'House rule added' });
    },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/house-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/house-rules', selectedProperty?.id] }),
  });

  const createNotice = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/housing/notices', { ...data, propertyId: selectedProperty?.id }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/housing/notices', selectedProperty?.id] });
      setAddNoticeOpen(false);
      setNoticeForm({ title: '', content: '', priority: 'normal' });
      toast({ title: 'Notice posted' });
    },
  });

  const deleteNotice = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/housing/notices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/housing/notices', selectedProperty?.id] }),
  });

  const assignBed = useMutation({
    mutationFn: ({ roomId, clientId, remove }: { roomId: string; clientId: string; remove?: boolean }) =>
      apiRequest('PATCH', `/api/properties/${selectedProperty!.id}/rooms/${roomId}/assign`, { clientId, remove }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/properties', selectedProperty?.id, 'rooms'] });
      qc.invalidateQueries({ queryKey: ['/api/properties'] });
      setAssignOpen(null);
      setAssignClientId('');
      toast({ title: 'Bed assignment updated' });
    },
    onError: () => toast({ title: 'Failed to update assignment', variant: 'destructive' }),
  });

  const totalBeds = (properties as Property[]).reduce((s, p) => s + (p.bedsTotal ?? 0), 0);
  const totalAvailable = (properties as Property[]).reduce((s, p) => s + (p.bedsAvailable ?? 0), 0);

  const assignedClientIds = new Set(propertyRooms.flatMap((r) => r.occupants ?? []));
  const unassignedClients = (allClients as Client[]).filter((c) => !assignedClientIds.has(c.id));

  return (
    <div className="flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Life House Properties</h1>
              <p className="text-sm text-gray-600">Manage transitional housing properties and bed assignments</p>
            </div>
            <Button onClick={() => setIsAddPropertyModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Summary cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{(properties as Property[]).length}</p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Beds</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBeds}</p>
                </div>
                <Bed className="w-8 h-8 text-green-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Beds</p>
                  <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Properties List */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Properties ({(properties as Property[]).length})
                </h2>
                {(properties as Property[]).length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No properties yet. Add your first property.</p>
                    </CardContent>
                  </Card>
                )}
                {(properties as Property[]).map((property) => {
                  const status = getOccupancyStatus(property.bedsTotal ?? 0, property.bedsAvailable ?? 0);
                  return (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedProperty(property)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{property.address}</h3>
                            <p className="text-sm text-gray-500">{property.city}, {property.state} {property.zip}</p>
                          </div>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          {[
                            { val: property.bedrooms ?? 0, label: 'Bedrooms' },
                            { val: property.bedsTotal ?? 0, label: 'Total Beds' },
                            { val: property.bedsAvailable ?? 0, label: 'Available', green: true },
                          ].map(({ val, label, green }) => (
                            <div key={label} className="text-center">
                              <p className={`text-lg font-semibold ${green ? 'text-green-600' : 'text-gray-900'}`}>{val}</p>
                              <p className="text-xs text-gray-500">{label}</p>
                            </div>
                          ))}
                        </div>
                        {property.amenities && property.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {property.amenities.slice(0, 4).map((a) => {
                              const Icon = amenityIcon(a);
                              return (
                                <Badge key={a} variant="outline" className="text-xs">
                                  <Icon className="w-3 h-3 mr-1" />{a}
                                </Badge>
                              );
                            })}
                            {property.amenities.length > 4 && (
                              <Badge variant="outline" className="text-xs">+{property.amenities.length - 4} more</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Property Detail Panel */}
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
                        <Button size="sm" variant="outline" onClick={() => setAddRoomOpen(true)}>
                          <Plus className="w-4 h-4 mr-1" /> Add Room
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="rooms">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="rooms" className="text-xs">Rooms ({propertyRooms.length})</TabsTrigger>
                          <TabsTrigger value="occupants" className="text-xs">Occupants</TabsTrigger>
                          <TabsTrigger value="rules" className="text-xs">Rules ({(houseRules as HouseRule[]).length})</TabsTrigger>
                          <TabsTrigger value="notices" className="text-xs">Notices ({(housingNotices as HousingNotice[]).length})</TabsTrigger>
                          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                        </TabsList>

                        <TabsContent value="rooms" className="mt-3 space-y-3">
                          {propertyRooms.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-6">No rooms yet. Click "Add Room" to configure.</p>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            {propertyRooms.map((room) => {
                              const occupants = room.occupants ?? [];
                              return (
                                <Card key={room.id} className="border">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium text-gray-900">{room.roomNumber}</h4>
                                      <Badge variant={occupants.length < (room.beds ?? 1) ? 'secondary' : 'outline'}>
                                        {occupants.length}/{room.beds ?? 1}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      {occupants.length > 0 ? (
                                        occupants.map((cId) => {
                                          const c = clientMap[cId];
                                          return (
                                            <div key={cId} className="flex items-center justify-between text-xs">
                                              <span className="text-gray-700 truncate flex-1">{c?.name ?? cId.slice(0, 8)}</span>
                                              <button
                                                className="text-red-400 hover:text-red-600 ml-1 shrink-0"
                                                onClick={() => assignBed.mutate({ roomId: room.id, clientId: cId, remove: true })}
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-xs text-gray-400 italic">Available</p>
                                      )}
                                    </div>
                                    {occupants.length < (room.beds ?? 1) && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="mt-2 h-6 text-xs w-full border border-dashed"
                                        onClick={() => setAssignOpen(room)}
                                      >
                                        <UserPlus className="w-3 h-3 mr-1" /> Assign
                                      </Button>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="occupants" className="mt-3">
                          {propertyRooms.every((r) => (r.occupants?.length ?? 0) === 0) && (
                            <p className="text-sm text-gray-400 text-center py-6">No occupants assigned yet.</p>
                          )}
                          {propertyRooms
                            .filter((r) => (r.occupants?.length ?? 0) > 0)
                            .map((room) => (
                              <div key={room.id} className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Room {room.roomNumber}</h4>
                                <div className="space-y-2">
                                  {(room.occupants ?? []).map((cId) => {
                                    const c = clientMap[cId];
                                    return (
                                      <div key={cId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-blue-700">
                                              {c?.name?.split(' ').map((n) => n[0]).join('') ?? '?'}
                                            </span>
                                          </div>
                                          <p className="text-sm font-medium text-gray-900">{c?.name ?? 'Unknown'}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {c?.profile?.onboardingStatus ?? 'active'}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </TabsContent>

                        {/* House Rules Tab */}
                        <TabsContent value="rules" className="mt-3 space-y-3">
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddRuleOpen(v => !v)}>
                              <Plus className="w-3 h-3 mr-1" /> Add Rule
                            </Button>
                          </div>
                          {addRuleOpen && (
                            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                              <Input placeholder="Rule title *" className="h-8 text-sm" value={ruleForm.title} onChange={e => setRuleForm(f => ({...f, title: e.target.value}))} />
                              <Textarea placeholder="Rule content *" className="text-sm min-h-[60px]" value={ruleForm.content} onChange={e => setRuleForm(f => ({...f, content: e.target.value}))} />
                              <Select value={ruleForm.category} onValueChange={v => setRuleForm(f => ({...f, category: v}))}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['general','safety','quiet_hours','visitors','chores'].map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-xs" onClick={() => createRule.mutate(ruleForm)} disabled={!ruleForm.title || !ruleForm.content || createRule.isPending}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddRuleOpen(false)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                          {(houseRules as HouseRule[]).length === 0 && !addRuleOpen && (
                            <p className="text-xs text-gray-400 text-center py-6">No house rules yet.</p>
                          )}
                          {(houseRules as HouseRule[]).map(rule => (
                            <div key={rule.id} className="flex items-start justify-between p-3 bg-white border rounded-lg gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm font-semibold truncate">{rule.title}</span>
                                  <Badge variant="secondary" className="text-xs capitalize">{rule.category.replace('_',' ')}</Badge>
                                </div>
                                <p className="text-xs text-gray-600 whitespace-pre-wrap">{rule.content}</p>
                              </div>
                              <button className="text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => deleteRule.mutate(rule.id)}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </TabsContent>

                        {/* Notices Tab */}
                        <TabsContent value="notices" className="mt-3 space-y-3">
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddNoticeOpen(v => !v)}>
                              <Bell className="w-3 h-3 mr-1" /> Post Notice
                            </Button>
                          </div>
                          {addNoticeOpen && (
                            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                              <Input placeholder="Notice title *" className="h-8 text-sm" value={noticeForm.title} onChange={e => setNoticeForm(f => ({...f, title: e.target.value}))} />
                              <Textarea placeholder="Notice content *" className="text-sm min-h-[60px]" value={noticeForm.content} onChange={e => setNoticeForm(f => ({...f, content: e.target.value}))} />
                              <Select value={noticeForm.priority} onValueChange={v => setNoticeForm(f => ({...f, priority: v}))}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['low','normal','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-xs" onClick={() => createNotice.mutate(noticeForm)} disabled={!noticeForm.title || !noticeForm.content || createNotice.isPending}>Post</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddNoticeOpen(false)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                          {(housingNotices as HousingNotice[]).length === 0 && !addNoticeOpen && (
                            <p className="text-xs text-gray-400 text-center py-6">No active notices.</p>
                          )}
                          {(housingNotices as HousingNotice[]).map(notice => (
                            <div key={notice.id} className={`flex items-start justify-between p-3 rounded-lg gap-3 border ${notice.priority === 'urgent' ? 'bg-red-50 border-red-200' : notice.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-sm font-semibold truncate">{notice.title}</span>
                                  {notice.priority !== 'normal' && (
                                    <Badge className={`text-xs capitalize ${notice.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                      {notice.priority}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700">{notice.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(notice.createdAt).toLocaleDateString()}</p>
                              </div>
                              <button className="text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => deleteNotice.mutate(notice.id)}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </TabsContent>

                        <TabsContent value="details" className="mt-3 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Property Info</h4>
                              <div className="space-y-2 text-sm">
                                {([
                                  ['Bedrooms', selectedProperty.bedrooms ?? 0],
                                  ['Total Beds', selectedProperty.bedsTotal ?? 0],
                                  ['Available Beds', selectedProperty.bedsAvailable ?? 0],
                                  ['Occupancy Limit', selectedProperty.occupancyLimit ?? '—'],
                                ] as [string, string | number][]).map(([label, val]) => (
                                  <div key={label} className="flex justify-between">
                                    <span className="text-gray-600">{label}:</span>
                                    <span className="font-medium">{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities</h4>
                              <div className="flex flex-wrap gap-1">
                                {(selectedProperty.amenities ?? []).map((a) => {
                                  const Icon = amenityIcon(a);
                                  return (
                                    <Badge key={a} variant="outline" className="text-xs">
                                      <Icon className="w-3 h-3 mr-1" />{a}
                                    </Badge>
                                  );
                                })}
                                {!selectedProperty.amenities?.length && (
                                  <p className="text-xs text-gray-400">None listed</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Occupancy</h4>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Current</span>
                              <span className="font-medium">
                                {(selectedProperty.bedsTotal ?? 0) - (selectedProperty.bedsAvailable ?? 0)}/{selectedProperty.bedsTotal ?? 0} beds
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(((selectedProperty.bedsTotal ?? 0) - (selectedProperty.bedsAvailable ?? 0)) / Math.max(selectedProperty.bedsTotal ?? 1, 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Added {new Date(selectedProperty.createdAt).toLocaleDateString()}
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
                      <p className="text-gray-500 text-sm">
                        Choose a property to view details, configure rooms, and manage occupants.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => {
          setIsAddPropertyModalOpen(false);
          qc.invalidateQueries({ queryKey: ['/api/properties'] });
        }}
      />

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room Number / Name</Label>
              <Input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 101A"
                onKeyDown={(e) => e.key === 'Enter' && roomNumber && createRoom.mutate()}
              />
            </div>
            <div>
              <Label>Number of Beds</Label>
              <Input type="number" min={1} max={10} value={roomBeds} onChange={(e) => setRoomBeds(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
              <Button onClick={() => createRoom.mutate()} disabled={!roomNumber || createRoom.isPending}>
                {createRoom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Room'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Client Dialog */}
      <Dialog
        open={!!assignOpen}
        onOpenChange={(o) => { if (!o) { setAssignOpen(null); setAssignClientId(''); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Bed — Room {assignOpen?.roomNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Select a client to assign to this room.</p>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-1">
              {unassignedClients.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors ${assignClientId === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-800'}`}
                  onClick={() => setAssignClientId(c.id)}
                >
                  {c.name}
                </button>
              ))}
              {unassignedClients.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">All clients are already assigned.</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setAssignOpen(null); setAssignClientId(''); }}>Cancel</Button>
              <Button
                disabled={!assignClientId || assignBed.isPending}
                onClick={() => assignBed.mutate({ roomId: assignOpen!.id, clientId: assignClientId })}
              >
                {assignBed.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
