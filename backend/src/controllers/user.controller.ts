import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import {TeamService} from "../services/team.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  createUser = async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      const user = await this.userService.createUser(name, email);
      
      return res.status(201).json({
        message: "User created successfully",
        user
      });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error && error.message === "User with this email already exists") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to create user"
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: `User with ID ${userId} not found` });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      return res.status(500).json({
        message: "Failed to get user"
      });
    }
  };

  getUserByEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: `User with email ${email} not found` });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error getting user by email:", error);
      return res.status(500).json({
        message: "Failed to get user by email"
      });
    }
  };
}
