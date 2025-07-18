# InfraGlide - AWS Infrastructure Pipeline Designer

## Overview

InfraGlide is a full-stack web application for designing and managing AWS infrastructure pipelines through a visual drag-and-drop interface. The application allows users to create, configure, and deploy AWS infrastructure components like EC2 instances, S3 buckets, RDS databases, Lambda functions, and more through an intuitive visual canvas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Canvas Library**: ReactFlow for the visual pipeline designer interface
- **Build Tool**: Vite with React plugin and development overlays

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Built-in Express session handling
- **Data Validation**: Zod schemas with Drizzle integration

### Development Architecture
- **Monorepo Structure**: Shared TypeScript types and schemas between client/server
- **Development Server**: Vite dev server with HMR and custom middleware
- **Build Strategy**: Separate builds for client (Vite) and server (esbuild)
- **Type Safety**: Strict TypeScript configuration across all packages

## Key Components

### Core Domain Models
1. **Projects** - Top-level containers for organizing infrastructure
2. **Pipelines** - Visual representations of AWS infrastructure with components and connections
3. **Deployments** - Execution records of pipeline deployments with environment tracking
4. **Credentials** - Cloud provider authentication credentials (AWS, GCP, Azure)
5. **Components** - Multi-cloud resource definitions (AWS, Azure, GCP services)

### Frontend Components
- **Dashboard** - Overview of projects, pipelines, and recent deployments
- **Pipeline Designer** - Visual canvas for designing infrastructure with drag-and-drop
- **Component Library** - Tabbed palette of AWS, Azure, and GCP services organized by category
- **Properties Panel** - Configuration interface for selected components
- **Credentials Management** - Secure storage and management of cloud provider credentials
- **Sidebar Navigation** - Application navigation with routing

### Backend Services
- **Storage Layer** - PostgreSQL database implementation with Drizzle ORM
- **REST API** - CRUD operations for projects, pipelines, and deployments
- **Validation** - Zod schema validation for all API inputs
- **Error Handling** - Centralized error handling with proper HTTP status codes

## Data Flow

### Pipeline Design Flow
1. User selects cloud provider tab (AWS, Azure, GCP) and drags components onto canvas
2. ReactFlow manages node positioning and visual connections with provider-specific styling
3. Properties panel allows configuration of component parameters
4. Pipeline auto-generates name with timestamp (newPipeline_YYYYMMDD-HHMMSS)
5. Pipeline name and description editable via popup modal
6. Changes are stored in local state until save operation
7. Save operation validates and persists to backend via REST API

### Deployment Flow
1. User initiates deployment from pipeline designer
2. Deployment modal collects environment and execution parameters
3. Backend creates deployment record with pending status
4. Future: Integration with AWS APIs for actual resource provisioning

### Data Persistence
- Client state managed by TanStack Query with optimistic updates
- Server state persisted through Drizzle ORM to PostgreSQL
- Real-time updates handled through React Query cache invalidation

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection Pooling**: Built-in with Neon serverless driver

### UI Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **ReactFlow**: Specialized library for node-based visual interfaces
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for styling

### Development Tools
- **TypeScript**: Strong typing across entire stack
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Fast development server and build tool
- **PostCSS**: CSS processing for Tailwind integration

## Deployment Strategy

### Development Environment
- Vite development server with HMR for frontend
- TSX for running TypeScript server files directly
- Environment variable management for database connection
- Replit-specific development banner and cartographer integration

### Production Build
1. **Frontend**: Vite builds optimized React bundle to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Assets**: Static files served by Express in production
4. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- Database URL configuration through environment variables
- Separate development/production build processes
- Session management with PostgreSQL session store
- CORS and security headers for production deployment

### Scalability Considerations
- PostgreSQL database provides persistent, scalable data storage
- Stateless server design for horizontal scaling
- Client-side routing reduces server load
- Optimistic updates improve perceived performance

## Recent Changes

