# InfraGlide - Project Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database (local or cloud-based like Neon)
- **Git** (for cloning the repository)

## Project Overview

CloudFlow is a full-stack application with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS + Shadcn/ui components

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd cloudflow

# Install all dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Neon Database (Recommended)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new database project
3. Copy the connection string

#### Option B: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a new database: `createdb cloudflow`
3. Note your connection details

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database_name"

# Example for Neon:
# DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/cloudflow?sslmode=require"

# Example for Local PostgreSQL:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudflow"

# Development Configuration
NODE_ENV=development
```

### 4. Database Schema Setup

Run the following command to set up your database schema:

```bash
# Push the schema to your database
npm run db:push
```

This command will:
- Create all necessary tables (projects, pipelines, deployments, credentials)
- Set up the schema without requiring manual migrations

### 5. Development Server

Start the development environment:

```bash
# Start both frontend and backend
npm run dev
```

This command will:
- Start the Express backend server on port 5000
- Start the Vite frontend development server
- Enable hot module replacement (HMR)
- Open your browser to the application

### 6. Verify Installation

1. Open your browser to `http://localhost:5000`
2. You should see the CloudFlow dashboard
3. Try creating a new pipeline in the Pipeline Designer
4. Test dragging AWS components to the canvas

## Project Structure

```
cloudflow/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and query client
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Database schema and types
└── package.json         # Dependencies and scripts
```

## Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:server       # Start only backend server
npm run dev:client       # Start only frontend server

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)

# Build
npm run build           # Build for production
npm run build:client   # Build frontend only
npm run build:server   # Build backend only

# Production
npm start              # Start production server
```

## Features Available After Setup

### Dashboard
- Overview of projects and pipelines
- Recent deployment history

### Pipeline Designer
- Drag-and-drop visual pipeline builder
- Multi-cloud components (AWS, Azure, GCP)
- Real-time auto-save functionality
- Component configuration through modal popups

### My Pipelines
- Expandable provider panels (AWS, Azure, GCP)
- Grid view of pipeline versions
- Export/Import functionality
- Pipeline management

### Credentials Management
- Secure storage of cloud provider credentials
- Support for AWS, Azure, and GCP

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure your database is running
   - Check firewall settings for cloud databases

2. **Port Already in Use**
   - Kill any process using port 5000: `lsof -ti:5000 | xargs kill -9`
   - Or change the port in `server/index.ts`

3. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **TypeScript Errors**
   - Ensure you're using Node.js version 18+
   - Run `npm run build` to check for compilation errors

### Database Reset

If you need to reset your database:

```bash
# This will recreate all tables (WARNING: This deletes all data)
npm run db:push
```

## Production Deployment

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NODE_ENV=production
PORT=5000
```

## Development Tips

1. **Hot Reload**: Changes to frontend code will automatically reload the browser
2. **API Testing**: Backend API is available at `http://localhost:5000/api/`
3. **Database GUI**: Use `npm run db:studio` to view/edit database content
4. **Type Safety**: The project uses strict TypeScript - fix all type errors before deployment

## Support

If you encounter any issues during setup:

1. Check the console logs for specific error messages
2. Verify all prerequisites are installed correctly
3. Ensure your database connection is working
4. Try deleting `node_modules` and reinstalling dependencies

The application should now be fully functional with all features working including the pipeline designer, component configuration, and database persistence.