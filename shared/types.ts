export type Fullness = 0 | 1 | 2 | 3;
// Fullness before having a meal

export type Trigger = "stress" | "boredom" | "social" | "routine" | "craving";
// Why do I eat?

export type Mood = "satisfied" | "neutral" | "guilt";
// Emotional satisfaction after meal

export interface Meal {
  id: string; // UUID
  photoId: string; // Name of photo file
  timestamp: string; // Full ISO date
  date: string; // Date in YYYY-MM-DD format (for IndexedDB indexing and filtering)
  order: number; // Order in given day

  before: {
    fullness: Fullness;
    trigger: Trigger;
  };

  after?: {
    mood: Mood;
    note?: string;
  };

  isSynced: boolean;
}

export interface MealEntry {
  mealData: Meal;
  imageBlob: Blob;
}

export type MealFormData = Pick<Meal, "before" | "after" | "isSynced">;
