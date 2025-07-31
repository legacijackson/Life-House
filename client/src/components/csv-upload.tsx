import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

interface UploadResult {
  fileName: string;
  status: 'success' | 'error';
  resourcesProcessed?: number;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  results: UploadResult[];
  summary: {
    filesUploaded: number;
    filesSuccessful: number;
    filesWithErrors: number;
    totalResourcesProcessed: number;
  };
}

export function CSVUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]): Promise<UploadResponse> => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('csvFiles', file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Complete",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      
      // Clear selected files on success
      if (data.success) {
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
      // Refresh resources data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const csvFiles = files.filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    
    if (csvFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Only CSV files are allowed",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(csvFiles);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const csvFiles = files.filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    
    if (csvFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Only CSV files are allowed",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(csvFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select CSV files to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(selectedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Community Resources
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload CSV files containing community resources. Multiple files can be processed at once.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drop CSV files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum file size: 10MB per file
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploadMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing files...</span>
              <span className="text-xs text-muted-foreground">Please wait</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadMutation.data && (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.data.message}
              </AlertDescription>
            </Alert>
            
            {uploadMutation.data.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Processing Results</h4>
                {uploadMutation.data.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">{result.fileName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.status === 'success' ? (
                        <Badge variant="outline" className="text-green-600">
                          {result.resourcesProcessed} resources
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>Processing {selectedFiles.length} files...</>
          ) : (
            <>Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}CSV Files</>
          )}
        </Button>

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            CSV files will be processed using AI to clean and categorize resource data. 
            This may take a few moments depending on file size and content.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}