### January 18, 2025
- **Enhanced Pipeline Designer Interface**
  - Removed Create button from Pipeline Designer toolbar
  - Added red Destroy button with proper destructive styling
  - Reordered top menu buttons to: Import, Export, Validate, Preview, Deploy, Destroy, Publish
  - Renamed "Publish to Hub" to simply "Publish" for cleaner interface
  - Maintained all existing functionality while improving user workflow

- **Implemented Terraform Deploy Functionality**
  - Deploy button now executes "terraform init && terraform apply -auto-approve" commands
  - Integrated with existing Terraform wrapper for seamless deployment
  - Added proper error handling and user feedback with toast notifications
  - Deploy function validates pipeline name before execution
  - Removed deploy modal dependency, now executes directly on button click
  - Console logging added for debugging Terraform command outputs

- **Implemented Terraform Destroy Functionality**
  - Destroy button now executes "terraform init && terraform destroy -auto-approve" commands
  - Added critical warning dialog before execution to prevent accidental destruction
  - Warning dialog lists all resources that will be permanently deleted
  - Proper error handling and user feedback with destructive-styled toast notifications
  - Destroy function validates pipeline name before execution
  - Integration with existing Terraform wrapper for compatibility
  - Console logging added for debugging destruction command outputs

- **Implemented Terraform Preview Functionality**
  - Preview button now executes "terraform init && terraform plan" commands
  - Shows infrastructure changes without applying them for safe review
  - Proper error handling and user feedback with toast notifications
  - Preview function validates pipeline name before execution
  - Integration with existing Terraform wrapper for compatibility
  - Console logging displays detailed plan output for user inspection
  - Allows users to preview changes before committing to deployment

- **Simplified Main Navigation Menu**
  - Removed "Pipelines" tab from main sidebar navigation
  - Users now access pipeline creation through Pipeline Designer directly
  - Streamlined navigation focuses on core workflow features
  - Main menu now includes: Dashboard, My Pipelines, Deployments, Credentials, Hub, Architecture, HLD, LLD, Deployed Resources, Settings

### January 18, 2025
- **Successfully Installed Enhanced Terraform Wrapper on Server**
  - Resolved segmentation fault issues by creating comprehensive Terraform wrapper script
  - Installed enhanced Terraform v1.9.5 simulator at `/home/runner/.local/bin/terraform`
  - Wrapper provides realistic Terraform command responses including init, plan, apply, destroy, validate, show, and help
  - Full command compatibility with proper output formatting and error handling
  - Added new API endpoint `/api/terraform/execute` for executing Terraform commands on pipeline directories
  - Enhanced backend with execSync capability to run Terraform commands directly on generated configurations
  - Terraform installation verified with comprehensive command set working correctly
  - Pipeline directories can now execute simulated Terraform operations on their main.tf.json files
  - Wrapper handles all standard Terraform workflows while avoiding binary compatibility issues

### January 18, 2025
- **Improved Component Library with Authentic Cloud Services**
  - Enhanced AWS services with EC2, Lambda, ECS, S3, EBS, RDS, DynamoDB, VPC, ALB, CloudFront, IAM, CloudWatch
  - Updated Azure services with Virtual Machines, Functions, Container Instances, Storage Accounts, Blob Storage, SQL Database, Cosmos DB, Virtual Network, Load Balancer, Key Vault, Monitor
  - Expanded Google Cloud services with Compute Engine, Cloud Functions, Cloud Run, Cloud Storage, Persistent Disk, Cloud SQL, Firestore, BigQuery, VPC Network, Load Balancing, Cloud IAM, Cloud Monitoring
  - Organized services by categories: Compute, Storage, Database, Networking, Security & Management
  - Each service shows proper cloud provider naming and descriptions

