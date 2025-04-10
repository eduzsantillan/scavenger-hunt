export interface TeamItem {
  teamId: string;
  itemId: string;
  isCollected: boolean;
  labelsDetected?: string[];
  imgKey?: string;
}
