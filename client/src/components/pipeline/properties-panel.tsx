import * as React from "react";
import { useState, useEffect } from "react";
import { X, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function PropertiesPanel({
  node,
  onUpdateConfig,
  onClose,
}: PropertiesPanelProps) {
  console.log("PropertiesPanel opened with node:", node);
  console.log("Initial node.data.config:", node.data.config);

  const [config, setConfig] = useState(node.data.config || {});

  useEffect(() => {
    console.log("useEffect triggered, node.data.config:", node.data.config);
    setConfig(node.data.config || {});
  }, [node]);

  const updateConfig = (key: string, value: any) => {
    console.log(`updateConfig called: ${key} = ${value}`);
    console.log("Current config before update:", config);
    const newConfig = { ...config, [key]: value };
    console.log("newConfig after update:", newConfig);
    setConfig(newConfig);
    onUpdateConfig(node.id, newConfig);
    console.log("Config state should be updated, current config:", config);
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

  const updateLabel = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
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
    <div className="space-y-6" style={{ maxHeight: "calc(100vh - 550px)" }}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Basic Configuration
        </h4>
        <div className="space-y-4">
          {/* Instance Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Instance Name *
            </Label>
            <Input
              value={config.instanceName || ""}
              onChange={(e) => updateConfig("instanceName", e.target.value)}
              placeholder="web-server-01"
              className="mt-1"
            />
          </div>

          {/* AWS Region - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              AWS Region *
            </Label>
            <Select
              value={config.awsRegion}
              onValueChange={(value) => {
                console.log("option value:", value);
                updateConfig("awsRegion", value);
                // updateConfig("zone", ""); // Reset zone when region changes
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
            <Input
              value={config.zone || ""}
              onChange={(e) => updateConfig("zone", e.target.value)}
              placeholder="us-east-1a"
              className="mt-1"
            />
          </div>

          {/* AMI ID - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              AMI ID *
            </Label>
            <Input
              value={config.amiId || ""}
              onChange={(e) => updateConfig("amiId", e.target.value)}
              placeholder="ami-0abcdef1234567890"
              className="mt-1"
            />
          </div>

          {/* Machine Type - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Machine Type *
            </Label>
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
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Storage Configuration
        </h4>
        <div className="space-y-4">
          {/* Storage Type - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Storage Type *
            </Label>
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
            <Label className="text-xs font-medium text-gray-700">
              Storage Size (GB) *
            </Label>
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
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Network Configuration
        </h4>
        <div className="space-y-4">
          {/* Network - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Network *
            </Label>
            <Input
              value={config.network || ""}
              onChange={(e) => updateConfig("network", e.target.value)}
              placeholder="vpc-12345678"
              className="mt-1"
            />
          </div>

          {/* Subnetwork - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Subnetwork *
            </Label>
            <Input
              value={config.subnetwork || ""}
              onChange={(e) => updateConfig("subnetwork", e.target.value)}
              placeholder="subnet-12345678"
              className="mt-1"
            />
          </div>

          {/* Security Group - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Security Group *
            </Label>
            <Input
              value={config.securityGroup || ""}
              onChange={(e) => updateConfig("securityGroup", e.target.value)}
              placeholder="sg-12345678"
              className="mt-1"
            />
          </div>

          {/* IP Address Public - Radio Button (Default disabled) */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">
              IP Address Public
            </Label>
            <RadioGroup
              value={config.ipAddressPublic || "disabled"}
              onValueChange={(value) => updateConfig("ipAddressPublic", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disabled" id="ip-disabled" />
                <Label htmlFor="ip-disabled" className="text-sm">
                  Disabled
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enabled" id="ip-enabled" />
                <Label htmlFor="ip-enabled" className="text-sm">
                  Enabled
                </Label>
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
              <Label className="text-xs font-medium text-gray-700">
                Labels
              </Label>
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
                    onChange={(e) =>
                      updateLabel(index, "value", e.target.value)
                    }
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
    <div className="space-y-6" style={{ maxHeight: "calc(100vh - 550px)" }}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Basic Configuration
        </h4>
        <div className="space-y-4">
          {/* AWS Region - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">AWS Region *</Label>
            <Select
              value={config.awsRegion}
              onValueChange={(value) => {
                console.log("S3 AWS Region selected:", value);
                updateConfig("awsRegion", value);
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

          {/* Bucket Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Bucket Name (Globally Unique) *
            </Label>
            <Input
              value={config.bucketName || ""}
              onChange={(e) => updateConfig("bucketName", e.target.value)}
              placeholder="my-unique-bucket-name-123"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Must be globally unique across all AWS accounts</p>
          </div>
          
          {/* Versioning - Radio Button (Default disabled) */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Versioning</Label>
            <RadioGroup
              value={config.versioning || "disabled"}
              onValueChange={(value) => updateConfig("versioning", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disabled" id="versioning-disabled" />
                <Label htmlFor="versioning-disabled" className="text-sm">Disabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enabled" id="versioning-enabled" />
                <Label htmlFor="versioning-enabled" className="text-sm">Enabled</Label>
              </div>
            </RadioGroup>
          </div>

          {/* ACL - Radio Button (Public or Private) */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Access Control List (ACL)</Label>
            <RadioGroup
              value={config.acl || "private"}
              onValueChange={(value) => updateConfig("acl", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="acl-private" />
                <Label htmlFor="acl-private" className="text-sm">Private</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="acl-public" />
                <Label htmlFor="acl-public" className="text-sm">Public</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tags - Text Field */}
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
        </div>
      </div>
    </div>
  );

  const renderRDSConfig = () => (
    <div className="space-y-6" style={{ maxHeight: "calc(100vh - 550px)" }}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Basic Configuration
        </h4>
        <div className="space-y-4">
          {/* DB Instance Identifier - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              DB Instance Identifier *
            </Label>
            <Input
              value={config.dbIdentifier || ""}
              onChange={(e) => updateConfig("dbIdentifier", e.target.value)}
              placeholder="my-database"
              className="mt-1"
            />
          </div>

          {/* Allocated Storage - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Allocated Storage (GB) *
            </Label>
            <Input
              type="number"
              value={config.allocatedStorage || ""}
              onChange={(e) => updateConfig("allocatedStorage", e.target.value)}
              placeholder="20"
              className="mt-1"
            />
          </div>

          {/* Storage Type - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Storage Type *</Label>
            <Select
              value={config.storageType}
              onValueChange={(value) => updateConfig("storageType", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select storage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gp2">General Purpose SSD (gp2)</SelectItem>
                <SelectItem value="gp3">General Purpose SSD (gp3)</SelectItem>
                <SelectItem value="io1">Provisioned IOPS SSD (io1)</SelectItem>
                <SelectItem value="io2">Provisioned IOPS SSD (io2)</SelectItem>
                <SelectItem value="standard">Magnetic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engine - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Engine *</Label>
            <Select
              value={config.engine}
              onValueChange={(value) => updateConfig("engine", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select database engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="oracle-se2">Oracle SE2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engine Version - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Engine Version *</Label>
            <Select
              value={config.engineVersion}
              onValueChange={(value) => updateConfig("engineVersion", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select engine version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8.0">8.0</SelectItem>
                <SelectItem value="5.7">5.7</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instance Class - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Instance Class *
            </Label>
            <Select
              value={config.instanceClass}
              onValueChange={(value) => updateConfig("instanceClass", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select instance class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="db.t3.micro">db.t3.micro</SelectItem>
                <SelectItem value="db.t3.small">db.t3.small</SelectItem>
                <SelectItem value="db.m5.large">db.m5.large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Username - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Username *</Label>
            <Input
              value={config.username || ""}
              onChange={(e) => updateConfig("username", e.target.value)}
              placeholder="admin"
              className="mt-1"
            />
          </div>

          {/* Password - Mandatory with validation */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Password *</Label>
            <Input
              type="password"
              value={config.password || ""}
              onChange={(e) => updateConfig("password", e.target.value)}
              placeholder="Min 8 chars, upper/lower/number/symbol"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters including uppercase, lowercase, number, and symbol
            </p>
          </div>

          {/* DB Subnet Group Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              DB Subnet Group Name *
            </Label>
            <Input
              value={config.dbSubnetGroupName || ""}
              onChange={(e) => updateConfig("dbSubnetGroupName", e.target.value)}
              placeholder="default"
              className="mt-1"
            />
          </div>

          {/* VPC Security Group ID - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              VPC Security Group ID *
            </Label>
            <Input
              value={config.vpcSecurityGroupId || ""}
              onChange={(e) => updateConfig("vpcSecurityGroupId", e.target.value)}
              placeholder="sg-12345678"
              className="mt-1"
            />
          </div>

          {/* Multi-AZ Deployment - Radio Button */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Multi-AZ Deployment</Label>
            <RadioGroup
              value={config.multiAZ || "no"}
              onValueChange={(value) => updateConfig("multiAZ", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="multiaz-no" />
                <Label htmlFor="multiaz-no" className="text-sm">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="multiaz-yes" />
                <Label htmlFor="multiaz-yes" className="text-sm">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Publicly Accessible - Radio Button */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Publicly Accessible</Label>
            <RadioGroup
              value={config.publiclyAccessible || "no"}
              onValueChange={(value) => updateConfig("publiclyAccessible", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="public-no" />
                <Label htmlFor="public-no" className="text-sm">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="public-yes" />
                <Label htmlFor="public-yes" className="text-sm">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Backup Retention Period - Number Input */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Backup Retention Period (days)
            </Label>
            <Input
              type="number"
              value={config.backupRetentionPeriod || "7"}
              onChange={(e) => updateConfig("backupRetentionPeriod", e.target.value)}
              placeholder="7"
              className="mt-1"
            />
          </div>

          {/* Skip Final Snapshot - Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipFinalSnapshot"
              checked={config.skipFinalSnapshot !== false}
              onCheckedChange={(checked) => updateConfig("skipFinalSnapshot", checked)}
            />
            <Label htmlFor="skipFinalSnapshot" className="text-sm text-gray-700">
              Skip Final Snapshot
            </Label>
          </div>

          {/* Tags - Key-Value pairs */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Tags</Label>
            <Textarea
              value={config.tags || ""}
              onChange={(e) => updateConfig("tags", e.target.value)}
              placeholder="Name=MyRDSInstance, Environment=Dev"
              className="mt-1"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated key=value pairs (e.g., Name=MyRDSInstance, Environment=Dev)
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVPCConfig = () => (
    <div className="space-y-6" style={{ maxHeight: "calc(100vh - 550px)" }}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          VPC Configuration
        </h4>
        <div className="space-y-4">
          {/* AWS Region - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">AWS Region *</Label>
            <Select
              value={config.awsRegion}
              onValueChange={(value) => {
                console.log("VPC AWS Region selected:", value);
                updateConfig("awsRegion", value);
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

          {/* VPC CIDR Block - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              VPC CIDR Block *
            </Label>
            <Input
              value={config.vpcCidrBlock || ""}
              onChange={(e) => updateConfig("vpcCidrBlock", e.target.value)}
              placeholder="10.0.0.0/16"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Example: 10.0.0.0/16</p>
          </div>

          {/* CIDR Block for Public Subnet - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              CIDR Block for Public Subnet *
            </Label>
            <Input
              value={config.publicSubnetCidr || ""}
              onChange={(e) => updateConfig("publicSubnetCidr", e.target.value)}
              placeholder="10.0.1.0/24"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Example: 10.0.1.0/24</p>
          </div>

          {/* CIDR Block for Private Subnet - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              CIDR Block for Private Subnet *
            </Label>
            <Input
              value={config.privateSubnetCidr || ""}
              onChange={(e) => updateConfig("privateSubnetCidr", e.target.value)}
              placeholder="10.0.2.0/24"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Example: 10.0.2.0/24</p>
          </div>

          {/* Availability Zone for Public Subnet - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Availability Zone for Public Subnet *
            </Label>
            <Select
              value={config.publicSubnetAZ}
              onValueChange={(value) => updateConfig("publicSubnetAZ", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select availability zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zone1">Zone 1</SelectItem>
                <SelectItem value="zone2">Zone 2</SelectItem>
                <SelectItem value="zone3">Zone 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Availability Zone for Private Subnet - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Availability Zone for Private Subnet *
            </Label>
            <Select
              value={config.privateSubnetAZ}
              onValueChange={(value) => updateConfig("privateSubnetAZ", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select availability zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zone1">Zone 1</SelectItem>
                <SelectItem value="zone2">Zone 2</SelectItem>
                <SelectItem value="zone3">Zone 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VPC Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">VPC Name *</Label>
            <Input
              value={config.vpcName || ""}
              onChange={(e) => updateConfig("vpcName", e.target.value)}
              placeholder="my-vpc"
              className="mt-1"
            />
          </div>

          {/* Public Subnet Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Public Subnet Name *
            </Label>
            <Input
              value={config.publicSubnetName || ""}
              onChange={(e) => updateConfig("publicSubnetName", e.target.value)}
              placeholder="public-subnet"
              className="mt-1"
            />
          </div>

          {/* Private Subnet Name - Mandatory */}
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Private Subnet Name *
            </Label>
            <Input
              value={config.privateSubnetName || ""}
              onChange={(e) => updateConfig("privateSubnetName", e.target.value)}
              placeholder="private-subnet"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaultConfig = () => (
    <div className="space-y-6" style={{ maxHeight: "calc(100vh - 550px)" }}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Basic Configuration
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-700">
              Resource Name
            </Label>
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
      case "vpc":
        return renderVPCConfig();
      default:
        return renderDefaultConfig();
    }
  };

  const isConfigurationValid = () => {
    switch (node.data.type) {
      case "ec2":
        const requiredFields = {
          instanceName: config.instanceName?.trim(),
          awsRegion: config.awsRegion?.trim(),
          zone: config.zone?.trim(),
          amiId: config.amiId?.trim(),
          machineType: config.machineType?.trim(),
          storageType: config.storageType?.trim(),
          storageSize: config.storageSize?.trim(),
          network: config.network?.trim(),
          subnetwork: config.subnetwork?.trim(),
          securityGroup: config.securityGroup?.trim(),
        };

        // Debug: Log missing fields and current config
        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => !value)
          .map(([key, _]) => key);

        if (missingFields.length > 0) {
          console.log("Missing EC2 fields:", missingFields);
          console.log("config.awsRegion", config.awsRegion);
          console.log("Current config:", config);
        }

        return Object.values(requiredFields).every(
          (value) => value && value.length > 0,
        );
      case "s3":
        return config.awsRegion?.trim() && config.bucketName?.trim();
      case "rds":
        // Password validation: min 8 chars, upper/lower/number/symbol
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const isPasswordValid = config.password && passwordRegex.test(config.password);
        
        return (
          config.dbIdentifier?.trim() &&
          config.allocatedStorage?.trim() &&
          config.storageType?.trim() &&
          config.engine?.trim() &&
          config.engineVersion?.trim() &&
          config.instanceClass?.trim() &&
          config.username?.trim() &&
          isPasswordValid &&
          config.dbSubnetGroupName?.trim() &&
          config.vpcSecurityGroupId?.trim()
        );
      case "vpc":
        return (
          config.awsRegion?.trim() &&
          config.vpcCidrBlock?.trim() &&
          config.publicSubnetCidr?.trim() &&
          config.privateSubnetCidr?.trim() &&
          config.publicSubnetAZ?.trim() &&
          config.privateSubnetAZ?.trim() &&
          config.vpcName?.trim() &&
          config.publicSubnetName?.trim() &&
          config.privateSubnetName?.trim()
        );
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
              <h3 className="text-xl font-semibold text-gray-900">
                Configure Component
              </h3>
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
        <div className="space-y-6">{renderConfigForm()}</div>
      </div>
      <Card
        className={`${isConfigurationValid() ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center">
            <CheckCircle
              className={`w-5 h-5 mr-2 ${isConfigurationValid() ? "text-green-500" : "text-red-500"}`}
            />
            <span
              className={`text-sm font-medium ${isConfigurationValid() ? "text-green-800" : "text-red-800"}`}
            >
              {isConfigurationValid()
                ? "Configuration Valid"
                : "Configuration Incomplete"}
            </span>
          </div>
          <p
            className={`text-xs mt-1 ${isConfigurationValid() ? "text-green-700" : "text-red-700"}`}
          >
            {isConfigurationValid()
              ? "All required fields are properly configured"
              : (() => {
                  // Show which fields are missing for EC2
                  if (node.data.type === "ec2") {
                    const requiredFields = {
                      instanceName: config.instanceName?.trim(),
                      awsRegion: config.awsRegion?.trim(),
                      zone: config.zone?.trim(),
                      amiId: config.amiId?.trim(),
                      machineType: config.machineType?.trim(),
                      storageType: config.storageType?.trim(),
                      storageSize: config.storageSize?.trim(),
                      network: config.network?.trim(),
                      subnetwork: config.subnetwork?.trim(),
                      securityGroup: config.securityGroup?.trim(),
                    };
                    const missingFields = Object.entries(requiredFields)
                      .filter(([_, value]) => !value)
                      .map(([key, _]) => key);

                    if (missingFields.length > 0) {
                      return `Missing required fields: ${missingFields.join(", ")}`;
                    }
                  }
                  // Show which fields are missing for S3
                  if (node.data.type === "s3") {
                    const s3RequiredFields = {
                      awsRegion: config.awsRegion?.trim(),
                      bucketName: config.bucketName?.trim(),
                    };
                    const s3MissingFields = Object.entries(s3RequiredFields)
                      .filter(([_, value]) => !value)
                      .map(([key, _]) => key);
                    
                    if (s3MissingFields.length > 0) {
                      return `Missing required fields: ${s3MissingFields.join(", ")}`;
                    }
                  }
                  
                  // Show which fields are missing for RDS
                  if (node.data.type === "rds") {
                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                    const isPasswordValid = config.password && passwordRegex.test(config.password);
                    
                    const rdsRequiredFields = {
                      dbIdentifier: config.dbIdentifier?.trim(),
                      allocatedStorage: config.allocatedStorage?.trim(),
                      storageType: config.storageType?.trim(),
                      engine: config.engine?.trim(),
                      engineVersion: config.engineVersion?.trim(),
                      instanceClass: config.instanceClass?.trim(),
                      username: config.username?.trim(),
                      password: isPasswordValid ? "valid" : null,
                      dbSubnetGroupName: config.dbSubnetGroupName?.trim(),
                      vpcSecurityGroupId: config.vpcSecurityGroupId?.trim(),
                    };
                    
                    const rdsMissingFields = Object.entries(rdsRequiredFields)
                      .filter(([_, value]) => !value)
                      .map(([key, _]) => key === "password" ? "password (invalid format)" : key);
                    
                    if (rdsMissingFields.length > 0) {
                      return `Missing required fields: ${rdsMissingFields.join(", ")}`;
                    }
                  }
                  
                  // Show which fields are missing for VPC
                  if (node.data.type === "vpc") {
                    const vpcRequiredFields = {
                      awsRegion: config.awsRegion?.trim(),
                      vpcCidrBlock: config.vpcCidrBlock?.trim(),
                      publicSubnetCidr: config.publicSubnetCidr?.trim(),
                      privateSubnetCidr: config.privateSubnetCidr?.trim(),
                      publicSubnetAZ: config.publicSubnetAZ?.trim(),
                      privateSubnetAZ: config.privateSubnetAZ?.trim(),
                      vpcName: config.vpcName?.trim(),
                      publicSubnetName: config.publicSubnetName?.trim(),
                      privateSubnetName: config.privateSubnetName?.trim(),
                    };
                    
                    const vpcMissingFields = Object.entries(vpcRequiredFields)
                      .filter(([_, value]) => !value)
                      .map(([key, _]) => key);
                    
                    if (vpcMissingFields.length > 0) {
                      return `Missing required fields: ${vpcMissingFields.join(", ")}`;
                    }
                  }
                  
                  return "Please fill in all required fields";
                })()}
          </p>
        </CardContent>
      </Card>
      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (isConfigurationValid()) {
                onUpdateConfig(node.id, config);
                onClose();
              }
            }}
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