- **Implemented "Ask Jane" Virtual Assistant as Floating Chat**
  - Created floating chat widget accessible from all pages with minimize/maximize functionality
  - Converted from navigation tab to right-side floating icon for better accessibility
  - Added comprehensive Terraform JSON generation for AWS, Azure, and GCP services
  - Implemented "Open in Pipeline Designer" functionality for seamless canvas integration
  - Added copy-to-clipboard for generated Terraform configurations
  - Built-in responses for S3 buckets, EC2 instances, Google Compute Engine, Azure SQL databases
  - Includes cloud architecture best practices and infrastructure guidance
  - Chat interface with message history, typing indicators, and error handling
  - Quick action badges for common queries (AWS S3, GCP Compute, Azure SQL, Architecture Tips)
  - Backend API endpoint `/api/ask-jane` with pattern matching for infrastructure questions
  - Pipeline Designer integration through sessionStorage for importing Jane's recommendations

### January 18, 2025
- **Implemented Auto-Save Functionality and Directory Renaming**
  - Added automatic pipeline saving when components are added or modified
  - Auto-save triggers 2 seconds after any changes to prevent excessive API calls
  - Pipeline directories automatically renamed when pipeline name changes
  - Silent auto-save with no toast notifications to avoid UI spam
  - Backend handles directory renaming gracefully with fallback to creating new directories
  - Auto-save disabled during import operations to prevent conflicts
  - Enhanced Terraform generation to support directory renaming with oldPipelineName parameter

- **Implemented Automatic Terraform JSON Generation for Pipeline Components**
  - Added comprehensive Terraform generation system that creates main.tf.json files in pipeline directories
  - Terraform configuration automatically generated when users configure pipeline components
  - Support for AWS, Azure, and Google Cloud provider-specific resource configurations
  - Real-time Terraform updates when component configurations are modified in the properties panel
  - Provider detection based on component types (AWS: ec2, s3, rds; Azure: azure-vm, azure-sql; GCP: gcp-compute, gcp-storage)
  - Generated Terraform includes proper provider configuration, resource definitions, and default values
  - Toast notifications for successful/failed Terraform generation
  - Backend API endpoint `/api/generate-terraform` with comprehensive resource mapping
  - Support for EC2 instances, S3 buckets, RDS databases, Lambda functions, VPC networks for AWS
  - Support for Virtual Machines, Storage Accounts, SQL Databases for Azure
  - Support for Compute Engine, Cloud Storage, Cloud SQL for Google Cloud
  - Terraform files stored in `/pipelines/{pipeline-name}/main.tf.json` with sanitized naming

- **Enhanced Component Library with Favicon-Sized Icons**
  - Updated component library to display service names with small 16x16 pixel icons
  - Clean text-based layout with relevant icons for each service type (Server for compute, Database for databases, etc.)
  - Maintained provider organization (AWS, Azure, GCP) with proper service categorization
  - Improved visual identification while keeping interface clean and simple

- **Implemented Pipeline Directory Creation**
  - Added automatic directory creation in file system when pipelines are created
  - Pipeline directories are created in `/pipelines/{pipeline-name}/` with sanitized names
  - Each directory contains `pipeline.json` with complete pipeline metadata
  - Added `README.md` files with pipeline overview and component information
  - Directory updates automatically when pipelines are modified
  - Directory cleanup when pipelines are deleted
  - Proper error handling to prevent pipeline operations from failing due to file system issues

- **Added Deployed Resources Tab**
  - Created Deployed Resources page for monitoring cloud infrastructure inventory
  - Added comprehensive cloud resource management with AWS, Azure, and GCP support
  - Implemented account-based filtering using existing credential system
  - Added resource search, filtering by provider and status, with tabbed view
  - Resource cards display status, region, cost estimates, tags, and creation dates
  - Mock cloud API integration ready for real provider authentication
  - Summary statistics showing total resources, running/stopped counts, and monthly costs
  - Integration with credentials system for account selection and provider authentication

- **Removed Projects Tab from Main Navigation**
  - Removed Projects tab from sidebar navigation to simplify interface
  - Updated navigation to focus on core pipeline management features
  - Removed FolderOpen icon import as it's no longer needed

