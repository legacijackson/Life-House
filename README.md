# Life House Reentry - Transitional Housing Management System

A comprehensive transitional housing case management platform designed to support formerly incarcerated individuals through their reentry journey, offering a technology-driven solution for personal growth and community reintegration.

## Features

### Public Portal
- **Housing Applications**: Complete application system with real-time validation and confirmation numbers
- **Donation Platform**: Secure donation processing with Stripe integration
- **Referral System**: Community-based organization referral portal
- **Micro-Animations**: Enhanced user experience with smooth form interactions

### Staff Portal
- **Case Management**: Comprehensive resident tracking and case notes
- **AI-Powered Assistance**: OpenAI integration for case note drafting and resource recommendations
- **Role-Based Access Control**: Secure multi-role authentication system
- **Administrative Dashboard**: Complete management interface with photo uploads and system configuration

### Technical Features
- **Real-time Validation**: Instant form feedback with animated success/error states
- **Confirmation Numbers**: Unique tracking system for all form submissions (LH-YYYYMMDD-XXXX format)
- **Background Jobs**: Automated resource crawling and system monitoring
- **Responsive Design**: Mobile-first approach with smooth animations

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Role-based access control
- **AI Integration**: OpenAI GPT-4 for intelligent assistance
- **Animations**: Custom micro-animation system for enhanced UX

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## Project Structure

```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── migrations/       # Database migrations
└── docs/            # Documentation
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `SESSION_SECRET`: Session encryption key

## Database Schema

The system includes comprehensive schemas for:
- Users and authentication
- Residents and case management
- Applications and referrals
- Donations and financial tracking
- Resources and community services
- Audit logging and compliance

## Deployment

The application is optimized for deployment on Replit with automatic scaling and built-in database integration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - Life House Reentry Inc.

## Support

For technical support or questions, contact the development team.