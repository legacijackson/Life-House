import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileIcon, UploadIcon, DownloadIcon, TrashIcon, FileTextIcon, ImageIcon, PenToolIcon, EditIcon, Send, FileSignature, History, Inbox, Link, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { SignatureCanvas } from '@/components/signature-canvas';
import { DocumentEditor } from '@/components/document-editor';

interface Document {
  id: string;
  ownerType: string;
  ownerId: string;
  title: string;
  mime: string;
  size: number | null;
  storagePath: string;
  uploadedAt: string | null;
  checksum: string | null;
}

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [ownerType, setOwnerType] = useState('org');
  const [ownerId, setOwnerId] = useState('default');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [faxDoc, setFaxDoc] = useState<Document | null>(null);
  const [faxTo, setFaxTo] = useState('');
  const [signDoc, setSignDoc] = useState<Document | null>(null);
  const [signEmail, setSignEmail] = useState('');
  const [signName, setSignName] = useState('');

  const [linkFaxId, setLinkFaxId] = useState<string | null>(null);
  const [linkClientId, setLinkClientId] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Fetch fax history (sent)
  const { data: faxHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/fax'],
    queryFn: () => apiRequest('GET', '/api/fax').then((r) => r.json()),
  });

  // Fetch received faxes
  const { data: receivedFaxes = [] } = useQuery<any[]>({
    queryKey: ['/api/fax/received'],
    queryFn: () => apiRequest('GET', '/api/fax/received').then((r) => r.json()),
    refetchInterval: 30000,
  });

  // Fetch signature requests
  const { data: signatureRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/signature-requests'],
    queryFn: () => apiRequest('GET', '/api/signature-requests').then((r) => r.json()),
    refetchInterval: 30000,
  });

  // Fetch clients for link dialog
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then((r) => r.json()),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/documents', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentTitle('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/documents/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const sendFaxMutation = useMutation({
    mutationFn: async ({ doc, to }: { doc: Document; to: string }) => {
      const mediaUrl = `/api/documents/${doc.id}/download`;
      return apiRequest('POST', '/api/fax/send', { to, mediaUrl, docId: doc.id });
    },
    onSuccess: () => {
      setFaxDoc(null);
      setFaxTo('');
      toast({ title: 'Fax queued', description: 'The document has been queued for faxing.' });
    },
    onError: (err: any) => toast({ title: 'Fax failed', description: err.message, variant: 'destructive' }),
  });

  const linkFaxClientMutation = useMutation({
    mutationFn: async ({ faxId, clientId }: { faxId: string; clientId: string }) =>
      apiRequest('PATCH', `/api/fax/${faxId}/link-client`, { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fax/received'] });
      setLinkFaxId(null);
      setLinkClientId('');
      toast({ title: 'Linked', description: 'Fax linked to client record.' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const sendSignMutation = useMutation({
    mutationFn: async ({ doc, email, name }: { doc: Document; email: string; name: string }) => {
      return apiRequest('POST', '/api/docuseal/submissions', {
        templateType: 'medical_release',
        submitters: [{ email, name, send_email: true }],
      });
    },
    onSuccess: () => {
      setSignDoc(null);
      setSignEmail('');
      setSignName('');
      toast({ title: 'Signature request sent', description: 'The signer will receive an email.' });
    },
    onError: (err: any) => toast({ title: 'eSign failed', description: err.message, variant: 'destructive' }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!documentTitle) {
        setDocumentTitle(e.target.files[0].name);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentTitle) {
      toast({
        title: "Error",
        description: "Please select a file and provide a title",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', documentTitle);
    formData.append('ownerType', ownerType);
    formData.append('ownerId', ownerId);

    uploadMutation.mutate(formData);
  };

  const handleDownload = (document: Document) => {
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  const handleCreateDocument = async () => {
    if (!newDocumentTitle || !documentContent) {
      toast({
        title: "Error",
        description: "Please provide a title and content for the document",
        variant: "destructive",
      });
      return;
    }

    // Convert HTML content to file
    const blob = new Blob([documentContent], { type: 'text/html' });
    const file = new File([blob], `${newDocumentTitle}.html`, { type: 'text/html' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', newDocumentTitle);
    formData.append('ownerType', ownerType);
    formData.append('ownerId', ownerId);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setNewDocumentTitle('');
        setDocumentContent('');
      },
    });
  };

  const handleSignatureSave = async (signature: string) => {
    if (!selectedDocument) return;

    // Convert signature to file
    const response = await fetch(signature);
    const blob = await response.blob();
    const file = new File([blob], `signature-${selectedDocument.id}.png`, { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `Signature for ${selectedDocument.title}`);
    formData.append('ownerType', selectedDocument.ownerType);
    formData.append('ownerId', selectedDocument.ownerId);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setSignatureDialogOpen(false);
        setSelectedDocument(null);
      },
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileTextIcon className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div>Loading documents...</div>;
  }

  const getFaxStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'queued': case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSignStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSignStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Upload, view, and manage documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents">
            <TabsList className="mb-4 flex flex-wrap gap-1">
              <TabsTrigger value="documents">
                <FileIcon className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="received-faxes">
                <Inbox className="w-4 h-4 mr-2" />
                Received Faxes {receivedFaxes.length > 0 && `(${receivedFaxes.length})`}
              </TabsTrigger>
              <TabsTrigger value="esign-requests">
                <FileSignature className="w-4 h-4 mr-2" />
                eSign Requests {signatureRequests.length > 0 && `(${signatureRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="fax-history">
                <History className="w-4 h-4 mr-2" />
                Sent Faxes {faxHistory.length > 0 && `(${faxHistory.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Received Faxes Tab */}
            <TabsContent value="received-faxes">
              {/* Link-client dialog */}
              <Dialog open={!!linkFaxId} onOpenChange={(o) => { if (!o) { setLinkFaxId(null); setLinkClientId(''); } }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Fax to Client</DialogTitle>
                    <DialogDescription>Associate this received fax with a client record.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label>Select Client</Label>
                    <Select value={linkClientId} onValueChange={setLinkClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a client…" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name || `${c.firstName} ${c.lastName}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setLinkFaxId(null); setLinkClientId(''); }}>Cancel</Button>
                    <Button
                      disabled={!linkClientId || linkFaxClientMutation.isPending}
                      onClick={() => linkFaxId && linkFaxClientMutation.mutate({ faxId: linkFaxId, clientId: linkClientId })}
                    >
                      {linkFaxClientMutation.isPending ? 'Linking…' : 'Link to Client'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedFaxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No received faxes yet.
                      </TableCell>
                    </TableRow>
                  ) : receivedFaxes.map((fax: any) => (
                    <TableRow key={fax.id}>
                      <TableCell className="font-medium">{fax.fromNumber ?? '—'}</TableCell>
                      <TableCell>{fax.pages ?? '—'}</TableCell>
                      <TableCell>
                        {fax.clientName ? (
                          <span className="text-sm font-medium">{fax.clientName}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unlinked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {fax.receivedAt ? format(new Date(fax.receivedAt), 'MMM d, yyyy h:mm a') :
                         fax.createdAt ? format(new Date(fax.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                      </TableCell>
                      <TableCell>
                        {fax.driveUrl ? (
                          <Badge className="bg-blue-100 text-blue-800">Drive + Spaces</Badge>
                        ) : fax.spacesKey ? (
                          <Badge className="bg-green-100 text-green-800">Spaces</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {fax.presignedUrl && (
                          <Button variant="ghost" size="sm" title="View PDF" onClick={() => window.open(fax.presignedUrl, '_blank')}>
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {fax.driveUrl && (
                          <Button variant="ghost" size="sm" title="Open in Drive" onClick={() => window.open(fax.driveUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Link to Client" onClick={() => setLinkFaxId(fax.id)}>
                          <Link className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* eSign Requests Tab */}
            <TabsContent value="esign-requests">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatureRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No eSign requests yet.
                      </TableCell>
                    </TableRow>
                  ) : signatureRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.templateName || req.templateType}
                      </TableCell>
                      <TableCell className="text-sm">
                        {req.clientName ?? <span className="text-gray-400 italic">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getSignStatusIcon(req.status)}
                          <Badge className={getSignStatusColor(req.status)}>{req.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {req.createdAt ? format(new Date(req.createdAt), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {req.signedAt ? format(new Date(req.signedAt), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        {req.driveUrl ? (
                          <Badge className="bg-blue-100 text-blue-800">Drive + Spaces</Badge>
                        ) : req.signedPdfUrl ? (
                          <Badge className="bg-green-100 text-green-800">Spaces</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {req.signedPdfUrl && (
                          <Button variant="ghost" size="sm" title="View Signed PDF" onClick={() => window.open(req.signedPdfUrl, '_blank')}>
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {req.driveUrl && (
                          <Button variant="ghost" size="sm" title="Open in Drive" onClick={() => window.open(req.driveUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {req.docusealSubmitterSlug && req.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Copy Signing Link"
                            onClick={() => {
                              const url = `${window.location.origin}/sign/${req.docusealSubmitterSlug}`;
                              navigator.clipboard.writeText(url);
                              toast({ title: 'Copied', description: 'Signing link copied to clipboard.' });
                            }}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Sent Faxes Tab */}
            <TabsContent value="fax-history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faxHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No faxes sent yet.
                      </TableCell>
                    </TableRow>
                  ) : faxHistory.map((fax: any) => (
                    <TableRow key={fax.id}>
                      <TableCell className="font-medium">{fax.documentId ?? '—'}</TableCell>
                      <TableCell>{fax.toNumber}</TableCell>
                      <TableCell>
                        <Badge className={getFaxStatusColor(fax.status)}>{fax.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {fax.createdAt ? format(new Date(fax.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="documents">
          <div className="mb-4 flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a file and provide a title for the document
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="Enter document title"
                    />
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <EditIcon className="mr-2 h-4 w-4" />
                  Create Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>
                    Create a new document using the rich text editor
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="doc-title">Document Title</Label>
                    <Input
                      id="doc-title"
                      value={newDocumentTitle}
                      onChange={(e) => setNewDocumentTitle(e.target.value)}
                      placeholder="Enter document title"
                    />
                  </div>
                  <DocumentEditor
                    content={documentContent}
                    onChange={setDocumentContent}
                    title="Document Content"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDocument}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? 'Creating...' : 'Create Document'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <SignatureCanvas
            open={signatureDialogOpen}
            onOpenChange={setSignatureDialogOpen}
            onSave={handleSignatureSave}
          />

          {/* Fax Send Dialog */}
          <Dialog open={!!faxDoc} onOpenChange={(o) => { if (!o) { setFaxDoc(null); setFaxTo(''); } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send via Fax</DialogTitle>
                <DialogDescription>
                  Enter the destination fax number to send "{faxDoc?.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fax-to">Fax Number</Label>
                  <Input
                    id="fax-to"
                    value={faxTo}
                    onChange={(e) => setFaxTo(e.target.value)}
                    placeholder="+15550001234"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setFaxDoc(null); setFaxTo(''); }}>Cancel</Button>
                <Button
                  disabled={!faxTo.trim() || sendFaxMutation.isPending}
                  onClick={() => faxDoc && sendFaxMutation.mutate({ doc: faxDoc, to: faxTo.trim() })}
                >
                  {sendFaxMutation.isPending ? 'Sending…' : 'Send Fax'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* eSign Request Dialog */}
          <Dialog open={!!signDoc} onOpenChange={(o) => { if (!o) { setSignDoc(null); setSignEmail(''); setSignName(''); } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request eSignature</DialogTitle>
                <DialogDescription>
                  Send a signature request for "{signDoc?.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sign-name">Signer Name</Label>
                  <Input
                    id="sign-name"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sign-email">Signer Email</Label>
                  <Input
                    id="sign-email"
                    type="email"
                    value={signEmail}
                    onChange={(e) => setSignEmail(e.target.value)}
                    placeholder="signer@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSignDoc(null); setSignEmail(''); setSignName(''); }}>Cancel</Button>
                <Button
                  disabled={!signEmail.trim() || !signName.trim() || sendSignMutation.isPending}
                  onClick={() => signDoc && sendSignMutation.mutate({ doc: signDoc, email: signEmail.trim(), name: signName.trim() })}
                >
                  {sendSignMutation.isPending ? 'Sending…' : 'Send Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No documents found. Upload your first document to get started.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.mime)}
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>{doc.mime}</TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setSignatureDialogOpen(true);
                        }}
                        title="Add Signature"
                      >
                        <PenToolIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFaxDoc(doc)}
                        title="Send via Fax"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSignDoc(doc)}
                        title="Request eSignature"
                      >
                        <FileSignature className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}