import { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ItemService } from "../services/item.service";
import multer from "multer";

export class UploadController {
  private s3Client: S3Client;
  private bucketName: string;
  private itemService: ItemService;
  public upload: multer.Multer;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1"
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "scavenger-hunt-images-bucket";
    this.itemService = new ItemService();
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Only images are allowed"));
        }
      },
    });
  }

  uploadImage = async (req: Request, res: Response) => {
    try {
      const { sessionId, itemId } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const item = await this.itemService.getItemById(itemId);
      console.log("item: ", item);
      if (!item) {
        return res
          .status(404)
          .json({ message: `Item with ID ${itemId} not found` });
      }

      const fileExtension = file.originalname.split(".").pop();
      const key = `${sessionId}/${itemId}/image.${fileExtension}`;
      const requiredList = item.synonyms;
      requiredList.push(item.name);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          requiredList: JSON.stringify(requiredList),
        },
      });

      await this.s3Client.send(command);

      return res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({
        message: "Failed to upload image",
      });
    }
  };
}
