import { Request, Response } from "express";
import { ItemService } from "../services/item.service";

export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  getItemsByThemeId = async (req: Request, res: Response) => {
    try {
      const { themeId } = req.params;
      const items = await this.itemService.getItemsByThemeId(themeId);

      if (!items.length) {
        return res.status(404).json({
          message: `No items found for theme ID: ${themeId}`,
        });
      }

      return res.status(200).json(items);
    } catch (error) {
      console.error(
        `Error fetching items for theme ${req.params.themeId}:`,
        error
      );
      return res.status(500).json({
        message: "Failed to fetch items for the specified theme",
      });
    }
  };
}
