import { Request, Response } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Category } from "../models/category.model";
import { Item } from "../models/item.model";
import { Team } from "../models/team.model";
import { TeamItem } from "../models/team-item.model";

export class SeedController {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private itemsTableName: string;
  private categoriesTableName: string;
  private teamsTableName: string;
  private teamItemsTableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.itemsTableName = process.env.ITEMS_TABLE_NAME || "scavenger-hunt-items";
    this.categoriesTableName = process.env.CATEGORIES_TABLE_NAME || "scavenger-hunt-categories";
    this.teamsTableName = process.env.TEAMS_TABLE_NAME || "scavenger-hunt-teams";
    this.teamItemsTableName = process.env.TEAM_ITEMS_TABLE_NAME || "scavenger-hunt-team-items";
  }

  seedData = async (req: Request, res: Response) => {
    try {
      // Create categories based on the image
      const categories: Category[] = [
        {
          categoryId: uuidv4(),
          name: "Hunter"
        },
        {
          categoryId: uuidv4(),
          name: "Birds"
        },
        {
          categoryId: uuidv4(),
          name: "Herd Animals"
        },
        {
          categoryId: uuidv4(),
          name: "Lil Guys"
        },
        {
          categoryId: uuidv4(),
          name: "Large Animals"
        }
      ];
      
      // Create items for each category
      const allItems: Item[] = [];
      
      // Hunter category items
      const hunterItems: Item[] = [
        {
          itemId: uuidv4(),
          categoryId: categories[0].categoryId,
          name: "Wolf",
          sciName: "Canis lupus",
          habitat: "Forests, tundra, mountains, grasslands",
          diet: "Carnivore - deer, elk, moose, and smaller animals",
          biology: "Wolves are highly social animals that live in packs with complex social structures",
          funFact: "Wolves can run up to 35 miles per hour and travel up to 125 miles a day",
          synonyms: ["gray wolf", "timber wolf", "predator", "canine", "pack hunter"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[0].categoryId,
          name: "Fox",
          sciName: "Vulpes vulpes",
          habitat: "Woodlands, grasslands, mountains, deserts",
          diet: "Omnivore - small mammals, birds, insects, fruits",
          biology: "Foxes are solitary hunters with keen senses and adaptable behaviors",
          funFact: "Foxes have whiskers on their legs that help them navigate",
          synonyms: ["red fox", "kit fox", "vulpine", "canid", "reynard"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[0].categoryId,
          name: "Eagle",
          sciName: "Haliaeetus leucocephalus",
          habitat: "Coastal areas, lakes, rivers with tall trees",
          diet: "Carnivore - fish, birds, small mammals",
          biology: "Eagles have excellent eyesight and powerful talons for catching prey",
          funFact: "Eagles can spot prey up to 2 miles away",
          synonyms: ["bald eagle", "golden eagle", "raptor", "bird of prey", "apex predator"]
        }
      ];
      allItems.push(...hunterItems);
      
      // Birds category items
      const birdItems: Item[] = [
        {
          itemId: uuidv4(),
          categoryId: categories[1].categoryId,
          name: "Robin",
          sciName: "Turdus migratorius",
          habitat: "Woodlands, gardens, parks, suburbs",
          diet: "Omnivore - worms, insects, fruits, berries",
          biology: "Robins are songbirds known for their red breasts and cheerful songs",
          funFact: "Robins can produce up to three successful broods in one year",
          synonyms: ["American robin", "redbreast", "songbird", "thrush", "migratory bird"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[1].categoryId,
          name: "Hummingbird",
          sciName: "Trochilidae",
          habitat: "Gardens, forests, meadows with flowering plants",
          diet: "Nectar from flowers, small insects",
          biology: "Hummingbirds have the highest metabolism of any animal except insects",
          funFact: "Hummingbirds are the only birds that can fly backwards",
          synonyms: ["nectar bird", "flying jewel", "hovering bird", "colibri", "pollinator"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[1].categoryId,
          name: "Owl",
          sciName: "Strigiformes",
          habitat: "Forests, deserts, mountains, grasslands",
          diet: "Carnivore - small mammals, birds, insects",
          biology: "Owls have specialized feathers that allow them to fly silently",
          funFact: "An owl's eyes take up more than 50% of its skull",
          synonyms: ["night bird", "nocturnal hunter", "wise bird", "hooter", "strigid"]
        }
      ];
      allItems.push(...birdItems);
      
      // Herd Animals category items
      const herdItems: Item[] = [
        {
          itemId: uuidv4(),
          categoryId: categories[2].categoryId,
          name: "Bison",
          sciName: "Bison bison",
          habitat: "Grasslands, prairies, plains",
          diet: "Herbivore - grasses and low-growing plants",
          biology: "Bison are the largest land mammals in North America",
          funFact: "Despite weighing up to 2,000 pounds, bison can run up to 35 mph",
          synonyms: ["buffalo", "American buffalo", "plains bison", "grazer", "ungulate"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[2].categoryId,
          name: "Zebra",
          sciName: "Equus quagga",
          habitat: "Grasslands, savannas, woodlands",
          diet: "Herbivore - grasses, leaves, stems",
          biology: "Each zebra has a unique stripe pattern, like a fingerprint",
          funFact: "Zebras sleep standing up to quickly escape predators",
          synonyms: ["striped horse", "equid", "plains zebra", "African equine", "herd equine"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[2].categoryId,
          name: "Deer",
          sciName: "Cervidae",
          habitat: "Forests, grasslands, mountains",
          diet: "Herbivore - leaves, twigs, fruits, nuts",
          biology: "Male deer grow and shed antlers annually",
          funFact: "Deer can jump up to 10 feet high and 30 feet forward",
          synonyms: ["buck", "doe", "stag", "cervid", "whitetail"]
        }
      ];
      allItems.push(...herdItems);
      
      // Lil Guys category items
      const lilGuysItems: Item[] = [
        {
          itemId: uuidv4(),
          categoryId: categories[3].categoryId,
          name: "Squirrel",
          sciName: "Sciuridae",
          habitat: "Forests, parks, urban areas",
          diet: "Omnivore - nuts, seeds, fruits, insects",
          biology: "Squirrels have excellent spatial memory to remember where they've buried nuts",
          funFact: "Squirrels plant thousands of trees by forgetting where they buried their nuts",
          synonyms: ["tree climber", "nut gatherer", "rodent", "bushy-tail", "sciurid"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[3].categoryId,
          name: "Hedgehog",
          sciName: "Erinaceinae",
          habitat: "Woodlands, gardens, hedgerows",
          diet: "Omnivore - insects, snails, frogs, berries",
          biology: "Hedgehogs have between 5,000-7,000 spines which are modified hairs",
          funFact: "Hedgehogs can roll into a tight ball when threatened",
          synonyms: ["spiny mammal", "insectivore", "prickly ball", "urchin", "erinaceid"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[3].categoryId,
          name: "Mouse",
          sciName: "Mus musculus",
          habitat: "Fields, forests, human settlements",
          diet: "Omnivore - seeds, grains, fruits, insects",
          biology: "Mice have excellent hearing and sense of smell",
          funFact: "A mouse's heart beats 500-600 times per minute",
          synonyms: ["rodent", "field mouse", "house mouse", "murine", "small mammal"]
        }
      ];
      allItems.push(...lilGuysItems);
      
      // Large Animals category items
      const largeItems: Item[] = [
        {
          itemId: uuidv4(),
          categoryId: categories[4].categoryId,
          name: "Elephant",
          sciName: "Loxodonta africana",
          habitat: "Savannas, forests, deserts, marshes",
          diet: "Herbivore - grasses, leaves, fruits, bark",
          biology: "Elephants are the largest land mammals with highly developed brains",
          funFact: "Elephants can recognize themselves in mirrors, showing self-awareness",
          synonyms: ["pachyderm", "tusker", "bull elephant", "jumbo", "proboscidean"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[4].categoryId,
          name: "Giraffe",
          sciName: "Giraffa camelopardalis",
          habitat: "Savannas, grasslands, open woodlands",
          diet: "Herbivore - leaves, buds, fruits from tall trees",
          biology: "Giraffes have the same number of neck vertebrae as humans - seven",
          funFact: "A giraffe's tongue can be up to 21 inches long",
          synonyms: ["tall mammal", "long-neck", "spotted giant", "tallest animal", "savanna browser"]
        },
        {
          itemId: uuidv4(),
          categoryId: categories[4].categoryId,
          name: "Rhino",
          sciName: "Rhinocerotidae",
          habitat: "Grasslands, savannas, forests",
          diet: "Herbivore - grasses, leaves, fruits, berries",
          biology: "Rhinos have thick protective skin that can be up to 2 inches thick",
          funFact: "Despite weighing over 2 tons, rhinos can run at speeds of up to 30 mph",
          synonyms: ["rhinoceros", "horned mammal", "armored giant", "thick-skinned beast", "megafauna"]
        }
      ];
      allItems.push(...largeItems);
      
      // Sample team for demo
      const team: Team = {
        teamId: uuidv4(),
        name: "Demo Team",
        code: "DEMO123",
        isCompleted: false,
        categoryId: categories[1].categoryId // Using Birds category for demo team
      };
      
      // Create team items for Hunter category
      const teamItems: TeamItem[] = hunterItems.map(item => ({
        teamId: team.teamId,
        itemId: item.itemId,
        isCollected: false
      }));
      
      // Insert categories
      for (const category of categories) {
        await this.docClient.send(
          new PutCommand({
            TableName: this.categoriesTableName,
            Item: {
              name: category.name,
              category_id: category.categoryId
            }
          })
        );
      }
      
      // Insert items
      for (const item of allItems) {
        await this.docClient.send(
          new PutCommand({
            TableName: this.itemsTableName,
            Item: {
              item_id: item.itemId,
              category_id: item.categoryId,
              name: item.name,
              sci_name: item.sciName,
              habitat: item.habitat,
              diet: item.diet,
              biology: item.biology,
              fun_fact: item.funFact,
              synonyms: item.synonyms
            }
          })
        );
      }
      
      // Insert team
      await this.docClient.send(
        new PutCommand({
          TableName: this.teamsTableName,
          Item: {
            name: team.name,
            code: team.code,
            team_id: team.teamId,
            category_id: team.categoryId,
            is_completed: team.isCompleted
          }
        })
      );
      
      // Insert team items
      for (const teamItem of teamItems) {
        await this.docClient.send(
          new PutCommand({
            TableName: this.teamItemsTableName,
            Item: {
              team_id: teamItem.teamId,
              item_id: teamItem.itemId,
              is_collected: teamItem.isCollected
            }
          })
        );
      }
      
      return res.status(200).json({
        message: "Seed data created successfully",
        data: {
          categories,
          items: allItems,
          team,
          teamItems
        }
      });
    } catch (error) {
      console.error("Error seeding data:", error);
      return res.status(500).json({
        message: "Failed to seed data"
      });
    }
  };
}
