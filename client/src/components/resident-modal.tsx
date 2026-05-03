import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Resident {
  id: string;
  name: string;
  email: string;
  stage?: number | null;
  lastContact?: string | null;
  status?: string | null;
  moveInDate?: string | null;
  createdAt?: string;
  propertyAssignment?: string | null;
  employmentStatus?: string | null;
  profile?: any;
}

interface ResidentModalProps {
  resident: Resident;
  onClose: () => void;
}

export function ResidentModal({ resident, onClose }: ResidentModalProps) {
  const { data: residentDetails } = useQuery<any>({
    queryKey: ['/api/residents', resident.id],
    queryFn: () => apiRequest('GET', `/api/residents/${resident.id}`).then((r) => r.json()),
    enabled: !!resident.id,
  });

  const { data: caseNotes = [] } = useQuery<any[]>({
    queryKey: ['/api/staff-case-notes', resident.id],
    queryFn: () => apiRequest('GET', `/api/staff-case-notes?clientId=${resident.id}`).then((r) => r.json()),
    enabled: !!resident.id,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getStageColor = (stage: number) => {
    if (stage <= 2) return "bg-yellow-100 text-yellow-800";
    if (stage <= 4) return "bg-blue-100 text-blue-800"; 
    return "bg-green-100 text-green-800";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Progress": return "bg-green-100 text-green-800";
      case "Workshop": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Profile</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {getInitials(resident.name)}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{resident.name}</h4>
                  <Badge className={getStageColor(resident.stage ?? 1)}>
                    Stage {resident.stage ?? 1} - Housing Stabilization
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="text-gray-600 ml-2">{resident.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="text-gray-600 ml-2">{residentDetails?.phone || '(555) 123-4567'}</span>
                  </div>
                  {residentDetails?.profile?.moveInDate && (
                    <div>
                      <span className="font-medium text-gray-700">Move-in Date:</span>
                      <span className="text-gray-600 ml-2">
                        {new Date(residentDetails.profile.moveInDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {residentDetails?.profile?.propertyAssignment && (
                    <div>
                      <span className="font-medium text-gray-700">Property:</span>
                      <span className="text-gray-600 ml-2">{residentDetails.profile.propertyAssignment}</span>
                    </div>
                  )}
                  {residentDetails?.profile?.roomAssignment && (
                    <div>
                      <span className="font-medium text-gray-700">Room:</span>
                      <span className="text-gray-600 ml-2">{residentDetails.profile.roomAssignment}</span>
                    </div>
                  )}
                  {residentDetails?.profile?.isVeteran !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Veteran Status:</span>
                      <span className="text-gray-600 ml-2">{residentDetails.profile.isVeteran ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {residentDetails?.profile?.specialAccommodations && (
                    <div>
                      <span className="font-medium text-gray-700">Special Accommodations:</span>
                      <span className="text-gray-600 ml-2">{residentDetails.profile.specialAccommodations}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Case Manager:</span>
                    <span className="text-gray-600 ml-2">Sarah Martinez</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notes">Case Notes</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4 mt-4">
                {caseNotes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No case notes yet.</p>
                )}
                {(caseNotes as any[]).map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{note.title}</h5>
                          <p className="text-xs text-gray-500">
                            {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Badge className={getTypeColor(note.noteType)}>
                          {note.noteType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{note.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="text-center py-8">
                  <p className="text-gray-500">No service events recorded yet.</p>
                  <Button className="mt-2">Log Service Event</Button>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <div className="text-center py-8">
                  <p className="text-gray-500">No resources saved yet.</p>
                  <Button className="mt-2">Find Resources</Button>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                {residentDetails?.profile?.onboardingDocuments && residentDetails.profile.onboardingDocuments.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 mb-3">Onboarding Documents</h4>
                    {residentDetails.profile.onboardingDocuments.map((doc: any) => (
                      <Card key={doc.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{doc.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.createdAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No documents uploaded yet.</p>
                    <Button className="mt-2">Upload Document</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
