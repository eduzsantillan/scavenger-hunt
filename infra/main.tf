# AWS Scavenger Hunt Terraform Configuration

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "us-east-1"
  type        = string
}

variable "app_name" {
  description = "Name prefix for all resources"
  default     = "scavenger-hunt"
  type        = string
}

variable "eb_solution_stack_name" {
  description = "Elastic Beanstalk solution stack name"
  default     = "64bit Amazon Linux 2023 v6.5.0 running Node.js 18"
  type        = string
}

variable "eb_instance_type" {
  description = "EC2 instance type for Elastic Beanstalk"
  default     = "t2.micro"
  type        = string
}

# S3 bucket for image uploads
resource "aws_s3_bucket" "image_bucket" {
  bucket = "${var.app_name}-images-bucket"
  force_destroy = true  # Allow Terraform to empty the bucket before deletion
  
  tags = {
    Name = "${var.app_name}-images"
  }
}

# S3 bucket versioning (optional for debugging)
resource "aws_s3_bucket_versioning" "image_bucket_versioning" {
  bucket = aws_s3_bucket.image_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access to S3 bucket for security
resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.image_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SNS topic for notifications
resource "aws_sns_topic" "results_topic" {
  name = "${var.app_name}-results"
}

# DynamoDB table for storing category data
resource "aws_dynamodb_table" "category_table" {
  name           = "${var.app_name}-categories"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "category_id"

  attribute {
    name = "category_id"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-categories-table"
  }
}

# DynamoDB table for storing item data
resource "aws_dynamodb_table" "item_table" {
  name           = "${var.app_name}-items"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "item_id"
  range_key      = "category_id"

  attribute {
    name = "item_id"
    type = "S"
  }

  attribute {
    name = "category_id"
    type = "S"
  }

  # Global Secondary Index for querying items by categoryId
  global_secondary_index {
    name               = "CategoryIdIndex"
    hash_key           = "category_id"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name = "${var.app_name}-items-table"
  }
}

# DynamoDB table for storing user data
resource "aws_dynamodb_table" "user_table" {
  name           = "${var.app_name}-users"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Global Secondary Index for querying users by email
  global_secondary_index {
    name               = "EmailIndex"
    hash_key           = "email"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name = "${var.app_name}-users-table"
  }
}

# DynamoDB table for storing team data
resource "aws_dynamodb_table" "team_table" {
  name           = "${var.app_name}-teams"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "team_id"

  attribute {
    name = "team_id"
    type = "S"
  }

  attribute {
    name = "code"
    type = "S"
  }

  # Global Secondary Index for querying teams by code
  global_secondary_index {
    name               = "CodeIndex"
    hash_key           = "code"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name = "${var.app_name}-teams-table"
  }
}

# DynamoDB table for storing team_user relationships
resource "aws_dynamodb_table" "team_user_table" {
  name           = "${var.app_name}-team-users"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "team_id"
  range_key      = "user_id"

  attribute {
    name = "team_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-team-users-table"
  }
}

# DynamoDB table for storing team_item data (collected items)
resource "aws_dynamodb_table" "team_item_table" {
  name           = "${var.app_name}-team-items"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "team_id"
  range_key      = "item_id"

  attribute {
    name = "team_id"
    type = "S"
  }

  attribute {
    name = "item_id"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-team-items-table"
  }
}

# IAM role for Lambda functions with basic Lambda execution permissions
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda to access S3, Rekognition, SNS, and CloudWatch Logs
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.app_name}-lambda-policy"
  description = "Policy for Lambda to access required services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.image_bucket.arn}/*"
      },
      {
        Action = [
          "rekognition:DetectLabels"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.results_topic.arn
      }
    ]
  })
}

# IAM policy for consumer Lambda to access DynamoDB
resource "aws_iam_policy" "consumer_lambda_policy" {
  name        = "${var.app_name}-consumer-lambda-policy"
  description = "Policy for consumer Lambda to access DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.user_table.arn,
          aws_dynamodb_table.category_table.arn,
          aws_dynamodb_table.item_table.arn,
          aws_dynamodb_table.team_table.arn,
          aws_dynamodb_table.team_user_table.arn,
          aws_dynamodb_table.team_item_table.arn,
          "${aws_dynamodb_table.user_table.arn}/index/*",
          "${aws_dynamodb_table.item_table.arn}/index/*",
          "${aws_dynamodb_table.team_table.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role_policy_attachment" "consumer_lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.consumer_lambda_policy.arn
}

# Lambda function to analyze images
resource "aws_lambda_function" "analyze_image_function" {
  function_name    = "${var.app_name}-analyze-image"
  filename         = "analyze-image.zip"  
  source_code_hash = filebase64sha256("analyze-image.zip")
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 10

  environment {
    variables = {
      SNS_TOPIC_ARN  = aws_sns_topic.results_topic.arn
    }
  }
}

