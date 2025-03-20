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

# DynamoDB table for storing theme data
resource "aws_dynamodb_table" "theme_table" {
  name           = "${var.app_name}-themes"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "themeId"

  attribute {
    name = "themeId"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-themes-table"
  }
}

# DynamoDB table for storing item data
resource "aws_dynamodb_table" "item_table" {
  name           = "${var.app_name}-items"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "itemId"
  range_key      = "themeId"

  attribute {
    name = "itemId"
    type = "S"
  }

  attribute {
    name = "themeId"
    type = "S"
  }

  # Global Secondary Index for querying items by themeId
  global_secondary_index {
    name               = "ThemeIdIndex"
    hash_key           = "themeId"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name = "${var.app_name}-items-table"
  }
}

# DynamoDB table for storing session data
resource "aws_dynamodb_table" "session_table" {
  name           = "${var.app_name}-session"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand capacity for free tier
  hash_key       = "sessionId"
  range_key      = "itemId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "itemId"
    type = "S"
  }

  tags = {
    Name = "${var.app_name}-session-table"
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
          aws_dynamodb_table.session_table.arn,
          aws_dynamodb_table.theme_table.arn,
          aws_dynamodb_table.item_table.arn,
          "${aws_dynamodb_table.item_table.arn}/index/*"
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
      SESSION_TABLE_NAME = aws_dynamodb_table.session_table.name,
      THEMES_TABLE_NAME = aws_dynamodb_table.theme_table.name,
      ITEMS_TABLE_NAME = aws_dynamodb_table.item_table.name
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

output "dynamodb_table_name" {
  value = aws_dynamodb_table.session_table.name
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