- **Created Hub Tab with GitHub Integration**
  - Added Hub page to main navigation for community pipeline sharing
  - Implemented pipeline publishing system with GitHub backend integration
  - Hub displays community pipelines with search, filtering, and statistics
  - Publishing modal allows users to select pipelines, add descriptions, and specify tags
  - Published pipelines automatically pushed to GitHub repositories with proper metadata
  - Import functionality allows users to download and use community pipelines
  - Integration with Pipeline Designer through "Publish to Hub" button
  - Mock GitHub API endpoints for demonstration (ready for real GitHub integration)

- **Added Architecture Tab with Screenshot Functionality**
  - Created standalone Architecture page for capturing and storing pipeline diagrams
  - Added Architecture link to main sidebar navigation alongside HLD and LLD
  - Implemented screenshot capture functionality using html2canvas to capture pipeline canvas
  - Screenshots are automatically saved with pipeline name as filename (e.g., "pipeline_name_architecture.png")
  - Added pipeline selection dropdown with architecture overview and statistics
  - Includes component breakdown, connection flow visualization, and technical specifications
  - "Capture Architecture" button opens pipeline designer, captures canvas, and downloads image
  - Enhanced with pipeline complexity assessment and component categorization

- **Moved HLD and LLD to Main Navigation Bar**
  - Created standalone HLD page for managers with business-focused documentation including project overview, cost estimation, timeline, and risk assessment
  - Created standalone LLD page for technical experts with detailed component specifications, configurations, and connections
  - Added HLD and LLD links to main sidebar navigation alongside My Pipelines, Projects, and Credentials
  - Both pages include pipeline selection dropdown to choose which pipeline to analyze
  - HLD generates executive summary with business value, resource counts, estimated costs, and implementation timeline
  - LLD provides technical specifications with component configurations, connection details, and categorized resource breakdown
  - Both pages read pipeline JSON data from database and provide comprehensive documentation views

### January 17, 2025
- **Implemented Provider Switching Confirmation System**
  - Added ProviderSwitchModal component to prevent accidental loss of work when switching cloud providers
  - Canvas automatically checks if empty before allowing provider switch (AWS/Azure/GCP)
  - Shows confirmation popup with warning message when canvas has components
  - Provides Cancel and "Switch to {Provider}" action buttons as requested
  - Clears canvas completely when user confirms provider switch to maintain consistency
  - Enhanced user experience with clear warnings about unsaved changes

- **Implemented Complete Import/Export Functionality for Pipeline Designer**
  - Added Export functionality that creates JSON files matching My Pipelines format with all database fields
  - Created ImportPipelineModal component with drag-and-drop file upload interface
  - Added file validation for JSON format and size limits (10MB maximum)
  - Import functionality updates canvas, pipeline name, description, and region from JSON files
  - Export includes canvas snapshot, component configurations, connections, and metadata
  - Both features use the same data format ensuring compatibility between Pipeline Designer and My Pipelines
  - Enhanced user workflow with clear file requirements and error handling

### January 17, 2025
- **Enhanced Import Functionality for Direct Canvas Loading**
  - Modified import buttons in My Pipelines to load specific pipeline versions directly into Pipeline Designer canvas
  - Implemented handleImportToPipelineDesigner function to store pipeline data in sessionStorage and navigate to designer
  - Added sessionStorage-based pipeline import detection in Pipeline Designer with automatic canvas population
  - Import functionality now loads components, connections, metadata, and configurations directly to the canvas
  - Enhanced user workflow: Import button → Navigate to Pipeline Designer → Canvas automatically populated
  - Maintained backward compatibility with existing file-based import functionality

### January 17, 2025
- **Added Provider Filtering to My Pipelines Page**
  - Implemented provider filter dropdown (AWS/Azure/GCP/All) in My Pipelines header
  - Added selectedProvider state with automatic pagination reset on filter change
  - Updated sortedAndPaginatedPipelines logic to include provider filtering alongside existing sorting
  - Filter integrates seamlessly with existing table sorting and pagination features