# Lambda function to update database
resource "aws_lambda_function" "update_database_function" {
  function_name    = "${var.app_name}-update-database"
  filename         = "update-database.zip"  
  source_code_hash = filebase64sha256("update-database.zip")
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 10

  environment {
    variables = {
      # USERS_TABLE_NAME = aws_dynamodb_table.user_table.name,
      # CATEGORIES_TABLE_NAME = aws_dynamodb_table.category_table.name,
      # ITEMS_TABLE_NAME = aws_dynamodb_table.item_table.name,
      TEAMS_TABLE_NAME = aws_dynamodb_table.team_table.name,
      # TEAM_USERS_TABLE_NAME = aws_dynamodb_table.team_user_table.name,
      TEAM_ITEMS_TABLE_NAME = aws_dynamodb_table.team_item_table.name
    }
  }
}

# S3 bucket notification to trigger Lambda
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.image_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.analyze_image_function.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

# Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analyze_image_function.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.image_bucket.arn
}

# SNS subscription for consumer Lambda
resource "aws_sns_topic_subscription" "update_database_subscription" {
  topic_arn = aws_sns_topic.results_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.update_database_function.arn
}

# Permission for SNS to invoke Lambda
resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_database_function.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.results_topic.arn
}

# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "eb_app" {
  name        = "${var.app_name}-app"
  description = "${var.app_name} backend application"
}

# Elastic Beanstalk IAM Role
resource "aws_iam_role" "eb_service_role" {
  name = "${var.app_name}-eb-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })
}

# Attach managed policies to the Elastic Beanstalk service role
resource "aws_iam_role_policy_attachment" "eb_enhanced_health" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "eb_service" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
}

# EC2 Instance Profile for Elastic Beanstalk
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "${var.app_name}-eb-instance-profile"
  role = aws_iam_role.eb_ec2_role.name
}

resource "aws_iam_role" "eb_ec2_role" {
  name = "${var.app_name}-eb-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach policies to the EC2 instance profile role
resource "aws_iam_role_policy_attachment" "eb_web_tier" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "eb_dynamodb_access" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "eb_s3_access" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Elastic Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "eb_env" {
  name                = "${var.app_name}-env"
  application         = aws_elastic_beanstalk_application.eb_app.name
  solution_stack_name = var.eb_solution_stack_name
  tier                = "WebServer"
  
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_instance_profile.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.eb_service_role.name
  }
  
  setting {
    namespace = "aws:ec2:instances"
    name      = "InstanceTypes"
    value     = var.eb_instance_type
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.aws_region
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_USERS_TABLE"
    value     = aws_dynamodb_table.user_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TEAMS_TABLE"
    value     = aws_dynamodb_table.team_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TEAM_USERS_TABLE"
    value     = aws_dynamodb_table.team_user_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_ITEMS_TABLE"
    value     = aws_dynamodb_table.item_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TEAM_ITEMS_TABLE"
    value     = aws_dynamodb_table.team_item_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_CATEGORIES_TABLE"
    value     = aws_dynamodb_table.category_table.name
  }
  
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "S3_BUCKET_NAME"
    value     = aws_s3_bucket.image_bucket.bucket
  }
}

# Output the Elastic Beanstalk URL
output "elastic_beanstalk_url" {
  value = "http://${aws_elastic_beanstalk_environment.eb_env.cname}"
  description = "URL of the Elastic Beanstalk environment"
}

# AppSync API for frontend integration
resource "aws_appsync_graphql_api" "scavenger_hunt_api" {
  name                = "${var.app_name}-api"
  authentication_type = "API_KEY"
  schema              = file("schema.graphql")  
}

# AppSync API key
resource "aws_appsync_api_key" "api_key" {
  api_id  = aws_appsync_graphql_api.scavenger_hunt_api.id
  expires = timeadd(timestamp(), "8760h")  # 1 year from now
}

# Output important information
output "s3_bucket_name" {
  value = aws_s3_bucket.image_bucket.bucket
}

output "users_table_name" {
  value = aws_dynamodb_table.user_table.name
}

output "categories_table_name" {
  value = aws_dynamodb_table.category_table.name
}

output "items_table_name" {
  value = aws_dynamodb_table.item_table.name
}

output "teams_table_name" {
  value = aws_dynamodb_table.team_table.name
}

output "sns_topic_arn" {
  value = aws_sns_topic.results_topic.arn
}

output "appsync_graphql_endpoint" {
  value = aws_appsync_graphql_api.scavenger_hunt_api.uris["GRAPHQL"]
}

output "appsync_api_key" {
  value     = aws_appsync_api_key.api_key.key
  sensitive = true
}
