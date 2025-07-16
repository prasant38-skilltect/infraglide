import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface VersionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineName: string;
  latestVersion: number;
  nextVersion: number;
  onEditName: () => void;
  onSaveNewVersion: () => void;
}

export default function VersionConflictModal({
  isOpen,
  onClose,
  pipelineName,
  latestVersion,
  nextVersion,
  onEditName,
  onSaveNewVersion,
}: VersionConflictModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Pipeline Name Already Exists</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              The pipeline name <strong>"{pipelineName}"</strong> already exists 
              with version <strong>{latestVersion}</strong>.
            </p>
            <p>
              Please enter a unique pipeline name or save this as a new version.
            </p>
            <p>
              The next version would be <strong>version {nextVersion}</strong>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={() => {
              onEditName();
              onClose();
            }}
          >
            Edit Name
          </Button>
          <AlertDialogAction
            onClick={() => {
              onSaveNewVersion();
              onClose();
            }}
          >
            Save New Version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}