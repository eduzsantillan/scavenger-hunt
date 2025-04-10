import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { Category } from "../models/category.model";
import { Item } from "../models/item.model";

export class CategoryService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.tableName = process.env.CATEGORIES_TABLE_NAME || "scavenger-hunt-categories";
  }

  private itemsTableName = process.env.ITEMS_TABLE_NAME || "scavenger-hunt-items";

  async getAllCategories(): Promise<Category[]> {
    const command = new ScanCommand({
      TableName: this.tableName
    });

    const response = await this.docClient.send(command);
    return (response.Items as Category[]) || [];
  }

  async getCategoryById(categoryId: string): Promise<Category | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        category_id: categoryId
      }
    });

    const response = await this.docClient.send(command);
    return (response.Item as Category) || null;
  }

  async getCategoryItems(categoryId: string): Promise<Item[]> {
    const categoryExists = await this.getCategoryById(categoryId);
    if (!categoryExists) {
      return [];
    }
    const command = new QueryCommand({
      TableName: this.itemsTableName,
      IndexName: "CategoryIndex", // Assuming you have a GSI named CategoryIndex
      KeyConditionExpression: "category_id = :categoryId",
      ExpressionAttributeValues: {
        ":categoryId": categoryId
      }
    });

    const response = await this.docClient.send(command);
    return (response.Items as Item[]) || [];
  }
}
