#!/bin/bash

# Deployment Readiness Verification Script
# Checks if the project is ready for Vercel deployment

echo "========================================="
echo "Vercel Deployment Readiness Check"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

READY=true
WARNINGS=0

# Helper functions
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
  else
    echo -e "${RED}✗${NC} $1 missing"
    READY=false
  fi
}

check_file_contents() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contains required config"
  else
    echo -e "${RED}✗${NC} $1 missing: $2"
    READY=false
  fi
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# Check directory structure
echo ""
echo "1. Project Structure:"
echo "─────────────────"
check_file "package.json"
check_file "backend/package.json"
check_file "backend/prisma/schema.prisma"
check_file "backend/src/server.ts"
check_file "vite.config.ts"
check_file ".gitignore"

# Check deployment configs
echo ""
echo "2. Deployment Configurations:"
echo "──────────────────────────"
check_file "vercel.json"
check_file ".vercelignore"
check_file ".env.example"

# Check build scripts
echo ""
echo "3. Build Scripts:"
echo "────────────────"
check_file "build-complete.sh"
check_file "build-complete.bat"

# Check documentation
echo ""
echo "4. Documentation:"
echo "────────────────"
check_file "DEPLOYMENT.md"
check_file "BUILD_AND_DEPLOYMENT_GUIDE.md"
check_file "VERCEL_DEPLOYMENT_CHECKLIST.md"
check_file "QUICK_DEPLOY.md"

# Check package.json scripts
echo ""
echo "5. Package Scripts:"
echo "──────────────────"
check_file_contents "package.json" '"build:all"'
check_file_contents "package.json" '"db:migrate"'
check_file_contents "package.json" '"db:seed"'
check_file_contents "backend/package.json" '"db:migrate"'

# Check TypeScript configs
echo ""
echo "6. TypeScript Configuration:"
echo "───────────────────────────"
check_file "tsconfig.json"
check_file "backend/tsconfig.json"

# Check Prisma setup
echo ""
echo "7. Prisma Setup:"
echo "───────────────"
check_file "backend/prisma/migrations"
check_file "backend/prisma/seed.ts"
check_file_contents "backend/package.json" '"prisma"'

# Check git
echo ""
echo "8. Git Configuration:"
echo "─────────────────────"
if [ -d ".git" ]; then
  echo -e "${GREEN}✓${NC} Git repository initialized"
else
  echo -e "${RED}✗${NC} Git repository not found"
  READY=false
fi

# Check for node_modules (warning only)
echo ""
echo "9. Dependencies:"
echo "────────────────"
if [ -d "node_modules" ]; then
  warn "node_modules present (remove before commit)"
fi
if [ -d "backend/node_modules" ]; then
  warn "backend/node_modules present (remove before commit)"
fi

# Summary
echo ""
echo "========================================="
if [ "$READY" = true ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ READY FOR DEPLOYMENT${NC}"
  else
    echo -e "${YELLOW}⚠ READY (with warnings)${NC}"
  fi
else
  echo -e "${RED}✗ NOT READY FOR DEPLOYMENT${NC}"
fi
echo "========================================="
echo ""

if [ "$READY" = false ]; then
  echo "Required fixes:"
  echo "1. Fix missing files listed above"
  echo "2. Ensure all scripts are present"
  echo "3. Check documentation files"
  echo ""
  exit 1
else
  if [ $WARNINGS -gt 0 ]; then
    echo "Warnings to address before commit:"
    echo "1. Remove node_modules directories"
    echo "2. Ensure .gitignore excludes build outputs"
    echo ""
  fi
  echo "Next steps:"
  echo "1. Set up PostgreSQL database"
  echo "2. Copy .env.example to .env.local"
  echo "3. Configure environment variables"
  echo "4. Run: ./build-complete.sh"
  echo "5. Push to GitHub"
  echo "6. Create Vercel project"
  echo "7. Set environment variables in Vercel"
  echo "8. Deploy and run migrations"
  echo ""
  echo "See QUICK_DEPLOY.md for quick reference"
  echo ""
  exit 0
fi
