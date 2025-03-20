import { Request, Response } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Session } from "../models/session.model";
import { Theme } from "../models/theme.model";
import { Item } from "../models/item.model";

export class SeedController {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private itemsTableName: string;
  private themesTableName: string;
  private sessionsTableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.itemsTableName = process.env.ITEMS_TABLE_NAME || "scavenger-hunt-items";
    this.themesTableName = process.env.THEMES_TABLE_NAME || "scavenger-hunt-themes";
    this.sessionsTableName = process.env.SESSIONS_TABLE_NAME || "scavenger-hunt-session";
  }

  seedData = async (req: Request, res: Response) => {
    try {
      const themeId = uuidv4();
      const sessionId = uuidv4();
      const email = "demo@example.com";
      
      // Create theme
      const theme: Theme = {
        themeId,
        name: "Household Items"
      };
      
      // Create items
      const items: Item[] = [
        {
          itemId: uuidv4(),
          themeId,
          name: "Bulldog",
          description: "Find a bulldog or a picture of one",
          synonyms: ["dog", "canine", "pet", "puppy", "french bulldog"]
        },
        {
          itemId: uuidv4(),
          themeId,
          name: "Coffee Mug",
          description: "Find a coffee mug",
          synonyms: ["cup", "mug", "coffee cup", "tea cup"]
        },
        {
          itemId: uuidv4(),
          themeId,
          name: "Houseplant",
          description: "Find a houseplant",
          synonyms: ["plant", "flower", "potted plant", "indoor plant", "succulent"]
        }
      ];
      
      // Create session entries for each item
      const sessionEntries: Session[] = [];
      
      // Insert theme
      await this.docClient.send(
        new PutCommand({
          TableName: this.themesTableName,
          Item: theme
        })
      );
      
      // Insert items
      for (const item of items) {
        await this.docClient.send(
          new PutCommand({
            TableName: this.itemsTableName,
            Item: item
          })
        );
        
        // Create a session entry for each item
        const sessionEntry: Session = {
          sessionId,
          itemId: item.itemId,
          themeId,
          email,
          isCollected: false,
          processedAt: new Date().toISOString()
        };
        
        sessionEntries.push(sessionEntry);
        
        // Insert session entry
        await this.docClient.send(
          new PutCommand({
            TableName: this.sessionsTableName,
            Item: sessionEntry
          })
        );
      }
      
      return res.status(200).json({
        message: "Seed data created successfully",
        data: {
          theme,
          items,
          sessionEntries
        }
      });
    } catch (error) {
      console.error("Error seeding data:", error);
      return res.status(500).json({
        message: "Failed to seed data"
      });
    }
  };
}
