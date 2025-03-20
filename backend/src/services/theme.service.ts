import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Theme } from '../models/theme.model';

export class ThemeService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.tableName = process.env.THEMES_TABLE_NAME || 'scavenger-hunt-themes';
  }

  async getAllThemes(): Promise<Theme[]> {
    const command = new ScanCommand({
      TableName: this.tableName
    });

    const response = await this.docClient.send(command);
    return (response.Items as Theme[]) || [];
  }
}
