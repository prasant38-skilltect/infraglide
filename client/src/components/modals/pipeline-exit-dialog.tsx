import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, GitBranch, FileText, AlertTriangle } from "lucide-react";

interface PipelineExitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saveOption: 'existing' | 'new', versionNotes?: string) => Promise<void>;
  onDiscard: () => void;
  pipelineName: string;
  currentVersion: number;
  hasUnsavedChanges: boolean;
  isExisting: boolean; // true if pipeline exists, false for new pipeline
}

export default function PipelineExitDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  pipelineName,
  currentVersion,
  hasUnsavedChanges,
  isExisting
}: PipelineExitDialogProps) {
  const [saveOption, setSaveOption] = useState<'existing' | 'new'>('existing');
  const [versionNotes, setVersionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(saveOption, versionNotes);
      setVersionNotes('');
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setVersionNotes('');
    onDiscard();
    onClose();
  };

  if (!hasUnsavedChanges) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{pipelineName}". What would you like to do before leaving?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isExisting ? (
            <RadioGroup value={saveOption} onValueChange={(value) => setSaveOption(value as 'existing' | 'new')}>
              <div className="space-y-4">
                {/* Save to existing version */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="existing" id="existing" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="existing" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Save className="h-4 w-4 text-blue-600" />
                        Update Current Version (v{currentVersion})
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Overwrite the existing version with your changes. This will replace the current pipeline configuration.
                    </p>
                  </div>
                </div>

                {/* Create new version */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="new" id="new" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="new" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <GitBranch className="h-4 w-4 text-green-600" />
                        Create New Version (v{currentVersion + 1})
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keep the current version intact and create a new version with your changes.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          ) : (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 font-medium text-blue-900">
                <Save className="h-4 w-4" />
                Save New Pipeline
              </div>
              <p className="text-sm text-blue-700 mt-1">
                This will create a new pipeline with your current changes.
              </p>
            </div>
          )}

          {/* Version notes - only show for new versions or new pipelines */}
          {(!isExisting || saveOption === 'new') && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Version Notes (Optional)
              </Label>
              <Textarea
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder={isExisting ? "Describe what changed in this version..." : "Describe this pipeline..."}
                rows={3}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={handleDiscard}
            className="flex-1"
          >
            Discard Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}