# CloudFlow - AWS Infrastructure Pipeline Designer

## Overview

CloudFlow is a full-stack web application for designing and managing AWS infrastructure pipelines through a visual drag-and-drop interface. The application allows users to create, configure, and deploy AWS infrastructure components like EC2 instances, S3 buckets, RDS databases, Lambda functions, and more through an intuitive visual canvas.

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

### January 14, 2025
- **Added My Pipelines Management System**
  - New "My Pipelines" section in sidebar navigation with grid view interface
  - Auto-save functionality when components are dragged to canvas
  - Pipeline versions automatically named (Version 1, Version 2, etc.)
  - Export pipeline functionality to JSON files
  - Import pipeline functionality (placeholder implementation)
  - Delete pipeline functionality (placeholder implementation)
  - Version management with creation timestamps and component counts

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