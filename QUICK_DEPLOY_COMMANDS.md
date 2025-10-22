# Quick Deployment Commands - Copy & Paste

## SSH Connection
```bash
ssh -p 65002 u120130425@212.1.211.96
```

---

## Backend Deployment (Run on Hostinger via SSH)

```bash
# 1. Clone repository
cd ~
git clone https://github.com/Anas-HK/aas-app.git aas-app
cd aas-app/backend

# 2. Set up environment
cp .env.production.example .env
nano .env
# Edit the file with your actual values, then Ctrl+O, Enter, Ctrl+X

# 3. Install and build
npm install --production
npm run build

# 4. Set up database
npx prisma generate
npx prisma migrate deploy

# 5. Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Run the command that PM2 outputs

# 6. Verify
pm2 status
pm2 logs aas-backend
```

---

## Frontend Deployment (Run on Local Machine)

```bash
# From your local machine
cd C:\Projects\aas_v2\aas-app

# Upload frontend
scp -P 65002 -r build/* u120130425@212.1.211.96:~/public_html/

# Upload .htaccess
scp -P 65002 .htaccess u120130425@212.1.211.96:~/public_html/
```

---

## Useful PM2 Commands

```bash
pm2 status                # Check status
pm2 logs aas-backend      # View logs
pm2 restart aas-backend   # Restart
pm2 stop aas-backend      # Stop
pm2 monit                 # Monitor
```

---

## Update Backend (After Changes)

```bash
ssh -p 65002 u120130425@212.1.211.96
cd ~/aas-app/backend
git pull
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart aas-backend
```

---

## Update Frontend (After Changes)

```bash
# Local machine
cd C:\Projects\aas_v2\aas-app
npm run build
scp -P 65002 -r build/* u120130425@212.1.211.96:~/public_html/
```
