import axios from "axios";

const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface Team {
  team_id: string;
  name: string;
  code: string;
  category_id: string;
  is_completed?: boolean;
}

export interface Category {
  category_id: string;
  name: string;
  description: string;
}

export interface Item {
  itemId: string;
  name: string;
  isCollected?: boolean;
}

export interface ItemDetails {
  categoryId: string;
  name: string;
  sciName: string;
  habitat: string;
  diet: string;
  biology: string;
  funFact: string;
  synonyms: string[];
}

export interface TeamItem {
  teamId: string;
  items: Item[];
}

export const userService = {
  createUser: async (name: string, email: string): Promise<User> => {
    const response = await api.post("/users", { name, email });
    return response.data.user;
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/id/${userId}`);
    return response.data;
  },

  getUserByEmail: async (email: string): Promise<User> => {
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  },
};

export const teamService = {
  createTeam: async (
    name: string,
    userId: string,
    categoryId: string
  ): Promise<Team> => {
    const response = await api.post("/teams", { name, userId, categoryId });
    return response.data.team;
  },

  getAllTeams: async (): Promise<Team[]> => {
    const response = await api.get("/teams");
    console.log("All teams response:", response.data);
    return response.data.map((team: any) => ({
        team_id: team.team_id || team.teamId,
        name: team.name,
        code: team.code,
        category_id: team.category_id || team.categoryId,
        is_completed: team.is_completed || team.isCompleted,
    }));
  },

  joinTeam: async (
    userId: string,
    teamId: string,
    code: string
  ): Promise<void> => {
    await api.put("/teams/join", { userId, teamId, code });
  },

  getUserTeams: async (userId: string): Promise<Team[]> => {
    try {
      const response = await api.get(`/teams/user-teams/${userId}`);
      console.log("User teams response:", response.data);

      // Handle the response format which includes teams array inside data
      if (response.data && Array.isArray(response.data.teams)) {
        const teams = response.data.teams.map((team: any) => {
          console.log("Individual team data:", team);
          // Handle both camelCase and snake_case formats from backend
          return {
            // Ensure we have both formats for compatibility
            team_id: team.team_id || team.teamId,
            teamId: team.team_id || team.teamId,
            name: team.name,
            code: team.code,
            category_id: team.category_id || team.categoryId,
            categoryId: team.category_id || team.categoryId,
            is_completed: team.is_completed || team.isCompleted,
            isCompleted: team.is_completed || team.isCompleted,
          };
        });
        console.log("Processed teams:", teams);
        return teams;
      } else if (Array.isArray(response.data)) {
        // Handle case where the response might be a direct array
        console.log("Response is a direct array");
        return response.data.map((team: any) => ({
          team_id: team.team_id || team.teamId,
          teamId: team.team_id || team.teamId,
          name: team.name,
          code: team.code,
          category_id: team.category_id || team.categoryId,
          categoryId: team.category_id || team.categoryId,
          is_completed: team.is_completed || team.isCompleted,
          isCompleted: team.is_completed || team.isCompleted,
        }));
      }
      console.warn("Unexpected response format:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching user teams:", error);
      return [];
    }
  },

  getTeamItems: async (teamId: string): Promise<TeamItem> => {
    try {
      const response = await api.get(`/teams/${teamId}/items`);
      console.log("Team items response:", response.data);

      const listItems = response.data.items;

      const processedItems = listItems.map((item: any) => {
        return {
          itemId: item.item_id || item.itemId,
          name: item.name,
          isCollected: item.is_collected || item.isCollected,
        };
      });
      return {
        items: processedItems,
        teamId: response.data.teamId,
      };
    } catch (error) {
      console.error("Error fetching team items:", error);
      throw error;
    }
  },
};

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data;
  },

  getCategoryById: async (categoryId: string): Promise<Category> => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },
};

export const itemService = {
  getItemById: async (itemId: string): Promise<Item> => {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  },
  
  getItemDetails: async (itemId: string): Promise<ItemDetails> => {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  },
};

export const uploadService = {
  uploadImage: async (
    teamId: string,
    itemId: string,
    imageFile: File
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axios.post(
      `${API_URL}/upload/${teamId}/${itemId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};
