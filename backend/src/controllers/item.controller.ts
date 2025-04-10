import { Request, Response } from "express";
import { ItemService } from "../services/item.service";

export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  getItemById = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const item = await this.itemService.getItemById(itemId);

      if (!item) {
        return res.status(404).json({
          message: `Item with ID ${itemId} not found`,
        });
      }

      return res.status(200).json(item);
    } catch (error) {
      console.error(
        `Error fetching item with ID ${req.params.itemId}:`,
        error
      );
      return res.status(500).json({
        message: "Failed to fetch item details",
      });
    }
  };
}
