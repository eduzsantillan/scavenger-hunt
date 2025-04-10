import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand,} from "@aws-sdk/lib-dynamodb";
import {v4 as uuidv4} from "uuid";
import {Team} from "../models/team.model";
import {TeamUser} from "../models/team-user.model";
import {ItemService} from "./item.service";
import {CategoryService} from "./category.service";

export interface TeamItemsResponse {
  items: ItemList[];
  teamId: string;
}

export interface ItemList {
  itemId: string;
  name: string;
  isCollected: boolean;
}

export class TeamService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private teamTableName: string;
  private teamUserTableName: string;
  private teamItemTableName: string;
  private itemService: ItemService;
  private categoryService: CategoryService;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.teamTableName = process.env.TEAMS_TABLE_NAME || "scavenger-hunt-teams";
    this.teamUserTableName =
      process.env.TEAM_USERS_TABLE_NAME || "scavenger-hunt-team-users";
    this.teamItemTableName =
      process.env.TEAM_ITEMS_TABLE_NAME || "scavenger-hunt-team-items";
    this.itemService = new ItemService();
    this.categoryService = new CategoryService();
  }

  async createTeam(
    name: string,
    userId: string,
    categoryId: string
  ): Promise<Team> {
    const categoryExists = await this.categoryService.getCategoryById(
      categoryId
    );
    if (!categoryExists) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    const teamExists = await this.getTeamByName(name);
    if (teamExists) {
      throw new Error(`Team with name ${name} already exists`);
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const team: Team = {
      teamId: uuidv4(),
      name,
      code,
      isCompleted: false,
      categoryId,
    };

    const teamCommand = new PutCommand({
      TableName: this.teamTableName,
      Item: {
        team_id: team.teamId,
        name: team.name,
        code: team.code,
        is_completed: team.isCompleted,
        category_id: team.categoryId,
      },
    });

    await this.docClient.send(teamCommand);

    await this.addUserToTeam(team.teamId, userId, code);
    await this.createTeamItems(team.teamId, categoryId);

    return team;
  }

  async getAllTeams(): Promise<Team[]> {
    const command = new ScanCommand({
      TableName: this.teamTableName,
    });

    const response = await this.docClient.send(command);
    if (!response.Items) {
      return [];
    }
    return response.Items.map((item) => {
      return {
        teamId: item.team_id,
        name: item.name,
        code: item.code,
        isCompleted: item.is_completed,
        categoryId: item.category_id,
      };
    });
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const command = new GetCommand({
      TableName: this.teamTableName,
      Key: {
        team_id: teamId,
      },
    });

    const response = await this.docClient.send(command);
    if (!response.Item) return null;

    return {
      teamId: response.Item.team_id,
      name: response.Item.name,
      code: response.Item.code,
      isCompleted: response.Item.is_completed,
      categoryId: response.Item.category_id,
    };
  }

  async getTeamByName(name: string): Promise<Team | null> {
    const command = new ScanCommand({
      TableName: this.teamTableName,
      FilterExpression: "#nm = :nameValue",
      ExpressionAttributeNames: {
        "#nm": "name",
      },
      ExpressionAttributeValues: {
        ":nameValue": name,
      },
      Limit: 1,
    });

    const response = await this.docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as Team;
    }

    return null;
  }

  async addUserToTeam(
    teamId: string,
    userId: string,
    code: string
  ): Promise<TeamUser> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    } else if (team.isCompleted) {
      throw new Error("Team is already completed");
    } else if (team.code !== code) {
      throw new Error("Invalid team code");
    }
    const existingTeamUser = await this.getTeamUser(teamId, userId);
    if (existingTeamUser) {
      throw new Error("User is already a member of this team");
    }

    const teamUser: TeamUser = {
      teamId,
      userId,
    };

    const command = new PutCommand({
      TableName: this.teamUserTableName,
      Item: {
        team_id: teamUser.teamId,
        user_id: teamUser.userId,
      },
    });

    await this.docClient.send(command);
    return teamUser;
  }

  async getTeamUser(teamId: string, userId: string): Promise<TeamUser | null> {
    const command = new GetCommand({
      TableName: this.teamUserTableName,
      Key: {
        team_id: teamId,
        user_id: userId,
      },
    });

    const response = await this.docClient.send(command);
    return (response.Item as TeamUser) || null;
  }

  async getTeamItems(teamId: string): Promise<TeamItemsResponse> {
    const command = new QueryCommand({
      TableName: this.teamItemTableName,
      KeyConditionExpression: "team_id = :teamId",
      ExpressionAttributeValues: {
        ":teamId": teamId,
      },
    });

    const response = await this.docClient.send(command);

    if (!response.Items) {
      throw new Error(`No items found for team ID ${teamId}`);
    }

    const teamItems = response.Items.map((ti) => {
      return {
        itemId: ti.item_id,
        isCollected: ti.is_collected,
      };
    });

    const itemIds = teamItems.map((item) => item.itemId);
    const items = await this.itemService.getItemsByIds(itemIds);

    const teamItemsWithName = teamItems.map((ti) => {
      const item = items.find((i) => i.itemId === ti.itemId);
      return {
        itemId: ti.itemId,
        name: item ? item.name : "Unknown",
        isCollected: ti.isCollected,
      };
    });
    return {
      items: teamItemsWithName,
      teamId,
    };
  }

  private async createTeamItems(
    teamId: string,
    categoryId: string
  ): Promise<void> {
    try {
      const items = await this.itemService.getItemsByCategoryId(categoryId);

      if (items.length === 0) {
        return;
      }

      for (const item of items) {
        try {
          // Check if item has the necessary properties
          const itemId = item.itemId;

          if (!itemId) {
            console.error("Item missing ID:", item);
            continue;
          }

          await this.docClient.send(
            new PutCommand({
              TableName: this.teamItemTableName,
              Item: {
                team_id: teamId,
                item_id: itemId,
                is_collected: false,
              },
            })
          );
        } catch (error) {
          console.error(`Error creating team item:`, error);
        }
      }
    } catch (error) {
      console.error("Error in createTeamItems:", error);
      throw error;
    }
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    try {
      const scanCommand = new ScanCommand({
        TableName: this.teamUserTableName,
        FilterExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      });
      
      const scanResponse = await this.docClient.send(scanCommand);
      
      if (!scanResponse.Items || scanResponse.Items.length === 0) {
        return [];
      }
      const teamIds = scanResponse.Items.map((item) => item.team_id);
      const allTeams = await this.getAllTeams();
      return allTeams.filter((team) => teamIds.includes(team.teamId));
    } catch (error) {
      console.error('Error in getTeamsByUserId:', error);
      throw error;
    }
  }
}
