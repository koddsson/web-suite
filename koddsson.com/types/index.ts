export interface Note {
  slug: string;
  timestamp: number;
  isNote: boolean;
  isFavorite: boolean;
  photo: string;
  type: "note" | "favorite";
}
