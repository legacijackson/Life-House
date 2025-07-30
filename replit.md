# Housing Portal - Transitional Housing Case Management System

## Overview

This is a full-stack web application designed for transitional housing case management. The system provides a secure portal for case managers, administrators, intake staff, and other stakeholders to manage residents, track progress, document interactions, and maintain compliance with housing programs.

**Recent Major Update (July 2025):** Added comprehensive public-facing functionality including a modern landing page with authentic cultural photography, fully functional housing application system, referral portal for community organizations, and donation processing platform. All forms now have complete backend API integration with database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The application follows a monorepo architecture with clear separation of concerns:

- **`client/`** - React SPA frontend using Vite
- **`server/`** - Express.js backend API
- **`shared/`** - Shared schemas, types, and utilities
- **`migrations/`** - Database migration files

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and development
- TailwindCSS for styling
- shadcn/ui component library
- TanStack Query for data fetching and caching
- Wouter for client-side routing

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Drizzle ORM for database operations
- PostgreSQL as primary database (with Neon serverless)

**Development:**
- ESM modules throughout
- Hot reload in development
- TypeScript strict mode enabled

## Key Components

### Authentication & Authorization
- **Mock Authentication**: Currently uses mock user data for development
- **Role-Based Access**: Supports multiple user roles (Resident, CaseManager, Intake, Admin, Referrer, Auditor)
- **Future OAuth Integration**: Prepared for Google/Microsoft SSO for staff

### Database Schema
- **Comprehensive Schema**: Covers users, residents, case notes, attendance, resources, properties, tickets, applications, and donations
- **Public Forms Integration**: New applications and enhanced donations tables for public form submissions
- **Audit Logging**: Built-in audit trail for compliance
- **Flexible Enums**: Extensive use of PostgreSQL enums for data integrity including justice status options
- **Drizzle ORM**: Type-safe database operations with automatic type generation

### AI Integration
- **OpenAI Integration**: AI assistant for case note drafting
- **Server-Side Processing**: API key never exposed to client
- **Multiple Modes**: Notes, resources, and forms assistance
- **GPT-4o Model**: Uses latest OpenAI model for best results

### UI Components
- **Design System**: shadcn/ui components with custom theming
- **Responsive Design**: Mobile-first approach with breakpoint utilities
- **Accessibility**: ARIA-compliant components
- **Dark Mode Support**: Built-in theme switching capability

## Data Flow

### Client-Server Communication
1. **React Frontend** makes API calls to Express backend
2. **TanStack Query** handles caching, background updates, and optimistic updates
3. **Express Router** validates requests and enforces authentication
4. **Drizzle ORM** executes type-safe database queries
5. **PostgreSQL** stores and retrieves data

### Authentication Flow
1. Mock authentication provides user context
2. Middleware validates user permissions for each request
3. Role-based access control restricts data access
4. User context passed through request lifecycle

### AI Workflow
1. Client requests AI assistance via `/api/ai/*` endpoints
2. Server validates request and user permissions
3. OpenAI API called with structured prompts
4. Response formatted and returned to client
5. User can approve/edit AI-generated content

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Primary database with connection pooling
- **Environment Variables**: `DATABASE_URL` required for connection
- **Migration Strategy**: Drizzle Kit handles schema migrations

### AI Services
- **OpenAI API**: Requires `OPENAI_API_KEY` environment variable
- **Rate Limiting**: Built-in retry logic and error handling
- **Fallback Handling**: Graceful degradation when AI unavailable

### UI Libraries
- **Radix UI**: Headless components for accessibility
- **Lucide Icons**: Consistent icon system
- **TailwindCSS**: Utility-first styling approach

### Development Tools
- **Vite**: Fast development server with HMR
- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality and consistency

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Reload**: Automatic browser refresh on code changes
- **Environment Variables**: Managed through Replit Secrets
- **Database**: Uses Neon serverless PostgreSQL free tier

### Production Considerations
- **Build Process**: Vite builds optimized production bundle
- **Server Build**: esbuild creates server bundle for deployment
- **Static Assets**: Served from Express with proper caching headers
- **Environment Separation**: Different database connections per environment

### Security
- **Environment Variables**: Sensitive data stored in environment variables
- **CORS Protection**: Same-origin policy for API requests
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection Prevention**: Drizzle ORM provides parameterized queries

### Scalability
- **Connection Pooling**: Neon handles database connection management
- **Caching Strategy**: TanStack Query provides client-side caching
- **Code Splitting**: Vite automatically splits bundles for optimal loading
- **Database Indexing**: Strategic indexes on frequently queried columns

### Recent Changes (July 2025)
- **Public Landing Page**: Modern, culturally authentic design with professional photography
- **Housing Applications**: Complete application processing system with database storage
- **Referral Portal**: CBO referral system with structured data collection
- **Donation Platform**: Donation processing with donor management capabilities
- **Backend APIs**: Public endpoints for form submissions with validation and error handling
- **Database Updates**: Enhanced schema with applications table and updated donations structure
- **Unified Intake Modal**: 5-step wizard system with progress bar replacing separate apply page (I-1, I-2)
- **Resident Portal**: Dashboard with maintenance requests, resource navigator, savings tracker (I-5, I-6, I-7)
- **Staff Dashboard**: STOP TouchPoint counter, PDF generation, monthly reports (I-8, I-9, I-10)
- **Admin Panel**: Slack webhook and S3 bucket configuration interface (I-11, I-12)
- **TypeScript Fixes**: Resolved deployment error in resident-case-notes.tsx, fixed bcrypt null check, updated Stripe API version, improved AI service integration
- **Property Management System** (CR-25): Added AddPropertyModal with full CRUD operations for managing Life House properties
- **Maintenance Ticket System** (CR-26): Implemented comprehensive ticket management with filtering, search, status updates, and priority tracking
- **Portal Login Modal** (CR-5): Created modal authentication system for staff access
- **Program Inquiry Modal** (CR-6): Built inquiry form for potential residents with backend storage
- **Partner Signup Modal** (CR-10): Developed partner organization registration with service integration
- **AI Chatbot Widget** (CR-13): Integrated floating AI assistant with Life House-specific knowledge base
- **Role-Based Access Control** (CR-21): Implemented comprehensive RBAC system with permission-based route filtering and RouteGuard component
- **Multi-Portal Routing** (CR-22): Created protected route system with role-based access for different user types
- **Resource Add Modal** (CR-23): Built ResourceAddModal component for adding new community resources
- **Refer Resident Modal** (CR-24): Implemented ReferResidentModal for referring residents to services with integrated buttons in resident profiles
- **Generate Report System** (CR-27): Created comprehensive reports page with multiple report types, date selection, and download functionality
- **Dashboard Counters** (CR-28, CR-29, CR-30): Added case notes, resources, and referrals counters to the main dashboard stats
- **Empty State UI** (CR-31): Implemented "No results found" states for residents and resources lists with helpful guidance
- **Help Desk Widget** (CR-32): Created floating help desk with FAQs and contact support form for user assistance

The architecture prioritizes developer experience, type safety, and maintainability while providing a solid foundation for a production transitional housing management system.