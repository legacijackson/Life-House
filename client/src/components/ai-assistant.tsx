import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Loader2, CheckCircle } from "lucide-react";

interface AIAssistantProps {
  residentId?: string;
}

export function AIAssistant({ residentId }: AIAssistantProps) {
  const [mode, setMode] = useState<"notes" | "resources" | "forms">("notes");
  const [bulletPoints, setBulletPoints] = useState("");
  const [noteType, setNoteType] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const draftNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/draft-note", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
    },
  });

  const handleDraftNote = () => {
    if (!residentId || !noteType || !bulletPoints.trim()) {
      return;
    }

    const points = bulletPoints
      .split('\n')
      .filter(point => point.trim())
      .map(point => point.replace(/^[-*•]\s*/, '').trim());

    draftNoteMutation.mutate({
      residentId,
      noteType,
      bulletPoints: points,
    });
  };

  const handleApproveNote = () => {
    // In a real implementation, this would save the note to the database
    setGeneratedContent(null);
    setBulletPoints("");
    setNoteType("");
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>AI Notes Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Assistant Mode
          </label>
          <Select value={mode} onValueChange={(value: any) => setMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notes">Draft Case Notes</SelectItem>
              <SelectItem value="resources">Resource Recommendations</SelectItem>
              <SelectItem value="forms">Form Helper</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "notes" && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Note Type
              </label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOP_progress">STOP Progress Note</SelectItem>
                  <SelectItem value="ECM_encounter">ECM Encounter</SelectItem>
                  <SelectItem value="Workshop">Workshop Attendance</SelectItem>
                  <SelectItem value="Coaching">Coaching Session</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Key Points (one per line)
              </label>
              <Textarea
                placeholder="• What happened during the session&#10;• Goals addressed&#10;• Progress observed&#10;• Next steps planned"
                value={bulletPoints}
                onChange={(e) => setBulletPoints(e.target.value)}
                rows={6}
              />
            </div>

            <Button 
              onClick={handleDraftNote}
              disabled={!residentId || !noteType || !bulletPoints.trim() || draftNoteMutation.isPending}
              className="w-full"
            >
              {draftNoteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Note Draft
            </Button>
          </>
        )}

        {/* Generated Content */}
        {generatedContent && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  AI Generated - Requires Review
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Draft Note:</h4>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    {generatedContent.noteText}
                  </div>
                </div>

                {generatedContent.rationale && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Rationale:</h4>
                    <div className="bg-white p-3 rounded border text-sm text-gray-600 italic">
                      {generatedContent.rationale}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" onClick={handleApproveNote}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve & Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setGeneratedContent(null)}
                  >
                    Edit More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p>⚠️ AI-generated content requires human review before saving. All AI interactions are logged for quality assurance.</p>
        </div>
      </CardContent>
    </Card>
  );
}
