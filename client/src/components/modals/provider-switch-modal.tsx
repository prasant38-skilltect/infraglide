import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ProviderSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetProvider: string;
}

export default function ProviderSwitchModal({
  isOpen,
  onClose,
  onConfirm,
  targetProvider,
}: ProviderSwitchModalProps) {
  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case "aws":
        return "AWS";
      case "azure":
        return "Azure";
      case "gcp":
        return "GCP";
      default:
        return provider.toUpperCase();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Switch Provider?
          </DialogTitle>
          <DialogDescription>
            You are trying to switch the provider. Current changes will not be saved after switch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Warning: Unsaved Changes</p>
                <p className="mt-1">
                  Switching to {getProviderDisplayName(targetProvider)} will clear your current canvas. 
                  Make sure to save your pipeline before switching if you want to keep your work.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
            >
              Switch to {getProviderDisplayName(targetProvider)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}