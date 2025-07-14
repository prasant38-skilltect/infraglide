import * as React from "react";
import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { Node } from "reactflow";

interface PropertiesPanelProps {
  node: Node;
  onUpdateConfig: (nodeId: string, config: any) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ node, onUpdateConfig, onClose }: PropertiesPanelProps) {
  const [config, setConfig] = useState(node.data.config || {});

  useEffect(() => {
    setConfig(node.data.config || {});
  }, [node]);

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdateConfig(node.id, newConfig);
  };

  const renderEC2Config = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Configuration</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">Instance Name</Label>
            <Input
              value={config.instanceName || ""}
              onChange={(e) => updateConfig("instanceName", e.target.value)}
              placeholder="web-server-01"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Instance Type</Label>
            <Select
              value={config.instanceType || "t3.micro"}
              onValueChange={(value) => updateConfig("instanceType", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="t3.micro">t3.micro</SelectItem>
                <SelectItem value="t3.small">t3.small</SelectItem>
                <SelectItem value="t3.medium">t3.medium</SelectItem>
                <SelectItem value="t3.large">t3.large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">AMI ID</Label>
            <Input
              value={config.amiId || ""}
              onChange={(e) => updateConfig("amiId", e.target.value)}
              placeholder="ami-0abcdef1234567890"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Security</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">Security Group</Label>
            <Select
              value={config.securityGroup || ""}
              onValueChange={(value) => updateConfig("securityGroup", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select security group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sg-web-server">sg-web-server</SelectItem>
                <SelectItem value="sg-default">sg-default</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Key Pair</Label>
            <Select
              value={config.keyPair || ""}
              onValueChange={(value) => updateConfig("keyPair", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select key pair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my-key-pair">my-key-pair</SelectItem>
                <SelectItem value="production-keys">production-keys</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monitoring"
              checked={config.monitoring || false}
              onCheckedChange={(checked) => updateConfig("monitoring", checked)}
            />
            <Label htmlFor="monitoring" className="text-sm text-gray-700">
              Enable detailed monitoring
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoScaling"
              checked={config.autoScaling || false}
              onCheckedChange={(checked) => updateConfig("autoScaling", checked)}
            />
            <Label htmlFor="autoScaling" className="text-sm text-gray-700">
              Enable auto scaling
            </Label>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">User Data Script</Label>
            <Textarea
              value={config.userData || ""}
              onChange={(e) => updateConfig("userData", e.target.value)}
              placeholder="#!/bin/bash"
              rows={4}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderS3Config = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Configuration</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">Bucket Name</Label>
            <Input
              value={config.bucketName || ""}
              onChange={(e) => updateConfig("bucketName", e.target.value)}
              placeholder="my-bucket-name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Storage Class</Label>
            <Select
              value={config.storageClass || "STANDARD"}
              onValueChange={(value) => updateConfig("storageClass", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="STANDARD_IA">Standard-IA</SelectItem>
                <SelectItem value="GLACIER">Glacier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="versioning"
              checked={config.versioning || false}
              onCheckedChange={(checked) => updateConfig("versioning", checked)}
            />
            <Label htmlFor="versioning" className="text-sm text-gray-700">
              Enable versioning
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="publicRead"
              checked={config.publicRead || false}
              onCheckedChange={(checked) => updateConfig("publicRead", checked)}
            />
            <Label htmlFor="publicRead" className="text-sm text-gray-700">
              Public read access
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRDSConfig = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Configuration</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">DB Instance Identifier</Label>
            <Input
              value={config.dbIdentifier || ""}
              onChange={(e) => updateConfig("dbIdentifier", e.target.value)}
              placeholder="my-database"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Engine</Label>
            <Select
              value={config.engine || "postgres"}
              onValueChange={(value) => updateConfig("engine", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="oracle">Oracle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Instance Class</Label>
            <Select
              value={config.instanceClass || "db.t3.micro"}
              onValueChange={(value) => updateConfig("instanceClass", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="db.t3.micro">db.t3.micro</SelectItem>
                <SelectItem value="db.t3.small">db.t3.small</SelectItem>
                <SelectItem value="db.t3.medium">db.t3.medium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Allocated Storage (GB)</Label>
            <Input
              type="number"
              value={config.allocatedStorage || "20"}
              onChange={(e) => updateConfig("allocatedStorage", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaultConfig = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Configuration</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">Resource Name</Label>
            <Input
              value={config.name || node.data.name}
              onChange={(e) => updateConfig("name", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfigForm = () => {
    switch (node.data.type) {
      case "ec2":
        return renderEC2Config();
      case "s3":
        return renderS3Config();
      case "rds":
        return renderRDSConfig();
      default:
        return renderDefaultConfig();
    }
  };

  const isConfigurationValid = () => {
    switch (node.data.type) {
      case "ec2":
        return config.instanceName && config.instanceType && config.amiId;
      case "s3":
        return config.bucketName;
      case "rds":
        return config.dbIdentifier && config.engine && config.instanceClass;
      default:
        return true;
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                {node.data.type.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Configure Component</h3>
              <p className="text-sm text-gray-600">
                {node.data.name} ({node.data.type.toUpperCase()})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {renderConfigForm()}

          {/* Validation Status */}
          <Card className={`${isConfigurationValid() ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className={`w-5 h-5 mr-2 ${isConfigurationValid() ? "text-green-500" : "text-red-500"}`} />
                <span className={`text-sm font-medium ${isConfigurationValid() ? "text-green-800" : "text-red-800"}`}>
                  {isConfigurationValid() ? "Configuration Valid" : "Configuration Incomplete"}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isConfigurationValid() ? "text-green-700" : "text-red-700"}`}>
                {isConfigurationValid() 
                  ? "All required fields are properly configured"
                  : "Please fill in all required fields"
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onClose}
            disabled={!isConfigurationValid()}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
