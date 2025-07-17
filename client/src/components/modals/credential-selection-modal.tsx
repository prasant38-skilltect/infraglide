import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Credential } from "@shared/schema";

interface CredentialSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (credential: Credential) => void;
  credentials: Credential[];
  provider: string;
}

export default function CredentialSelectionModal({
  open,
  onClose,
  onSelect,
  credentials,
  provider,
}: CredentialSelectionModalProps) {
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");

  const handleSelect = () => {
    const selectedCredential = credentials.find(
      (cred) => cred.id.toString() === selectedCredentialId
    );
    if (selectedCredential) {
      onSelect(selectedCredential);
    }
  };

  const handleClose = () => {
    setSelectedCredentialId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Please select credential for pipeline</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credential-select">
              Select {provider} Credential
            </Label>
            <Select value={selectedCredentialId} onValueChange={setSelectedCredentialId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a credential..." />
              </SelectTrigger>
              <SelectContent>
                {credentials.map((credential) => (
                  <SelectItem key={credential.id} value={credential.id.toString()}>
                    {credential.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={!selectedCredentialId}
          >
            Use Credential
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}