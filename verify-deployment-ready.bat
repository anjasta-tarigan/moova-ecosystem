@echo off
REM Deployment Readiness Verification Script for Windows
REM Checks if the project is ready for Vercel deployment

setlocal enabledelayedexpansion

echo =========================================
echo Vercel Deployment Readiness Check
echo =========================================
echo.

set READY=1
set WARNINGS=0

REM Check files
echo 1. Project Structure:
echo ─────────────────

if exist "package.json" (
  echo [OK] package.json exists
) else (
  echo [ERR] package.json missing
  set READY=0
)

if exist "backend\package.json" (
  echo [OK] backend\package.json exists
) else (
  echo [ERR] backend\package.json missing
  set READY=0
)

if exist "backend\prisma\schema.prisma" (
  echo [OK] backend\prisma\schema.prisma exists
) else (
  echo [ERR] backend\prisma\schema.prisma missing
  set READY=0
)

echo.
echo 2. Deployment Configurations:
echo ──────────────────────────

if exist "vercel.json" (
  echo [OK] vercel.json exists
) else (
  echo [ERR] vercel.json missing
  set READY=0
)

if exist ".vercelignore" (
  echo [OK] .vercelignore exists
) else (
  echo [ERR] .vercelignore missing
  set READY=0
)

if exist ".env.example" (
  echo [OK] .env.example exists
) else (
  echo [ERR] .env.example missing
  set READY=0
)

echo.
echo 3. Build Scripts:
echo ────────────────

if exist "build-complete.bat" (
  echo [OK] build-complete.bat exists
) else (
  echo [ERR] build-complete.bat missing
  set READY=0
)

echo.
echo 4. Documentation:
echo ────────────────

if exist "DEPLOYMENT.md" (
  echo [OK] DEPLOYMENT.md exists
) else (
  echo [ERR] DEPLOYMENT.md missing
)

if exist "BUILD_AND_DEPLOYMENT_GUIDE.md" (
  echo [OK] BUILD_AND_DEPLOYMENT_GUIDE.md exists
) else (
  echo [ERR] BUILD_AND_DEPLOYMENT_GUIDE.md missing
)

if exist "QUICK_DEPLOY.md" (
  echo [OK] QUICK_DEPLOY.md exists
) else (
  echo [ERR] QUICK_DEPLOY.md missing
)

echo.
echo 5. Git Configuration:
echo ──────────────────────

if exist ".git" (
  echo [OK] Git repository initialized
) else (
  echo [ERR] Git repository not found
  set READY=0
)

echo.
echo 6. Dependencies:
echo ────────────────

if exist "node_modules" (
  echo [WARN] node_modules present (remove before commit)
  set /a WARNINGS+=1
)

if exist "backend\node_modules" (
  echo [WARN] backend\node_modules present (remove before commit)
  set /a WARNINGS+=1
)

REM Summary
echo.
echo =========================================

if !READY! equ 1 (
  if !WARNINGS! equ 0 (
    echo SUCCESS: Ready for deployment!
  ) else (
    echo SUCCESS: Ready with warnings
  )
) else (
  echo ERROR: Not ready for deployment
  echo Check missing files above
  echo.
  exit /b 1
)

echo =========================================
echo.

if !WARNINGS! equ 0 (
  echo Next steps:
  echo 1. Set up PostgreSQL database
  echo 2. Copy .env.example to .env.local
  echo 3. Configure environment variables
  echo 4. Run: build-complete.bat
  echo 5. Push to GitHub
  echo 6. Create Vercel project
  echo 7. Set environment variables in Vercel
  echo 8. Deploy and run migrations
  echo.
  echo See QUICK_DEPLOY.md for quick reference
  echo.
) else (
  echo Warnings to fix before commit:
  echo - Remove node_modules directories
  echo.
)

exit /b 0
