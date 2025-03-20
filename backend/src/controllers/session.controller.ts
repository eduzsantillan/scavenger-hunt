import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { ItemService } from '../services/item.service';

export class SessionController {
  private sessionService: SessionService;
  private itemService: ItemService;

  constructor() {
    this.sessionService = new SessionService();
    this.itemService = new ItemService();
  }

  startSession = async (req: Request, res: Response) => {
    try {
      const { email, themeId } = req.body;
      
      const items = await this.itemService.getItemsByThemeId(themeId);
      
      if (!items.length) {
        return res.status(404).json({ 
          message: `No items found for theme ID: ${themeId}` 
        });
      }
      
      const session = await this.sessionService.createOrUpdateSession(email, themeId, items);
      
      return res.status(201).json({
        message: 'Session started successfully',
        sessionId: session.sessionId,
        items: session.items
      });
    } catch (error) {
      console.error('Error starting session:', error);
      return res.status(500).json({ 
        message: 'Failed to start session' 
      });
    }
  };
}
