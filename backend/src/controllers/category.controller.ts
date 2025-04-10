import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }
  
  listCategories = async (_req: Request, res: Response) => {
    try {
      const categories = await this.categoryService.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error("Error listing categories:", error);
      return res.status(500).json({
        message: "Failed to list categories"
      });
    }
  };

  getCategoryById = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      
      const category = await this.categoryService.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: `Category with ID ${categoryId} not found` });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      console.error("Error getting category:", error);
      return res.status(500).json({
        message: "Failed to get category"
      });
    }
  };
}
