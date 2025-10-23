# PowerShell script to fix Prisma singleton pattern in all files

$files = @(
    "backend/src/controllers/authController.ts",
    "backend/src/controllers/foldersController.ts",
    "backend/src/controllers/notesController.ts",
    "backend/src/controllers/problemsController.ts",
    "backend/src/controllers/savedItemsController.ts",
    "backend/src/controllers/studySessionsController.ts",
    "backend/src/controllers/subjectsController.ts",
    "backend/src/controllers/tagsController.ts",
    "backend/src/controllers/uploadsController.ts",
    "backend/src/middleware/auth.ts",
    "backend/src/services/storageService.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file

    if (Test-Path $fullPath) {
        Write-Host "Fixing: $file"

        $content = Get-Content $fullPath -Raw

        # Replace PrismaClient import and instantiation
        $content = $content -replace "import \{ PrismaClient(.*?)\} from '@prisma/client';", "import {`$1} from '@prisma/client';"
        $content = $content -replace "const prisma = new PrismaClient\(\);", ""

        # Add prisma import if not already there
        if ($content -notmatch "import prisma from") {
            $content = $content -replace "(import.*from '@prisma/client';)", "`$1`nimport prisma from '../lib/prisma';"
        }

        Set-Content -Path $fullPath -Value $content -NoNewline
        Write-Host "✅ Fixed: $file"
    } else {
        Write-Host "⚠️  Not found: $file"
    }
}

Write-Host "`n"
Write-Host "All files updated!"
Write-Host "Review changes with: git diff"
