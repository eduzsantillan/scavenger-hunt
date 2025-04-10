import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model";

export class UserService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.tableName = process.env.USERS_TABLE_NAME || "scavenger-hunt-users";
  }

  async createUser(name: string, email: string): Promise<User> {
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const dbItem = {
      user_id:  uuidv4(),
      name,
      email
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: dbItem,
    });

    await this.docClient.send(command);
    return {
        userId: dbItem.user_id,
        name: dbItem.name,
        email: dbItem.email
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        userId: userId,
      },
    });

    const response = await this.docClient.send(command);
    return (response.Item as User) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: "EmailIndex", // Assuming this index exists
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      Limit: 1
    });

    const response = await this.docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as User;
    }
    
    return null;
  }
}
