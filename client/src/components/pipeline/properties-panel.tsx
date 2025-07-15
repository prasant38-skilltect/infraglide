import * as React from "react";
import { useState, useEffect } from "react";
import { X, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  // AWS Region and Storage Type dropdown options
  const Aws_Region_Dropdown_options = [
    { label: "US East (Ohio)", value: "us-east-2" },
    { label: "US East (N. Virginia)", value: "us-east-1" },
    { label: "US West (N. California)", value: "us-west-1" },
  ];

  const StorageType = [
    { label: "General Purpose SSD", value: "gp2, gp3" },
    { label: "Provisioned IOPS SSD", value: "io1, io2" },
    { label: "Throughput-optimized HDD", value: "st1" },
  ];

  const getZonesByRegion = (region: string) => {
    const zones = {
      "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],
      "us-east-2": ["us-east-2a", "us-east-2b", "us-east-2c"],
      "us-west-1": ["us-west-1a", "us-west-1b", "us-west-1c"],
    };
    return zones[region as keyof typeof zones] || [];
  };

  const addLabel = () => {
    const labels = config.labels || [];
    updateConfig("labels", [...labels, { key: "", value: "" }]);
  };

  const updateLabel = (index: number, field: "key" | "value", value: string) => {
    const labels = [...(config.labels || [])];
    labels[index] = { ...labels[index], [field]: value };
    updateConfig("labels", labels);
  };

  const removeLabel = (index: number) => {
    const labels = [...(config.labels || [])];
    labels.splice(index, 1);
    updateConfig("labels", labels);
  };

  const renderEC2Config = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Configuration</h4>
        <div className="space-y-4">
          {/* Instance Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Instance Name *</Label>
            <Input
              value={config.instanceName || ""}
              onChange={(e) => updateConfig("instanceName", e.target.value)}
              placeholder="web-server-01"
              className="mt-1"
            />
          </div>
          
          {/* AWS Region - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">AWS Region *</Label>
            <Select
              value={config.awsRegion || undefined}
              onValueChange={(value) => {
                updateConfig("awsRegion", value);
                updateConfig("zone", ""); // Reset zone when region changes
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select AWS Region" />
              </SelectTrigger>
              <SelectContent>
                {Aws_Region_Dropdown_options.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Zone *</Label>
            <Select
              value={config.zone || undefined}
              onValueChange={(value) => updateConfig("zone", value)}
              disabled={!config.awsRegion}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {getZonesByRegion(config.awsRegion || "").map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AMI ID - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">AMI ID *</Label>
            <Input
              value={config.amiId || ""}
              onChange={(e) => updateConfig("amiId", e.target.value)}
              placeholder="ami-0abcdef1234567890"
              className="mt-1"
            />
          </div>

          {/* Machine Type - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Machine Type *</Label>
            <Input
              value={config.machineType || ""}
              onChange={(e) => updateConfig("machineType", e.target.value)}
              placeholder="t3.micro"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Storage Configuration</h4>
        <div className="space-y-4">
          {/* Storage Type - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Storage Type *</Label>
            <Select
              value={config.storageType || undefined}
              onValueChange={(value) => updateConfig("storageType", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Storage Type" />
              </SelectTrigger>
              <SelectContent>
                {StorageType.map((storage) => (
                  <SelectItem key={storage.value} value={storage.value}>
                    {storage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Storage Size - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Storage Size (GB) *</Label>
            <Input
              value={config.storageSize || ""}
              onChange={(e) => updateConfig("storageSize", e.target.value)}
              placeholder="20"
              type="number"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Network Configuration</h4>
        <div className="space-y-4">
          {/* Network - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Network *</Label>
            <Input
              value={config.network || ""}
              onChange={(e) => updateConfig("network", e.target.value)}
              placeholder="vpc-12345678"
              className="mt-1"
            />
          </div>

          {/* Subnetwork - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Subnetwork *</Label>
            <Input
              value={config.subnetwork || ""}
              onChange={(e) => updateConfig("subnetwork", e.target.value)}
              placeholder="subnet-12345678"
              className="mt-1"
            />
          </div>

          {/* Security Group - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Security Group *</Label>
            <Input
              value={config.securityGroup || ""}
              onChange={(e) => updateConfig("securityGroup", e.target.value)}
              placeholder="sg-12345678"
              className="mt-1"
            />
          </div>

          {/* IP Address Public - Radio Button (Default disabled) */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">IP Address Public</Label>
            <RadioGroup
              value={config.ipAddressPublic || "disabled"}
              onValueChange={(value) => updateConfig("ipAddressPublic", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disabled" id="ip-disabled" />
                <Label htmlFor="ip-disabled" className="text-sm">Disabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enabled" id="ip-enabled" />
                <Label htmlFor="ip-enabled" className="text-sm">Enabled</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Metadata</h4>
        <div className="space-y-4">
          {/* Tags - String, Text */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Tags</Label>
            <Textarea
              value={config.tags || ""}
              onChange={(e) => updateConfig("tags", e.target.value)}
              placeholder="Environment=Production, Team=Backend"
              className="mt-1"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
          </div>

          {/* Labels - Key-Value pair */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Labels</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLabel}
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Label
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {(config.labels || []).map((label: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={label.key || ""}
                    onChange={(e) => updateLabel(index, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1"
                  />
                  <Input
                    value={label.value || ""}
                    onChange={(e) => updateLabel(index, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLabel(index)}
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {(!config.labels || config.labels.length === 0) && (
                <p className="text-xs text-gray-500">No labels added yet</p>
              )}
            </div>
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
        return config.instanceName && 
               config.awsRegion && 
               config.zone && 
               config.amiId && 
               config.machineType && 
               config.storageType && 
               config.storageSize && 
               config.network && 
               config.subnetwork && 
               config.securityGroup;
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
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
