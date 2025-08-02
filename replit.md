# InfraGlide - AWS Infrastructure Pipeline Designer

## Overview
InfraGlide is a full-stack web application designed for creating, configuring, and deploying AWS infrastructure components through a visual drag-and-drop interface. It enables users to design and manage infrastructure pipelines for AWS, Azure, and GCP, supporting components like EC2 instances, S3 buckets, RDS databases, and Lambda functions. The platform aims to simplify cloud resource provisioning and management, offering a visual approach to complex infrastructure design. It includes features for cost optimization, version control, and collaborative sharing of infrastructure designs.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Framework**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS custom properties
- **Canvas Library**: ReactFlow for visual pipeline design
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM (PostgreSQL dialect)
- **Session Management**: Express session handling
- **Data Validation**: Zod schemas

### Core Architectural Decisions
- **Monorepo Structure**: Shared TypeScript types/schemas between client/server.
- **Visual Design**: Intuitive drag-and-drop interface for infrastructure components.
- **Multi-Cloud Support**: Tabbed interface for AWS, Azure, and GCP services.
- **Project-Based Isolation**: All infrastructure resources belong to specific projects, ensuring isolation.
- **Role-Based Access Control (RBAC)**: Granular permissions for project and resource sharing.
- **Automated Terraform Generation**: Converts visual pipeline designs into `main.tf.json` files for AWS, Azure, and GCP.
- **Infrastructure as Code (IaC)**: Integration with Terraform for preview, deploy, and destroy operations.
- **Cost Optimization**: Features for analyzing pipeline costs and providing recommendations.
- **Authentication**: Email-based authentication with JWT token validation.
- **Data Persistence**: PostgreSQL database using Drizzle ORM.
- **Deployment Strategy**: Separate builds for client (Vite) and server (esbuild), served by Express in production.
- **Theming**: Professional colorful theme with purple as the primary color, provider-specific colors for components.
- **Virtual Assistant**: "Ask Jane" floating chat for infrastructure guidance and Terraform JSON generation.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production.
- **Drizzle ORM**: Type-safe database queries.

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **ReactFlow**: Node-based visual interfaces.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Development Tools
- **TypeScript**: Strong typing.
- **ESLint/Prettier**: Code quality and formatting.
- **Vite**: Fast development server and build tool.
- **PostCSS**: CSS processing.
- **cross-env**: For cross-platform environment variable compatibility.

### Cloud Integrations (Planned/Simulated)
- **AWS APIs**: For actual resource provisioning (future integration).
- **Perplexity AI**: Integrated for intelligent responses in "Ask Jane" virtual assistant.
- **Terraform**: Local installation for `terraform init`, `plan`, `apply`, `destroy` operations.
- **GitHub**: Integration for publishing pipelines to a community hub (mocked for demonstration).
```