import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
  BatchWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Item } from "../models/item.model";
import { Session } from "../models/session.model";

interface SessionResponse {
  sessionId: string;
  items: Session[];
}

export class SessionService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.tableName = process.env.SESSION_TABLE_NAME || "scavenger-hunt-session";
  }

  async createOrUpdateSession(
    email: string,
    themeId: string,
    items: Item[]
  ): Promise<SessionResponse> {
    const existingItems = await this.getSessionItems(email, themeId);

    if (existingItems.length > 0) {
      return {
        sessionId: existingItems[0].sessionId,
        items: existingItems,
      };
    }

    const sessionId = uuidv4();
    const sessionItems: Session[] = items.map((item) => ({
      sessionId,
      itemId: item.itemId,
      themeId,
      email,
      isCollected: false,
      processedAt: new Date().toISOString()
    }));

    await this.batchWriteSessionItems(sessionItems);

    return {
      sessionId,
      items: sessionItems,
    };
  }

  private async getSessionItems(email: string, themeId: string): Promise<Session[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "email = :email and themeId = :themeId",
      ExpressionAttributeValues: {
        ":email": email,
        ":themeId": themeId,
      },
    });
    const response = await this.docClient.send(command);
    return (response.Items as Session[]) || [];
  }

  private async batchWriteSessionItems(items: Session[]): Promise<void> {
    const batchSize = 25;
    const batches = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const params: BatchWriteCommandInput = {
        RequestItems: {
          [this.tableName]: batch.map((item) => ({
            PutRequest: {
              Item: item,
            },
          })),
        },
      };
      batches.push(this.docClient.send(new BatchWriteCommand(params)));
    }
    await Promise.all(batches);
  }
}
