import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Item } from "../models/item.model";

export class ItemService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.tableName = process.env.ITEMS_TABLE_NAME || "scavenger-hunt-items";
  }

  async getItemsByThemeId(themeId: string): Promise<Item[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "themeId = :themeId",
      ExpressionAttributeValues: {
        ":themeId": themeId,
      },
    });

    const response = await this.docClient.send(command);
    return (response.Items as Item[]) || [];
  }

  async getItemById(itemId: string): Promise<Item | null> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "itemId = :itemId",
        ExpressionAttributeValues: {
          ":itemId": itemId,
        },
        Limit: 1
      });
      const response = await this.docClient.send(command);
      if (response.Items && response.Items.length > 0) {
        return response.Items[0] as Item;
      } else {
        throw new Error("Item not found");
      }
    } catch (error) {
      console.error("Error getting item by ID:", error);
      throw error;
    }
  }
}
