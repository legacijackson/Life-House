# Housing Portal - Transitional Housing Case Management System

## Overview
This is a full-stack web application designed for transitional housing case management. The system provides a secure portal for case managers, administrators, intake staff, and other stakeholders to manage residents, track progress, document interactions, and maintain compliance with housing programs. Key capabilities include a public-facing landing page, a functional housing application system, a referral portal for community organizations, and a donation processing platform, all integrated with backend APIs and database storage.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a monorepo structure separating client, server, shared, and migrations concerns.

**Frontend:**
- React 18 with TypeScript
- Vite
- TailwindCSS, shadcn/ui
- TanStack Query
- Wouter

**Backend:**
- Node.js with Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL (via Neon serverless)

**Key Components & Features:**
- **Authentication & Authorization**: Mock authentication with role-based access for multiple user roles (Resident, CaseManager, Intake, Admin, Referrer, Auditor). Future support for Google/Microsoft SSO.
- **Database Schema**: Comprehensive schema covering users, residents, case notes, attendance, resources, properties, tickets, applications, and donations, with audit logging and PostgreSQL enums.
- **AI Integration**: OpenAI integration for case note drafting and assistance, utilizing GPT-4o, with server-side API key handling.
- **UI Components**: shadcn/ui design system with custom theming, responsive design, accessibility features, and dark mode support.
- **Data Flow**: React frontend communicates with Express backend via TanStack Query, which uses Drizzle ORM for PostgreSQL operations.
- **Authentication Flow**: Middleware validates permissions based on mock authentication and role-based access control.
- **AI Workflow**: Client requests AI assistance, server processes with OpenAI API, and returns formatted responses.
- **Public-Facing Functionality**: Includes a public landing page, housing application system, referral portal, and donation platform.
- **Resident Portal**: Dashboard with maintenance requests, resource navigator, and savings tracker.
- **Staff Dashboard**: Features like STOP TouchPoint counter, PDF generation, and monthly reports.
- **Admin Panel**: Comprehensive management interface including user, property, settings, system logs, homepage content, and photo management.
- **Background Job System**: In-process job scheduler for resource crawling, nightly resource diff, STOP ARMS reminders, and overdue notes watchdog.
- **Geofence Validation**: Implemented for check-in functionality.
- **Reporting System**: Comprehensive reports page with various report types and download functionality.
- **AI Chatbot Widget**: Floating AI assistant with Life House-specific knowledge base.
- **Mobile Navigation**: Swipe gesture support and hamburger menu for mobile devices on both public and authenticated pages.

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL

**AI Services:**
- OpenAI API

**UI Libraries:**
- Radix UI
- Lucide Icons
- TailwindCSS

**Development Tools:**
- Vite
- TypeScript
- ESLint