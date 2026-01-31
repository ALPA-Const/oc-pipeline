#!/bin/bash

# AutoGPT System - Deployment Script
# This script automates the deployment process for the AutoGPT system

set -e  # Exit on error

echo "=========================================="
echo "  AutoGPT System - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "AUTOGPT_DEPLOYMENT.md" ]; then
    print_error "Error: AUTOGPT_DEPLOYMENT.md not found. Are you in the project root?"
    exit 1
fi

print_success "Found project root directory"
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Check git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "git installed: $GIT_VERSION"
else
    print_error "git not found. Please install git first."
    exit 1
fi

echo ""

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
echo "-----------------------------------"

cd frontend

if [ -d "node_modules" ]; then
    print_info "node_modules directory exists, checking if update needed..."
    npm install
else
    print_info "Installing dependencies for the first time..."
    npm install
fi

print_success "Dependencies installed successfully"
echo ""

# Step 3: Run TypeScript check
echo "Step 3: Running TypeScript type check..."
echo "-----------------------------------"

npx tsc --noEmit

if [ $? -eq 0 ]; then
    print_success "TypeScript compilation passed (0 errors)"
else
    print_error "TypeScript compilation failed. Please fix errors before deploying."
    exit 1
fi

echo ""

# Step 4: Run linter (optional)
echo "Step 4: Running linter..."
echo "-----------------------------------"

npm run lint || print_warning "Linting issues found (non-blocking)"
echo ""

# Step 5: Build for production
echo "Step 5: Building for production..."
echo "-----------------------------------"

npm run build

if [ $? -eq 0 ]; then
    print_success "Production build completed successfully"
else
    print_error "Build failed. Please check errors above."
    exit 1
fi

echo ""

# Step 6: Check build output
echo "Step 6: Verifying build output..."
echo "-----------------------------------"

if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist | cut -f1)
    print_success "Build output created: dist/ ($BUILD_SIZE)"
    
    # List key files
    print_info "Key files in build:"
    ls -lh dist/ | head -10
else
    print_error "dist/ directory not found. Build may have failed."
    exit 1
fi

echo ""

# Step 7: Deployment options
echo "Step 7: Choose deployment method..."
echo "-----------------------------------"
echo ""
echo "Available deployment options:"
echo "  1) Vercel (Recommended - Fast & Easy)"
echo "  2) Netlify (Good alternative)"
echo "  3) Manual (Copy dist/ to your server)"
echo "  4) Skip deployment (just build)"
echo ""

read -p "Enter your choice (1-4): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        echo ""
        print_info "Deploying to Vercel..."
        
        if command -v vercel &> /dev/null; then
            print_success "Vercel CLI found"
            vercel --prod
        else
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
            vercel --prod
        fi
        ;;
    2)
        echo ""
        print_info "Deploying to Netlify..."
        
        if command -v netlify &> /dev/null; then
            print_success "Netlify CLI found"
            netlify deploy --prod --dir=dist
        else
            print_warning "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
            netlify deploy --prod --dir=dist
        fi
        ;;
    3)
        echo ""
        print_info "Manual deployment selected"
        print_info "Copy the contents of frontend/dist/ to your web server"
        print_info "Example: scp -r frontend/dist/* user@server:/var/www/html/"
        ;;
    4)
        echo ""
        print_info "Skipping deployment. Build is ready in frontend/dist/"
        ;;
    *)
        print_warning "Invalid choice. Skipping deployment."
        ;;
esac

echo ""

# Step 8: Post-deployment checklist
echo "Step 8: Post-deployment checklist..."
echo "-----------------------------------"
echo ""
echo "Please verify the following:"
echo "  [ ] Navigate to /autogpt on your deployed site"
echo "  [ ] Verify authentication redirect works"
echo "  [ ] Log in and test session creation"
echo "  [ ] Check agent visualization displays"
echo "  [ ] Verify metrics update correctly"
echo "  [ ] Test session controls (pause/resume/delete)"
echo "  [ ] Check responsive design on mobile"
echo "  [ ] Verify no console errors in browser"
echo ""

# Step 9: Summary
echo "=========================================="
echo "  Deployment Summary"
echo "=========================================="
echo ""
print_success "✅ Dependencies installed"
print_success "✅ TypeScript check passed"
print_success "✅ Production build completed"
print_success "✅ Build output verified"

case $DEPLOY_CHOICE in
    1|2)
        print_success "✅ Deployment to hosting completed"
        ;;
    3)
        print_info "ℹ️  Manual deployment - copy dist/ to your server"
        ;;
    4)
        print_info "ℹ️  Build only - ready for manual deployment"
        ;;
esac

echo ""
print_success "🎉 Deployment process completed!"
echo ""
print_info "📚 Documentation:"
print_info "   - User Guide: AUTOGPT_README.md"
print_info "   - Deployment Guide: AUTOGPT_DEPLOYMENT.md"
print_info "   - Final Review: FINAL_REVIEW_SUMMARY.md"
echo ""
print_info "📞 Support:"
print_info "   - GitHub Issues: https://github.com/ALPA-Const/oc-pipeline/issues"
print_info "   - Email: support@alpaconstruction.com"
echo ""
print_success "System is now deployed and ready for use! 🚀"
echo ""
