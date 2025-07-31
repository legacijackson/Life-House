import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  Settings, 
  FileText,
  Upload,
  Image,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HomepagePhoto {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  section: 'hero' | 'testimonials' | 'programs' | 'gallery';
  order: number;
  isActive: boolean;
  uploadedAt: string;
}

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'general' | 'integrations' | 'notifications' | 'security';
  updatedAt: string;
}

interface HomepageContent {
  id: string;
  section: string;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorName: string;
  timestamp: string;
  ip?: string;
  details?: any;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedPhoto, setSelectedPhoto] = useState<HomepagePhoto | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<HomepageContent | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, any>>({});

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeTab === 'users'
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/admin/properties'],
    enabled: activeTab === 'properties'
  });

  const { data: homepagePhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['/api/admin/homepage-photos'],
    enabled: activeTab === 'settings'
  });

  const { data: systemSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: activeTab === 'settings'
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    enabled: activeTab === 'logs'
  });

  const { data: homepageContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/admin/homepage-content'],
    enabled: activeTab === 'content'
  });

  // Photo management mutations
  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/admin/homepage-photos', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomepagePhoto> }) => {
      return apiRequest('PATCH', `/api/admin/homepage-photos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo updated successfully" });
      setIsPhotoModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update photo", variant: "destructive" });
    }
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/homepage-photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    }
  });

  // Settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SystemSetting> }) => {
      return apiRequest('PATCH', `/api/admin/settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: "Setting updated successfully" });
      setIsSettingModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    }
  });

  // Homepage content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: Partial<HomepageContent> }) => {
      return apiRequest('PUT', `/api/admin/homepage-content/${section}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-content'] });
      toast({ title: "Homepage content updated successfully" });
      setIsContentModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update homepage content", variant: "destructive" });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('section', 'gallery'); // Default section
    formData.append('alt', file.name.replace(/\.[^/.]+$/, ""));

    uploadPhotoMutation.mutate(formData);
  };

  const handlePhotoEdit = (photo: HomepagePhoto) => {
    setSelectedPhoto(photo);
    setIsPhotoModalOpen(true);
  };

  const handleSettingEdit = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setIsSettingModalOpen(true);
  };

  const handleContentEdit = (content: HomepageContent) => {
    setSelectedContent(content);
    setEditingContent({
      title: content.title || '',
      subtitle: content.subtitle || '',
      content: content.content || '',
      buttonText: content.buttonText || '',
      buttonUrl: content.buttonUrl || ''
    });
    setIsContentModalOpen(true);
  };

  const handleContentSave = () => {
    if (!selectedContent) return;
    
    updateContentMutation.mutate({
      section: selectedContent.section,
      data: editingContent
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Centralized administration for Life House management system
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Homepage
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                        </div>
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Property Management</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property: any) => (
                    <Card key={property.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{property.address}</h3>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}, {property.state} {property.zip}
                          </div>
                          <div>Beds: {property.bedsAvailable}/{property.bedsTotal}</div>
                          <div>Occupancy: {property.occupancyLimit}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Homepage Photo Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Homepage Photo Management</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button asChild>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {homepagePhotos.map((photo: HomepagePhoto) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePhotoEdit(photo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhotoMutation.mutate(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Badge variant={photo.isActive ? 'default' : 'secondary'} className="text-xs">
                          {photo.section}
                        </Badge>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {photo.alt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {systemSettings.map((setting: SystemSetting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{setting.key}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{setting.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {setting.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {setting.value.length > 30 ? setting.value.substring(0, 30) + '...' : setting.value}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettingEdit(setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Homepage Content Management</span>
                <Badge variant="secondary">Live Content</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Default content sections if none exist */}
                  {homepageContent.length === 0 && (
                    <div className="grid gap-4">
                      {['hero', 'about', 'programs', 'impact', 'cta'].map(section => (
                        <Card key={section} className="border-2 border-dashed border-gray-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold capitalize">{section} Section</h3>
                                <p className="text-sm text-gray-600">Click to add content for this section</p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => handleContentEdit({
                                  id: '',
                                  section,
                                  title: '',
                                  subtitle: '',
                                  content: '',
                                  buttonText: '',
                                  buttonUrl: '',
                                  isActive: true,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Content
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Existing content sections */}
                  {homepageContent.map((content: HomepageContent) => (
                    <Card key={content.id} className="border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold capitalize">{content.section} Section</h3>
                              {content.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                            </div>
                            {content.title && (
                              <p className="font-medium text-gray-900 dark:text-white mb-1">{content.title}</p>
                            )}
                            {content.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{content.subtitle}</p>
                            )}
                            {content.content && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{content.content}</p>
                            )}
                            {content.buttonText && (
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline">{content.buttonText}</Badge>
                                {content.buttonUrl && (
                                  <span className="text-xs text-gray-400">→ {content.buttonUrl}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentEdit(content)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
                          <span>Last updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
                          {content.lastUpdatedBy && <span>by User {content.lastUpdatedBy.slice(0, 8)}...</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log: AuditLogEntry) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-4">
                        <Badge variant={
                          log.action.includes('delete') ? 'destructive' :
                          log.action.includes('create') ? 'default' :
                          'secondary'
                        }>
                          {log.action}
                        </Badge>
                        <div>
                          <span className="font-medium">{log.entity}</span>
                          <span className="text-gray-600 dark:text-gray-300 ml-2">by {log.actorName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Edit Modal */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={selectedPhoto.alt}
                    onChange={(e) => setSelectedPhoto({...selectedPhoto, alt: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={selectedPhoto.section}
                    onValueChange={(value: any) => setSelectedPhoto({...selectedPhoto, section: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="testimonials">Testimonials</SelectItem>
                      <SelectItem value="programs">Programs</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={selectedPhoto.caption || ''}
                  onChange={(e) => setSelectedPhoto({...selectedPhoto, caption: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePhotoMutation.mutate({
                    id: selectedPhoto.id,
                    data: {
                      alt: selectedPhoto.alt,
                      section: selectedPhoto.section,
                      caption: selectedPhoto.caption
                    }
                  })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Setting Edit Modal */}
      <Dialog open={isSettingModalOpen} onOpenChange={setIsSettingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
          </DialogHeader>
          {selectedSetting && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="setting-value">Value</Label>
                <Textarea
                  id="setting-value"
                  value={selectedSetting.value}
                  onChange={(e) => setSelectedSetting({...selectedSetting, value: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSettingModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateSettingMutation.mutate({
                    id: selectedSetting.id,
                    data: { value: selectedSetting.value }
                  })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Homepage Content Edit Modal */}
      <Dialog open={isContentModalOpen} onOpenChange={setIsContentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {selectedContent?.section} Section</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-title">Title</Label>
                  <Input
                    id="content-title"
                    value={editingContent.title || ''}
                    onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label htmlFor="content-subtitle">Subtitle</Label>
                  <Input
                    id="content-subtitle"
                    value={editingContent.subtitle || ''}
                    onChange={(e) => setEditingContent({...editingContent, subtitle: e.target.value})}
                    placeholder="Section subtitle"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content-main">Main Content</Label>
                <Textarea
                  id="content-main"
                  value={editingContent.content || ''}
                  onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                  placeholder="Main content text"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-button-text">Button Text</Label>
                  <Input
                    id="content-button-text"
                    value={editingContent.buttonText || ''}
                    onChange={(e) => setEditingContent({...editingContent, buttonText: e.target.value})}
                    placeholder="Button text (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="content-button-url">Button URL</Label>
                  <Input
                    id="content-button-url"
                    value={editingContent.buttonUrl || ''}
                    onChange={(e) => setEditingContent({...editingContent, buttonUrl: e.target.value})}
                    placeholder="Button link (optional)"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="space-y-2">
                  {editingContent.title && (
                    <h3 className="text-lg font-semibold">{editingContent.title}</h3>
                  )}
                  {editingContent.subtitle && (
                    <p className="text-gray-600 dark:text-gray-300">{editingContent.subtitle}</p>
                  )}
                  {editingContent.content && (
                    <p className="text-sm">{editingContent.content}</p>
                  )}
                  {editingContent.buttonText && (
                    <Button variant="outline" size="sm" className="pointer-events-none">
                      {editingContent.buttonText}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsContentModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleContentSave}
                  disabled={updateContentMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateContentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}