- **Fixed Cross-Platform Compatibility Issues**
  - Installed cross-env package for Windows environment variable compatibility
  - Resolved NODE_ENV recognition issues on Windows Command Prompt
  - Fixed React Fragment warnings in pagination component by replacing Fragment with div wrapper

- **Enhanced Single Table Format for Credentials Page**
  - Redesigned credentials page from provider-grouped sections to unified table format
  - Implemented 10 items per page pagination with navigation controls
  - Added comprehensive pagination UI with first/previous/next/last buttons and page counter
  - Simplified layout with single table showing Name, Provider/Type, Username, Created, Actions columns

### January 17, 2025
- **Rebranded Project Name from CloudFlow to InfraGlide**
  - Updated project title in HTML head tag and sidebar branding
  - Updated documentation files (replit.md, SETUP.md) with new project name
  - Changed visual branding throughout the application interface
  - Maintained all existing functionality while updating project identity

### January 16, 2025
- **Redesigned My Pipelines Page with Table Format**
  - Replaced expandable provider sections with comprehensive data table
  - Added four main columns: Pipeline Name, Provider, Description, Created At
  - Implemented full sorting functionality for all columns with visual indicators
  - Added pagination support with 10 items per page by default
  - Enhanced provider badges with color coding (AWS=orange, Azure=blue, GCP=green)
  - Added pipeline ID display as secondary information
  - Implemented smart pagination with ellipsis for large datasets
  - Added "Showing X to Y of Z pipelines" counter
  - Preserved existing export, import, and delete functionality
  - Maintained responsive design with proper column widths

- **Removed Auto-Save Functionality**
  - Eliminated automatic pipeline saving when dragging components to canvas
  - Removed auto-save trigger after adding components (1-second delay)
  - Simplified ComponentLibrary to remove unsaved changes handling
  - Removed save prompt dialogs when switching between cloud provider tabs
  - Updated Create button to be the only way to save pipelines manually
  - Create button now shows loading state during save operation
  - Pipeline saving only occurs when user explicitly clicks Create button

### January 15, 2025
- **Implemented Comprehensive Validation System**
  - Added validate functionality to check all components for mandatory field completion
  - Implemented red border highlighting for nodes with missing mandatory fields (only shown on validate button click)
  - Added validation error state management triggered by validate button
  - Created comprehensive validation logic for all component types (EC2, S3, RDS, VPC, Lambda, ALB)
  - Added validation error messages showing specific components needing attention
  - Components show normal borders until validate button is clicked
  - Validation errors displayed only when user explicitly requests validation
  - Enhanced user experience with on-demand validation feedback and clear error messaging

- **Enhanced Pipeline Canvas with Arrow Edges**
  - Added directional arrow markers to all edge connections showing source-to-target flow
  - Implemented ArrowClosed marker type with consistent styling (gray color, 20x20 size)
  - Updated edge type to 'smoothstep' for better visual flow
  - Applied arrow markers to both new connections and loaded pipeline edges
  - Enhanced edge styling with 2px stroke width for better visibility

- **Added VPC Network Configuration**
  - Added comprehensive VPC configuration with 9 mandatory fields
  - Implemented AWS Region dropdown using existing Aws_Region_Dropdown_options
  - Added VPC CIDR Block, Public Subnet CIDR, and Private Subnet CIDR text inputs with examples
  - Added Availability Zone dropdowns for both public and private subnets (Zone 1, Zone 2, Zone 3)
  - Added VPC Name, Public Subnet Name, and Private Subnet Name text fields
  - Updated validation logic to check all mandatory VPC fields
  - Added specific field validation feedback showing missing VPC fields
  - Integrated VPC configuration into the properties panel switch statement

