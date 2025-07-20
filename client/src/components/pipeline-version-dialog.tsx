import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, GitBranch, FileText } from "lucide-react";

interface PipelineVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saveOption: 'existing' | 'new', versionNotes?: string) => void;
  pipelineName: string;
  currentVersion: number;
  hasChanges: boolean;
}

export default function PipelineVersionDialog({
  isOpen,
  onClose,
  onSave,
  pipelineName,
  currentVersion,
  hasChanges
}: PipelineVersionDialogProps) {
  const [saveOption, setSaveOption] = useState<'existing' | 'new'>('existing');
  const [versionNotes, setVersionNotes] = useState('');

  const handleSave = () => {
    onSave(saveOption, versionNotes);
    setVersionNotes('');
    onClose();
  };

  const handleCancel = () => {
    setSaveOption('existing');
    setVersionNotes('');
    onClose();
  };

  if (!hasChanges) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-600" />
            Save Pipeline Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{pipelineName}". Choose how you'd like to save them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup value={saveOption} onValueChange={(value) => setSaveOption(value as 'existing' | 'new')}>
            <div className="space-y-4">
              {/* Save to existing version */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="existing" id="existing" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="existing" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Update Current Version (v{currentVersion})
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overwrite the existing version with your changes. This will replace the current pipeline configuration.
                  </p>
                </div>
              </div>

              {/* Create new version */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="new" id="new" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="new" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                      <GitBranch className="h-4 w-4 text-green-600" />
                      Create New Version (v{currentVersion + 1})
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep the current version and create a new one with your changes. You'll be able to compare versions later.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* Version notes (shown for both options) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Version Notes {saveOption === 'new' ? '(Recommended)' : '(Optional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                saveOption === 'new'
                  ? "Describe what changed in this new version..."
                  : "Describe the changes you made..."
              }
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {saveOption === 'existing' ? 'Update Version' : 'Create New Version'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}