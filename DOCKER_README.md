# 🐳 Docker Development Setup

This directory contains a complete Docker-based development environment for the AAS (ACE AP STEM) application.

## 📦 What's Included

This setup provides:
- **PostgreSQL 15** - Database (port 5432)
- **Redis 7** - Cache for job queue (port 6379)
- **Node.js 18 Backend** - Express API server (port 3001)
- **React Frontend** - Development server with hot reload (port 3000)

## 🚀 Quick Start

### For Mac Users (Non-Technical)

See [MAC_SETUP.md](./MAC_SETUP.md) for detailed, non-technical instructions.

**TL;DR**:
1. Install Docker Desktop for Mac
2. Double-click `start-mac.command`
3. Wait 2-3 minutes
4. Open browser to http://localhost:3000

### For Developers (Mac/Windows/Linux)

```bash
# 1. Add your OpenAI API key to .env.docker
cp .env.docker .env.docker.local  # Optional: create local copy
# Edit .env.docker or .env.docker.local with your API key

# 2. Start all services
docker-compose --env-file .env.docker up -d

# 3. View logs
docker-compose logs -f

# 4. Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

Edit `.env.docker` to configure:
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI features)
- `GOOGLE_CLIENT_ID` - Google OAuth (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)

All other variables are pre-configured in `docker-compose.yml`.

### Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| API Docs | 3001 | http://localhost:3001/api-docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 (when running) |

## 👤 Default Login Credentials

### Demo User
- Email: `demo@aas.com`
- Password: `demo123`
- Includes sample data (problems, solutions, folders, notes)

### Admin User
- Email: `admin@aas.com`
- Password: `admin123`
- Full administrative access

**⚠️ Change these passwords after first login!**

## 💻 Development Workflow

### Making Code Changes

Both frontend and backend support hot reload:

**Frontend**:
- Edit files in `/src`
- Browser automatically refreshes

**Backend**:
- Edit files in `/backend/src`
- Server automatically restarts

### Database Changes

```bash
# Create a new migration
docker-compose exec backend npx prisma migrate dev --name your_migration_name

# View database in Prisma Studio
docker-compose exec backend npx prisma studio
# Then open: http://localhost:5555

# Reset database and reseed
docker-compose down -v
docker-compose up -d
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Accessing Services

```bash
# Access backend container
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U aas_user -d aas_local

# Access Redis CLI
docker-compose exec redis redis-cli
```

## 🗂️ File Structure

```
aas-app/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile.backend          # Backend container definition
├── .dockerignore              # Files to exclude from Docker
├── .env.docker                # Environment variables
├── start-mac.command          # Mac startup script
├── stop-mac.command           # Mac shutdown script
├── MAC_SETUP.md               # Non-technical setup guide
├── DOCKER_README.md           # This file
├── backend/                   # Backend source code
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Sample data seeder
│   └── src/                  # TypeScript source
└── src/                      # Frontend React source
```

## 📊 Docker Volumes

Data is persisted in Docker volumes:

| Volume | Purpose | Location |
|--------|---------|----------|
| postgres_data | Database storage | Managed by Docker |
| redis_data | Cache data | Managed by Docker |
| ./backend/uploads | Uploaded files | ./backend/uploads |

### Resetting Data

```bash
# Stop and remove volumes (DELETES ALL DATA!)
docker-compose down -v

# Restart with fresh data
docker-compose up -d
```

## 🐛 Troubleshooting

### Ports Already in Use

```bash
# Find what's using a port (Mac/Linux)
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Kill the process or change ports in docker-compose.yml
```

### Services Won't Start

```bash
# View detailed logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Permission Issues (Mac)

```bash
# Make scripts executable
chmod +x start-mac.command
chmod +x stop-mac.command
```

### Frontend Not Hot Reloading

This is a known issue with Docker on some systems. Solutions:

1. Enable polling in docker-compose.yml (already configured):
   ```yaml
   environment:
     CHOKIDAR_USEPOLLING: true
   ```

2. Or run frontend natively:
   ```bash
   # Stop frontend container
   docker-compose stop frontend

   # Run locally
   npm start
   ```

## 🔄 Updating

### Pulling Latest Code

```bash
# Stop services
docker-compose down

# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Rebuilding After Package Changes

```bash
# Rebuild specific service
docker-compose build backend

# Or rebuild all
docker-compose build
```

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## 🏗️ Production Deployment

**Note**: This Docker setup is for **local development only**.

For production:
- Frontend: Use `npm run build` and deploy to Vercel/Netlify
- Backend: Use production Dockerfile and deploy to Railway/Heroku
- Database: Use managed PostgreSQL (Supabase/AWS RDS)
- Redis: Use managed Redis (Redis Cloud/AWS ElastiCache)

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for production deployment guide.

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

## 🆘 Getting Help

1. Check [MAC_SETUP.md](./MAC_SETUP.md) troubleshooting section
2. View logs: `docker-compose logs -f`
3. Check Docker Desktop status
4. Restart Docker Desktop
5. Contact your development team

## 🎯 Common Commands Reference

```bash
# Start
docker-compose up -d                    # Start in background
docker-compose up                       # Start with logs

# Stop
docker-compose down                     # Stop services
docker-compose down -v                  # Stop and remove volumes

# Logs
docker-compose logs -f                  # Follow all logs
docker-compose logs -f backend          # Follow backend logs

# Rebuild
docker-compose build                    # Rebuild all
docker-compose build backend            # Rebuild backend only
docker-compose up -d --build           # Rebuild and start

# Database
docker-compose exec backend npx prisma studio          # Open Prisma Studio
docker-compose exec backend npx prisma migrate dev     # Run migration
docker-compose exec postgres psql -U aas_user          # PostgreSQL CLI

# Shell Access
docker-compose exec backend sh          # Backend shell
docker-compose exec frontend sh         # Frontend shell

# Health Check
docker-compose ps                       # Service status
docker stats                           # Resource usage
```

---

**Happy coding! 🚀**
