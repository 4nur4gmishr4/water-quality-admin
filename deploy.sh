#!/bin/bash

# Water Quality Monitoring Admin Dashboard - Deployment Script
# Smart India Hackathon 2025

set -e  # Exit on any error

echo "🚀 Starting deployment for Water Quality Monitoring Admin Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and npm 8+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm 8+"
        exit 1
    fi
    
    print_success "npm $(npm --version) detected"
}

# Check environment file
check_env() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env.development" ] && [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
        print_warning "No environment file found. Creating from example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env.development
            print_warning "Please configure .env.development with your actual API keys and credentials"
        else
            print_error "No .env.example file found"
            exit 1
        fi
    fi
    
    print_success "Environment configuration found"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Clear npm cache if there are issues
    if [ "$1" = "--clean" ]; then
        print_status "Cleaning npm cache and node_modules..."
        npm cache clean --force
        rm -rf node_modules package-lock.json
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Run type checking
type_check() {
    print_status "Running TypeScript type checking..."
    
    npm run type-check
    
    if [ $? -eq 0 ]; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
}

# Run linting
lint_check() {
    print_status "Running code linting..."
    
    npm run lint
    
    if [ $? -eq 0 ]; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Run 'npm run lint:fix' to auto-fix"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    npm run test:ci
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Build application
build_app() {
    print_status "Building application for production..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
        print_status "Build output available in 'build' directory"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Check build size
check_build_size() {
    print_status "Analyzing build size..."
    
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        print_success "Total build size: $BUILD_SIZE"
        
        # Check if build size is reasonable (warn if > 50MB)
        BUILD_SIZE_MB=$(du -sm build | cut -f1)
        if [ "$BUILD_SIZE_MB" -gt 50 ]; then
            print_warning "Build size is quite large ($BUILD_SIZE). Consider optimizing."
        fi
    fi
}

# Main deployment function
deploy() {
    local environment=${1:-development}
    local skip_tests=${2:-false}
    
    print_status "Deploying to $environment environment..."
    
    # Pre-deployment checks
    check_node
    check_npm
    check_env
    
    # Install dependencies
    install_dependencies
    
    # Code quality checks
    type_check
    lint_check
    
    # Run tests (skip if requested)
    if [ "$skip_tests" != "true" ]; then
        run_tests
    else
        print_warning "Skipping tests (--skip-tests flag provided)"
    fi
    
    # Build application
    build_app
    
    # Check build size
    check_build_size
    
    print_success "Deployment completed successfully!"
    print_status "Next steps:"
    echo "  1. Configure your Firebase project"
    echo "  2. Set up Supabase database with the provided schema"
    echo "  3. Configure Google Maps API key"
    echo "  4. Deploy the 'build' directory to your hosting provider"
    echo "  5. Set up your ML model API endpoint"
    
    # Government-specific deployment notes
    print_status "Government Deployment Notes:"
    echo "  - Ensure all API keys are properly secured"
    echo "  - Follow government cloud deployment guidelines"
    echo "  - Configure HTTPS and security headers"
    echo "  - Set up proper backup and monitoring"
    echo "  - Ensure compliance with data retention policies"
}

# Help function
show_help() {
    echo "Water Quality Monitoring Admin Dashboard - Deployment Script"
    echo "Smart India Hackathon 2025"
    echo ""
    echo "Usage: $0 [OPTIONS] [ENVIRONMENT]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development    Deploy for development (default)"
    echo "  staging        Deploy for staging"
    echo "  production     Deploy for production"
    echo ""
    echo "OPTIONS:"
    echo "  --clean        Clean install (remove node_modules and reinstall)"
    echo "  --skip-tests   Skip running tests during deployment"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to development"
    echo "  $0 production                # Deploy to production"
    echo "  $0 --clean development       # Clean install and deploy to development"
    echo "  $0 --skip-tests production   # Deploy to production without running tests"
}

# Parse command line arguments
ENVIRONMENT="development"
CLEAN=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        development|staging|production)
            ENVIRONMENT=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set environment-specific configurations
case $ENVIRONMENT in
    development)
        export NODE_ENV=development
        ;;
    staging)
        export NODE_ENV=production
        export REACT_APP_ENVIRONMENT=staging
        ;;
    production)
        export NODE_ENV=production
        export REACT_APP_ENVIRONMENT=production
        ;;
esac

# Run deployment
if [ "$CLEAN" = true ]; then
    deploy $ENVIRONMENT $SKIP_TESTS --clean
else
    deploy $ENVIRONMENT $SKIP_TESTS
fi
