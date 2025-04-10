# Scavenger Hunt API

A RESTful API for a scavenger hunt game application that allows users to create teams, join categories, and find items.

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [API Reference](#api-reference)
  - [Categories](#categories)
  - [Items](#items)
  - [Teams](#teams)
  - [Users](#users)
  - [Upload](#upload)
  - [Seed](#seed)
- [Deployment](#deployment)
- [Serverless Functions](#serverless-functions)

## Overview

This API provides endpoints for managing a scavenger hunt game, including user management, team creation, item discovery, and image uploads. The application uses AWS DynamoDB for data storage.

## Getting Started

### Prerequisites

- Node.js
- AWS account with DynamoDB access
- Environment variables configured

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   ITEMS_TABLE_NAME=scavenger-hunt-items
   CATEGORIES_TABLE_NAME=scavenger-hunt-categories
   TEAMS_TABLE_NAME=scavenger-hunt-teams
   TEAM_ITEMS_TABLE_NAME=scavenger-hunt-team-items
   ```
4. Start the server:
   ```
   npm start
   ```

## Architecture

The application uses:
- **AWS DynamoDB** for data storage with tables for:
  - Teams
  - Team Users
  - Team Items
  - Items
  - Categories
  - Users
- **Express.js** for the REST API
- **Elastic Beanstalk** for deployment
- **AWS Lambda** for serverless image processing

Key implementation notes:
1. DynamoDB doesn't support IN operator in KeyConditionExpression - using individual item lookups
2. 'name' is a reserved keyword in DynamoDB - using ExpressionAttributeNames
3. Using Scan with FilterExpression where Query isn't possible

## API Reference

### Categories

#### List All Categories
**Endpoint:** `GET /categories`

**Request:**
No request body required

**Response:**
```json
[
  {
    "categoryId": "string",
    "name": "string"
  }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved categories
- `500 Internal Server Error`: Failed to list categories

#### Get Category by ID
**Endpoint:** `GET /categories/:categoryId`

**Request Parameters:**
- `categoryId`: string (required)

**Response:**
```json
{
  "categoryId": "string",
  "name": "string"
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved category
- `404 Not Found`: Category not found
- `500 Internal Server Error`: Failed to get category

#### Create Category
**Endpoint:** `POST /categories`

**Request:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "message": "Category created successfully",
  "category": {
    "categoryId": "string",
    "name": "string",
    "description": "string",
    "createdAt": "string"
  }
}
```

**Status Codes:**
- `201 Created`: Category created successfully
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Failed to create category

#### Update Category
**Endpoint:** `PUT /categories/:categoryId`

**Request Parameters:**
- `categoryId`: string (required)

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "message": "Category updated successfully"
}
```

**Status Codes:**
- `200 OK`: Category updated successfully
- `404 Not Found`: Category not found
- `500 Internal Server Error`: Failed to update category

### Items

#### Get Item by ID
**Endpoint:** `GET /items/:itemId`

**Request Parameters:**
- `itemId`: string (required)

**Response:**
```json
{
  "itemId": "string",
  "categoryId": "string",
  "name": "string",
  "sciName": "string",
  "habitat": "string",
  "diet": "string",
  "biology": "string",
  "funFact": "string",
  "synonyms": ["string"]
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved item
- `404 Not Found`: Item not found
- `500 Internal Server Error`: Failed to fetch item details

### Teams

#### Create Team
**Endpoint:** `POST /teams`

**Request:**
```json
{
  "name": "string",
  "userId": "string",
  "categoryId": "string"
}
```

**Response:**
```json
{
  "message": "Team created successfully",
  "team": {
    "teamId": "string",
    "name": "string",
    "categoryId": "string",
    "members": ["string"],
    "createdAt": "string"
  }
}
```

**Status Codes:**
- `201 Created`: Team created successfully
- `500 Internal Server Error`: Failed to create team

#### List All Teams
**Endpoint:** `GET /teams`

**Request:**
No request body required

**Response:**
```json
[
  {
    "teamId": "string",
    "name": "string",
    "categoryId": "string",
    "members": ["string"],
    "createdAt": "string"
  }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved teams
- `500 Internal Server Error`: Failed to list teams

#### Join Team
**Endpoint:** `PUT /teams/join`

**Request:**
```json
{
  "userId": "string",
  "teamId": "string"
}
```

**Response:**
```json
{
  "message": "User added to team successfully"
}
```

**Status Codes:**
- `200 OK`: User added to team successfully
- `400 Bad Request`: User is already a member of this team
- `404 Not Found`: Team not found
- `500 Internal Server Error`: Failed to join team

#### Get Team Items
**Endpoint:** `GET /teams/:teamId/items`

**Request Parameters:**
- `teamId`: string (required)

**Response:**
```json
[
  {
    "teamItemId": "string",
    "teamId": "string",
    "itemId": "string",
    "status": "string",
    "imageUrl": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "item": {
      "itemId": "string",
      "categoryId": "string",
      "name": "string",
      "sciName": "string",
      "habitat": "string",
      "diet": "string",
      "biology": "string",
      "funFact": "string",
      "synonyms": ["string"]
    }
  }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved team items
- `404 Not Found`: Team not found
- `500 Internal Server Error`: Failed to get team items

#### Get Team Details
**Endpoint:** `GET /teams/:teamId`

**Request Parameters:**
- `teamId`: string (required)

**Response:**
```json
{
  "teamId": "string",
  "name": "string",
  "categoryId": "string",
  "members": [
    {
      "userId": "string",
      "name": "string",
      "email": "string"
    }
  ],
  "createdAt": "string",
  "itemsFound": 0
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved team
- `404 Not Found`: Team not found
- `500 Internal Server Error`: Failed to get team

#### Remove Team Member
**Endpoint:** `DELETE /teams/:teamId/members/:userId`

**Request Parameters:**
- `teamId`: string (required)
- `userId`: string (required)

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

**Status Codes:**
- `200 OK`: Member removed successfully
- `404 Not Found`: Team or user not found
- `500 Internal Server Error`: Failed to remove member

### Users

#### Create User
**Endpoint:** `POST /users`

**Request:**
```json
{
  "name": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "userId": "string",
    "name": "string",
    "email": "string",
    "createdAt": "string"
  }
}
```

**Status Codes:**
- `201 Created`: User created successfully
- `400 Bad Request`: Missing required fields
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Failed to create user

#### Get User by ID
**Endpoint:** `GET /users/:userId`

**Request Parameters:**
- `userId`: string (required)

**Response:**
```json
{
  "userId": "string",
  "name": "string",
  "email": "string",
  "createdAt": "string"
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved user
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to get user

#### Update User
**Endpoint:** `PUT /users/:userId`

**Request Parameters:**
- `userId`: string (required)

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

**Status Codes:**
- `200 OK`: User updated successfully
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to update user

### Upload

#### Upload Image
**Endpoint:** `POST /upload/:teamId/:itemId`

**Request Parameters:**
- `teamId`: string (required)
- `itemId`: string (required)

**Request Body:**
Form data with `image` file

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "teamItem": {
    "teamItemId": "string",
    "teamId": "string",
    "itemId": "string",
    "status": "string",
    "imageUrl": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Status Codes:**
- `200 OK`: Image uploaded successfully
- `400 Bad Request`: No file uploaded or invalid file
- `404 Not Found`: Team or item not found
- `500 Internal Server Error`: Failed to upload image

### Seed

#### Seed Data
**Endpoint:** `POST /seed`

**Request:**
No request body required

**Response:**
```json
{
  "message": "Data seeded successfully",
  "categories": [
    {
      "categoryId": "string",
      "name": "string"
    }
  ],
  "items": [
    {
      "itemId": "string",
      "categoryId": "string",
      "name": "string",
      "sciName": "string",
      "habitat": "string",
      "diet": "string",
      "biology": "string",
      "funFact": "string",
      "synonyms": ["string"]
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Data seeded successfully
- `500 Internal Server Error`: Failed to seed data

## Deployment

### Elastic Beanstalk

The application is configured for AWS Elastic Beanstalk with:
- Node.js 18 on Amazon Linux 2023
- Environment configured via `config.yml`
- Procfile specifying `web: npm start`

### Serverless Functions

Two Lambda functions are included:
1. `analyze-image` - Processes uploaded images
2. `update-database` - Handles database updates

Both are deployed using the Serverless Framework.
