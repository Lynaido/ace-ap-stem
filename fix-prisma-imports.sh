#!/bin/bash
# Script to fix all Prisma imports to use singleton instance

cd "$(dirname "$0")/backend/src"

# Find all files with "new PrismaClient()" and replace
find . -type f -name "*.ts" -exec sed -i '' \
  -e 's/import { PrismaClient/import { PrismaClient as PrismaClientType/g' \
  -e '/const prisma = new PrismaClient();/d' \
  -e '/^import.*PrismaClientType.*$/a\
import prisma from '"'"'../lib/prisma'"'"';' \
  {} \;

echo "✅ Fixed Prisma imports in all files"
echo "⚠️  Please review changes before committing"
