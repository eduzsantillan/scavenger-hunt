export interface Session {
  sessionId: string;
  itemId: string;
  themeId: string;
  email: string;
  isCollected: boolean;
  processedAt: string;
  allDetectedLabels?: string[];
  imageKey?: string;
}
