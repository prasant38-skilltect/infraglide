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
  switch (component.type) {
    case "ec2":
      return !!(component.config.instanceName && component.config.instanceType && component.config.amiId);
    case "s3":
      return !!component.config.bucketName;
    case "rds":
      return !!(component.config.dbIdentifier && component.config.engine && component.config.instanceClass);
    default:
      return true;
  }
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
