import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
  ScanCommand
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

  async getItemsByCategoryId(categoryId: string): Promise<Item[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "category_id = :categoryId",
      ExpressionAttributeValues: {
        ":categoryId": categoryId,
      },
    });

    const response = await this.docClient.send(command);
    if (!response.Items) {
        return [];
    }
    return response.Items.map(this.fromDbItemToModel);
  }

  async getItemById(itemId: string): Promise<Item | null> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "item_id = :itemId",
        ExpressionAttributeValues: {
          ":itemId": itemId,
        },
        Limit: 1
      });
      const response = await this.docClient.send(command);
      if (response.Items && response.Items.length > 0) {
        return this.fromDbItemToModel(response.Items[0]);
      } else {
        throw new Error("Item not found");
      }
    } catch (error) {
      console.error("Error getting item by ID:", error);
      throw error;
    }
  }

  async getItemsByIds(itemIds: string[]): Promise<Item[]> {
    if (!itemIds.length) return [];
    
    const items: Item[] = [];
    
    try {
      for (const itemId of itemIds) {
        try {
          const item = await this.getItemById(itemId);
          if (item) {
            items.push(item);
          }
        } catch (itemError) {
          console.error(`Error getting item ${itemId}:`, itemError);
        }
      }
      
      return items;
    } catch (error) {
      console.error("Error getting items by IDs:", error);
      throw error;
    }
  }

  fromDbItemToModel(dbItem: any): Item {
    return {
      itemId: dbItem.item_id,
      categoryId: dbItem.category_id,
      name: dbItem.name,
      sciName: dbItem.sci_name,
      habitat: dbItem.habitat,
      diet: dbItem.diet,
      biology: dbItem.biology,
      funFact: dbItem.fun_fact,
      synonyms: dbItem.synonyms
    }
  }
}
