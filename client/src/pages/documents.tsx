import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FileIcon, UploadIcon, DownloadIcon, TrashIcon, FileTextIcon, ImageIcon, PenToolIcon, EditIcon } from 'lucide-react';
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Upload, view, and manage documents</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}