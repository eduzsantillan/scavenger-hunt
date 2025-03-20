import { Request, Response } from 'express';
import { ThemeService } from '../services/theme.service';

export class ThemeController {
  private themeService: ThemeService;

  constructor() {
    this.themeService = new ThemeService();
  }

  getAllThemes = async (req: Request, res: Response) => {
    try {
      const themes = await this.themeService.getAllThemes();
      return res.status(200).json(themes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch themes' 
      });
    }
  };
}
