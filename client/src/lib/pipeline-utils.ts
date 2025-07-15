import { ComponentConfig, PipelineConnection } from "@shared/schema";

export const getComponentIcon = (type: string) => {
  const icons = {
    ec2: "fa-server",
    lambda: "fa-bolt", 
    s3: "fa-folder",
    rds: "fa-database",
    dynamodb: "fa-table",
    vpc: "fa-network-wired",
    alb: "fa-balance-scale",
  };
  return icons[type as keyof typeof icons] || "fa-cube";
};

export const getComponentColor = (type: string) => {
  const colors = {
    ec2: { bg: "bg-orange-500", text: "text-orange-500" },
    lambda: { bg: "bg-yellow-500", text: "text-yellow-500" },
    s3: { bg: "bg-green-500", text: "text-green-500" },
    rds: { bg: "bg-blue-500", text: "text-blue-500" },
    dynamodb: { bg: "bg-purple-500", text: "text-purple-500" },
    vpc: { bg: "bg-indigo-500", text: "text-indigo-500" },
    alb: { bg: "bg-red-500", text: "text-red-500" },
  };
  return colors[type as keyof typeof colors] || { bg: "bg-gray-500", text: "text-gray-500" };
};

export const validateComponent = (component: ComponentConfig) => {
  const config = component.config || {};
  
  switch (component.type) {
    case "ec2":
      const requiredEC2Fields = [
        'instanceName', 'awsRegion', 'zone', 'amiId', 'machineType', 
        'storageType', 'storageSize', 'network', 'subnetwork', 'securityGroup'
      ];
      return requiredEC2Fields.every(field => config[field]);
      
    case "s3":
      const requiredS3Fields = ['bucketName', 'awsRegion'];
      return requiredS3Fields.every(field => config[field]);
      
    case "rds":
      const requiredRDSFields = [
        'dbIdentifier', 'allocatedStorage', 'storageType', 'engine', 'engineVersion',
        'instanceClass', 'username', 'password', 'dbSubnetGroupName', 'vpcSecurityGroupId'
      ];
      return requiredRDSFields.every(field => config[field]);
      
    case "vpc":
      const requiredVPCFields = [
        'awsRegion', 'vpcCidrBlock', 'publicSubnetCidr', 'privateSubnetCidr',
        'publicSubnetAz', 'privateSubnetAz', 'vpcName', 'publicSubnetName', 'privateSubnetName'
      ];
      return requiredVPCFields.every(field => config[field]);
      
    case "lambda":
      const requiredLambdaFields = ['functionName', 'runtime', 'handler'];
      return requiredLambdaFields.every(field => config[field]);
      
    case "alb":
      const requiredALBFields = ['name', 'scheme', 'type'];
      return requiredALBFields.every(field => config[field]);
      
    default:
      return true;
  }
};

export const getValidationErrors = (component: ComponentConfig) => {
  const config = component.config || {};
  const errors: string[] = [];
  
  switch (component.type) {
    case "ec2":
      const requiredEC2Fields = [
        'instanceName', 'awsRegion', 'zone', 'amiId', 'machineType', 
        'storageType', 'storageSize', 'network', 'subnetwork', 'securityGroup'
      ];
      requiredEC2Fields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
      
    case "s3":
      const requiredS3Fields = ['bucketName', 'awsRegion'];
      requiredS3Fields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
      
    case "rds":
      const requiredRDSFields = [
        'dbIdentifier', 'allocatedStorage', 'storageType', 'engine', 'engineVersion',
        'instanceClass', 'username', 'password', 'dbSubnetGroupName', 'vpcSecurityGroupId'
      ];
      requiredRDSFields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
      
    case "vpc":
      const requiredVPCFields = [
        'awsRegion', 'vpcCidrBlock', 'publicSubnetCidr', 'privateSubnetCidr',
        'publicSubnetAz', 'privateSubnetAz', 'vpcName', 'publicSubnetName', 'privateSubnetName'
      ];
      requiredVPCFields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
      
    case "lambda":
      const requiredLambdaFields = ['functionName', 'runtime', 'handler'];
      requiredLambdaFields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
      
    case "alb":
      const requiredALBFields = ['name', 'scheme', 'type'];
      requiredALBFields.forEach(field => {
        if (!config[field]) errors.push(field);
      });
      break;
  }
  
  return errors;
};

export const generateComponentName = (type: string) => {
  const prefix = type.toUpperCase();
  const suffix = Math.random().toString(36).substr(2, 6);
  return `${prefix}-${suffix}`;
};

export const calculateEstimatedCost = (components: ComponentConfig[]) => {
  let totalCost = 0;
  
  components.forEach((component) => {
    switch (component.type) {
      case "ec2":
        const instanceType = component.config.instanceType || "t3.micro";
        const hourlyRates = {
          "t3.micro": 0.0104,
          "t3.small": 0.0208,
          "t3.medium": 0.0416,
          "t3.large": 0.0832,
        };
        totalCost += (hourlyRates[instanceType as keyof typeof hourlyRates] || 0.0104) * 24 * 30;
        break;
      case "rds":
        const dbInstanceClass = component.config.instanceClass || "db.t3.micro";
        const dbHourlyRates = {
          "db.t3.micro": 0.017,
          "db.t3.small": 0.034,
          "db.t3.medium": 0.068,
        };
        totalCost += (dbHourlyRates[dbInstanceClass as keyof typeof dbHourlyRates] || 0.017) * 24 * 30;
        break;
      case "s3":
        totalCost += 5; // Base S3 cost
        break;
      case "lambda":
        totalCost += 2; // Base Lambda cost
        break;
      case "alb":
        totalCost += 22.5; // ALB monthly cost
        break;
      default:
        totalCost += 1; // Default small cost
    }
  });
  
  return Math.round(totalCost * 100) / 100;
};