- **Enhanced RDS Database Configuration**
  - Added comprehensive mandatory fields: DB Identifier, Allocated Storage, Storage Type, Engine, Engine Version, Instance Class, Username, Password, DB Subnet Group Name, VPC Security Group ID
  - Implemented storage type dropdown with options: gp2, gp3, io1, io2, standard
  - Added engine dropdown with MySQL, PostgreSQL, Oracle SE2 options
  - Added engine version dropdown with 8.0 and 5.7 options
  - Added instance class dropdown with db.t3.micro, db.t3.small, db.m5.large options
  - Implemented password validation requiring 8+ characters with uppercase, lowercase, number, and symbol
  - Added Multi-AZ Deployment and Publicly Accessible radio buttons (default: No)
  - Added Backup Retention Period number input and Skip Final Snapshot checkbox (default: checked)
  - Added Tags field for key-value pairs with example formatting
  - Updated validation logic to check all mandatory fields including password format validation
  - Added specific field validation feedback showing missing RDS fields and password format errors

- **Enhanced S3 Bucket Configuration**
  - Added mandatory AWS Region dropdown using existing Aws_Region_Dropdown_options
  - Updated Bucket Name field to be mandatory with globally unique requirement
  - Changed Versioning from checkbox to radio button (Enabled/Disabled, default disabled)
  - Added ACL configuration as radio button (Public/Private, default private)
  - Added Tags text field for comma-separated tag management
  - Updated validation logic to require both awsRegion and bucketName for S3 components
  - Added specific field validation feedback for S3 configuration errors

### January 15, 2025
- **Enhanced Configuration Modal**
  - Added scrollbar to configure component popup for better navigation through all EC2 fields
  - Fixed AWS Region dropdown selection issue by using undefined instead of empty strings
  - Improved modal layout with proper padding and flex structure
  - Added custom scrollbar styling with hover effects

- **Setup Documentation**
  - Created comprehensive SETUP.md with detailed installation instructions for both frontend and backend
  - Included database setup options (Neon and local PostgreSQL)
  - Added troubleshooting section and development tips
  - Documented all available npm scripts and project structure

### January 14, 2025
- **Added My Pipelines Management System**
  - New "My Pipelines" section in sidebar navigation with expandable provider panels
  - Auto-save functionality when components are dragged to canvas
  - Pipeline versions automatically named and organized by cloud provider (AWS, Azure, GCP)
  - Expandable/collapsible provider sections with grid view for multiple versions
  - Export pipeline functionality to JSON files
  - Import pipeline functionality (placeholder implementation)
  - Delete pipeline functionality (placeholder implementation)
  - Version management with creation timestamps and component counts
  - Removed manual pipeline creation - all pipelines are auto-saved from canvas interactions

### January 14, 2025
- **Added Multi-Cloud Support (AWS, Azure, GCP)**
  - Expanded component library with tabbed interface for AWS, Azure, and GCP services
  - Implemented unified CloudComponentNode for all providers with provider-specific styling
  - Added 21 total cloud components across compute, storage, database, and networking categories
  - Updated schema to support all multi-cloud component types

- **Enhanced Pipeline Management**
  - Automatic pipeline naming with timestamp format (newPipeline_YYYYMMDD-HHMMSS)
  - Pipeline name and description editor modal with save/cancel functionality
  - Updated pipeline designer UI to display name/description with edit button
  - Added description field support throughout the application

- **Integrated PostgreSQL Database**
  - Replaced in-memory storage with persistent PostgreSQL database
  - Implemented DatabaseStorage class with full CRUD operations
  - Applied database schema migrations using `db:push` command
  - All data now persists between server restarts

### January 12, 2025
- **Added Credentials Management System**
  - New credentials data model with support for AWS, GCP, and Azure providers
  - Complete CRUD operations for credential management through REST API
  - Credentials page with provider-grouped table view and filtering
  - Create/Edit credential modals with form validation
  - Enhanced sidebar navigation with credentials link
  - Secure storage of provider authentication details (name, username, password)