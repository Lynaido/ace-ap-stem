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
- PostgreSQL database
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

- Database integration with Prisma
- Authentication endpoints
- Problem management APIs
- AI generation pipeline
- Notes Hub APIs
- Study Mode APIs
- Chat system with WebSockets
