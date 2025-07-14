import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Rocket } from "lucide-react";

interface DeployPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (deploymentData: any) => void;
  pipelineId: number | null;
}

export default function DeployPipelineModal({
  isOpen,
  onClose,
  onDeploy,
  pipelineId,
}: DeployPipelineModalProps) {
  const [environment, setEnvironment] = useState("development");
  const [notes, setNotes] = useState("");
  const [validateConfig, setValidateConfig] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleDeploy = () => {
    onDeploy({
      environment,
      notes,
      validateConfig,
      dryRun,
      notifications,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deploy Pipeline</DialogTitle>
        </DialogHeader>
        
        <div className="mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Info className="text-blue-500 w-5 h-5 mr-2" />
                <span className="text-sm font-medium text-blue-800">Deployment Summary</span>
              </div>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>Region: us-east-1</p>
                <p>Components: 4 (VPC, EC2, RDS, S3)</p>
                <p>Estimated cost: $127.43/month</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Environment</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Deployment Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any deployment notes..."
              className="mt-1"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="validate"
                checked={validateConfig}
                onCheckedChange={(checked) => setValidateConfig(checked as boolean)}
              />
              <Label htmlFor="validate" className="text-sm text-gray-700">
                Validate configuration before deployment
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryrun"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked as boolean)}
              />
              <Label htmlFor="dryrun" className="text-sm text-gray-700">
                Perform dry run first
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifications"
                checked={notifications}
                onCheckedChange={(checked) => setNotifications(checked as boolean)}
              />
              <Label htmlFor="notifications" className="text-sm text-gray-700">
                Send deployment notifications
              </Label>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleDeploy} className="flex-1">
            <Rocket className="w-4 h-4 mr-2" />
            Start Deployment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
