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
    echo "Infrastructure deployment completed successfully!"
    echo "Important outputs:"
    terraform output
    
    # Deploy backend to Elastic Beanstalk
    echo "\nDeploying backend to Elastic Beanstalk..."
    cd "$PROJECT_ROOT/backend"
    
    # Build the backend application
    echo "Building backend application..."
    npm install
    npm run build
    
    # Create a deployment package
    echo "Creating Elastic Beanstalk deployment package..."
    EB_DEPLOY_DIR="$BUILD_DIR/eb-deploy"
    mkdir -p "$EB_DEPLOY_DIR"
    
    # Copy necessary files to the deployment directory
    cp -r dist "$EB_DEPLOY_DIR/"
    cp -r .ebextensions "$EB_DEPLOY_DIR/"
    cp package.json "$EB_DEPLOY_DIR/"
    cp package-lock.json "$EB_DEPLOY_DIR/"
    cp Procfile "$EB_DEPLOY_DIR/"
    
    # Create deployment zip file
    cd "$EB_DEPLOY_DIR"
    zip -r "$BUILD_DIR/backend-deploy.zip" .
    
    # Deploy to Elastic Beanstalk
    cd "$PROJECT_ROOT/backend"
    
    # Get the Elastic Beanstalk environment name from Terraform output
    EB_ENV_NAME="scavenger-hunt-env"
    EB_APP_NAME="scavenger-hunt-app"
    EB_REGION="us-east-1"
    VERSION_LABEL="v$(date +%Y%m%d%H%M%S)"
    
    # Create S3 bucket for deployment if it doesn't exist
    S3_BUCKET="${EB_APP_NAME}-deployments"
    
    echo "Creating/checking S3 bucket for deployment packages..."
    aws s3api head-bucket --bucket "$S3_BUCKET" --region "$EB_REGION" 2>/dev/null || \
    aws s3 mb "s3://$S3_BUCKET" --region "$EB_REGION"
    
    # Upload the deployment package to S3
    echo "Uploading deployment package to S3..."
    aws s3 cp "$BUILD_DIR/backend-deploy.zip" "s3://$S3_BUCKET/$VERSION_LABEL.zip" --region "$EB_REGION"
    
    echo "Deploying to Elastic Beanstalk environment: $EB_ENV_NAME"
    aws elasticbeanstalk create-application-version \
      --application-name "$EB_APP_NAME" \
      --version-label "$VERSION_LABEL" \
      --source-bundle S3Bucket="$S3_BUCKET",S3Key="$VERSION_LABEL.zip" \
      --region "$EB_REGION"
    
    aws elasticbeanstalk update-environment \
      --environment-name "$EB_ENV_NAME" \
      --version-label "$VERSION_LABEL" \
      --region "$EB_REGION"
    
    echo "Backend deployment to Elastic Beanstalk initiated."
  else
    echo "Deployment cancelled."
  fi

  # Clean up
  echo "Cleaning up temporary files..."
  rm -rf "$BUILD_DIR"
  echo "Deployment script completed."

elif [ "$ACTION" = "destroy" ]; then
  echo "Starting destruction of Scavenger Hunt infrastructure..."
  
  # Define Elastic Beanstalk environment variables
  EB_ENV_NAME="scavenger-hunt-env"
  EB_APP_NAME="scavenger-hunt-app"
  EB_REGION="us-east-1"
  S3_BUCKET="${EB_APP_NAME}-deployments"
  
  # Ask for confirmation before destroying
  echo "WARNING: This will destroy all resources including Elastic Beanstalk environment and application."
  read -p "Are you sure you want to destroy all resources? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if Elastic Beanstalk environment exists before attempting to terminate it
    echo "Checking for Elastic Beanstalk environment..."
    if aws elasticbeanstalk describe-environments \
      --environment-names "$EB_ENV_NAME" \
      --region "$EB_REGION" \
      --query "Environments[?Status!='Terminated'].EnvironmentName" \
      --output text | grep -q "$EB_ENV_NAME"; then
      
      echo "Elastic Beanstalk environment found. Terminating..."
      aws elasticbeanstalk terminate-environment \
        --environment-name "$EB_ENV_NAME" \
        --region "$EB_REGION"
      
      echo "Waiting for Elastic Beanstalk environment to terminate..."
      aws elasticbeanstalk wait environment-terminated \
        --environment-name "$EB_ENV_NAME" \
        --region "$EB_REGION"
    else
      echo "No active Elastic Beanstalk environment found. Skipping termination."
    fi
    
    # Check if Elastic Beanstalk application exists before attempting to delete it
    echo "Checking for Elastic Beanstalk application..."
    if aws elasticbeanstalk describe-applications \
      --application-names "$EB_APP_NAME" \
      --region "$EB_REGION" \
      --query "Applications[].ApplicationName" \
      --output text | grep -q "$EB_APP_NAME"; then
      
      echo "Elastic Beanstalk application found. Deleting..."
      aws elasticbeanstalk delete-application \
        --application-name "$EB_APP_NAME" \
        --terminate-env-by-force \
        --region "$EB_REGION"
    else
      echo "No Elastic Beanstalk application found. Skipping deletion."
    fi
    
    # Check if S3 bucket exists before attempting to empty and delete it
    echo "Checking for S3 deployment bucket..."
    if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$EB_REGION" 2>/dev/null; then
      echo "S3 deployment bucket found. Emptying and deleting..."
      aws s3 rm "s3://$S3_BUCKET" --recursive --region "$EB_REGION"
      aws s3 rb "s3://$S3_BUCKET" --force --region "$EB_REGION"
    else
      echo "No S3 deployment bucket found. Skipping deletion."
    fi
    
    # Change to infrastructure directory
    cd "$PROJECT_ROOT/infra"
    
    # Initialize Terraform (if needed)
    echo "Initializing Terraform..."
    terraform init
    
    # Plan destruction
    echo "Planning infrastructure destruction..."
    terraform plan -destroy -out=tfdestroyplan
    
    # Apply destruction plan
    echo "Destroying remaining infrastructure..."
    terraform apply tfdestroyplan
    
    echo "Infrastructure destruction completed."
  else
    echo "Destruction cancelled."
  fi
  
  echo "Destruction script completed."
fi
