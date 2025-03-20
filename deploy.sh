#!/bin/bash
set -e

# Scavenger Hunt Deployment Script
ACTION="deploy"

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --destroy)
      ACTION="destroy"
      shift
      ;;
    --help)
      echo "Usage: ./deploy.sh [--destroy] [--help]"
      echo ""
      echo "Options:"
      echo "  --destroy    Destroy the infrastructure instead of deploying"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Set working directory to project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

if [ "$ACTION" = "deploy" ]; then
  echo "Starting deployment of Scavenger Hunt infrastructure..."
  
  # Create a build directory for temporary files
  BUILD_DIR="$PROJECT_ROOT/build"
  mkdir -p "$BUILD_DIR"

  echo "Packaging Lambda functions..."

  # Package analyze-image Lambda function
  echo "Packaging analyze-image Lambda function..."
  cd "$PROJECT_ROOT/serverless/analyze-image"
  zip -r "$BUILD_DIR/analyze-image.zip" index.mjs
  echo "analyze-image Lambda function packaged successfully."

  # Package update-database Lambda function
  echo "Packaging update-database Lambda function..."
  cd "$PROJECT_ROOT/serverless/update-database"
  zip -r "$BUILD_DIR/update-database.zip" index.mjs
  echo "update-database Lambda function packaged successfully."

  # Copy Lambda zip files to the infrastructure directory
  echo "Copying Lambda packages to infrastructure directory..."
  cp "$BUILD_DIR/analyze-image.zip" "$PROJECT_ROOT/infra/"
  cp "$BUILD_DIR/update-database.zip" "$PROJECT_ROOT/infra/"

  # Copy GraphQL schema to the correct location
  echo "Copying GraphQL schema to infrastructure directory..."
  cp "$PROJECT_ROOT/infra/schemas/schema.graphql" "$PROJECT_ROOT/infra/"

  # Change to infrastructure directory
  cd "$PROJECT_ROOT/infra"

  # Initialize Terraform (if needed)
  echo "Initializing Terraform..."
  terraform init

  # Validate Terraform configuration
  echo "Validating Terraform configuration..."
  terraform validate

  # Plan Terraform changes
  echo "Planning Terraform changes..."
  terraform plan -out=tfplan

  # Ask for confirmation before applying
  read -p "Do you want to apply these changes? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Apply Terraform changes
    echo "Applying Terraform changes..."
    terraform apply tfplan
    
    # Output important information
    echo "Deployment completed successfully!"
    echo "Important outputs:"
    terraform output
  else
    echo "Deployment cancelled."
  fi

  # Clean up
  echo "Cleaning up temporary files..."
  rm -rf "$BUILD_DIR"
  echo "Deployment script completed."

elif [ "$ACTION" = "destroy" ]; then
  echo "Starting destruction of Scavenger Hunt infrastructure..."
  
  # Change to infrastructure directory
  cd "$PROJECT_ROOT/infra"
  
  # Initialize Terraform (if needed)
  echo "Initializing Terraform..."
  terraform init
  
  # Plan destruction
  echo "Planning infrastructure destruction..."
  terraform plan -destroy -out=tfdestroyplan
  
  # Ask for confirmation before destroying
  echo "WARNING: This will destroy all resources managed by Terraform."
  read -p "Are you sure you want to destroy all resources? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Apply destruction plan
    echo "Destroying infrastructure..."
    terraform apply tfdestroyplan
    
    echo "Infrastructure destruction completed."
  else
    echo "Destruction cancelled."
  fi
  
  echo "Destruction script completed."
fi
