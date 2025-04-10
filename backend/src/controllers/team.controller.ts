import { Request, Response } from "express";
import { TeamService } from "../services/team.service";

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }
  
  testEndpoint = async (req: Request, res: Response) => {
    console.log('Test endpoint reached!');
    console.log('Request params:', req.params);
    return res.status(200).json({
      message: 'Test endpoint working',
      params: req.params,
      timestamp: new Date().toISOString()
    });
  }

  createTeam = async (req: Request, res: Response) => {
    try {
      const { name, userId, categoryId } = req.body;
      
      const team = await this.teamService.createTeam(name, userId, categoryId);
      
      return res.status(201).json({
        message: "Team created successfully",
        team
      });
    } catch (error) {
      console.error("Error creating team:", error);
        if (error instanceof Error) {
            if (error.message === `Category with ID ${req.body.categoryId} not found`) {
            return res.status(404).json({ message: error.message });
            } else if (error.message === `Team with name ${req.body.name} already exists`) {
            return res.status(400).json({ message: error.message });
            }
        }
      return res.status(500).json({
        message: "Failed to create team"
      });
    }
  };

  listTeams = async (_req: Request, res: Response) => {
    try {
      const teams = await this.teamService.getAllTeams();
      return res.status(200).json(teams);
    } catch (error) {
      console.error("Error listing teams:", error);
      return res.status(500).json({
        message: "Failed to list teams"
      });
    }
  };

  joinTeam = async (req: Request, res: Response) => {
    try {
      const { userId, teamId, code } = req.body;
      
      await this.teamService.addUserToTeam(teamId, userId, code);
      
      return res.status(200).json({
        message: "User added to team successfully"
      });
    } catch (error) {
      console.error("Error joining team:", error);
      
      if (error instanceof Error) {
        if (error.message === `Team with ID ${req.body.teamId} not found`) {
          return res.status(404).json({ message: error.message });
        } else if (error.message === "User is already a member of this team") {
          return res.status(400).json({ message: error.message });
        } else if (error.message === "Team is already completed") {
          return res.status(400).json({ message: error.message });
        } else if (error.message === "Invalid team code") {
          return res.status(400).json({ message: error.message });
        }
      }
      
      return res.status(500).json({
        message: "Failed to join team"
      });
    }
  };

  getTeamItems = async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const team = await this.teamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: `Team with ID ${teamId} not found` });
      }
      
      const response = await this.teamService.getTeamItems(team.teamId);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error getting team items:", error);
      return res.status(500).json({
        message: "Failed to get team items"
      });
    }
  };

  getTeamsByUserId = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const teams = await this.teamService.getTeamsByUserId(userId);
      console.log(`Found ${teams.length} teams for user ID: ${userId}`);
      
      // Return the teams, even if it's an empty array
      console.log('Returning successful response');
      return res.status(200).json({
        userId: userId,
        teams: teams,
        count: teams.length
      });
    } catch (error) {
      console.error("Error getting teams by user ID:", error);
      
      // Return detailed error information to help with debugging
      console.log('Returning error response');
      return res.status(500).json({
        message: "Failed to get teams by user ID",
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.userId,
        timestamp: new Date().toISOString()
      });
    }
  };
}
