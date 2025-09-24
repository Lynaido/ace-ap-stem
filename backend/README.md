# AAS Backend API

A standalone Node.js/Express backend in TypeScript that serves the Ace AP STEM (AAS) Create React App frontend.

## Features

- **Express.js** with TypeScript
- **Pino** logging with pretty printing in development
- **CORS** configured for CRA integration
- **Helmet** security middleware
- **Rate limiting** for API protection
- **OpenAPI/Swagger** documentation
- **Health checks** and version endpoints
- **Error handling** with custom error classes
- **Request timeout** protection
- **Graceful shutdown** handling

## Prerequisites

- Node.js 18+
- PostgreSQL database (see Database Setup section below)
- Redis (for future AI job queuing)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values

4. Build the project:
```bash
npm run build
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **Version Info**: http://localhost:3001/version

## Environment Variables

See `.env.example` for all required and optional environment variables.

## Database Setup

This project uses **PostgreSQL** with **Prisma ORM** for database management.

### Prerequisites

1. **PostgreSQL Installation**:
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS**: Use Homebrew: `brew install postgresql`
   - **Linux**: Use your package manager: `sudo apt install postgresql postgresql-contrib`

2. **Start PostgreSQL Service**:
   - **Windows**: Use Services.msc or pg_ctl
   - **macOS/Linux**: `brew services start postgresql` or `sudo service postgresql start`

3. **Verify Installation**:
   ```bash
   psql --version
   ```

### Database Configuration

1. **Update Environment Variables**:
   Edit your `.env` file with the correct database connection:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name?schema=public
   ```

   Example:
   ```env
   DATABASE_URL=postgresql://postgres:abc.123@localhost:5432/aas_db?schema=public
   ```

2. **Database Setup Commands**:

   ```bash
   # Navigate to backend directory
   cd backend

   # Apply database migrations (creates database and tables)
   npm run db:migrate

   # Alternative: Push schema without migrations
   npx prisma db push

   # Reset database (WARNING: deletes all data)
   npm run db:reset

   # Seed database with initial data
   npm run db:seed

   # Open Prisma Studio (database GUI)
   npm run db:studio
   ```

### Database Scripts

- `npm run db:migrate` - Apply migrations and generate Prisma client
- `npm run db:push` - Push schema changes directly to database
- `npm run db:reset` - Reset database and reapply migrations + seeding
- `npm run db:seed` - Populate database with initial data
- `npm run db:studio` - Open Prisma Studio for database management

### Initial Admin User

After running `npm run db:seed`, an admin user is created:
```
Email: admin@aas.com
Password: admin123
```

⚠️ **Security Note**: Change the admin password immediately after first login.

### Troubleshooting

**"Database does not exist" Error**:
1. Ensure PostgreSQL is running
2. Check if the database exists: `psql -h localhost -U postgres -l`
3. Create database manually: `createdb aas_db`
4. Verify DATABASE_URL in `.env` file

**Connection Refused Error**:
1. Check if PostgreSQL is running on port 5432
2. Verify username/password in DATABASE_URL
3. Ensure no firewall blocking the connection

**Permission Errors**:
1. Make sure PostgreSQL user has CREATE DATABASE privileges
2. Check if the database already exists with different ownership

### Database Schema

The database includes the following main entities:
- **Users** - User accounts and authentication
- **Problems** - Educational problems with solutions
- **Notes** - User-created notes and folders
- **Study Sessions** - Learning session tracking
- **Chat Threads** - AI chat conversations
- **Saved Items** - Bookmarked content with tags
- **AI Jobs** - Background job processing queue

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── server.ts       # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Integration with Frontend

The backend is designed to work with the existing Create React App frontend:

- **CORS** configured for `http://localhost:3000`
- **REST API** endpoints at `/api/*`
- **JSON responses** matching frontend expectations
- **Error handling** with consistent response format
- **Rate limiting** appropriate for frontend usage

## Next Steps

This is Phase 1 of the backend implementation. Future phases will include:

- Authentication endpoints
- Problem management APIs
- AI generation pipeline
- Notes Hub APIs
- Study Mode APIs
- Chat system with WebSockets
