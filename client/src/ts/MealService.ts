import type { Meal, MealEntry, MealFormData } from "../../../shared/types";
import { getLocalISOString } from "./utilities";
import config from "./config";
import { DayStore } from "./DayStore";

type WorkerResponse =
  | { type: "LOAD_SUCCESS"; payload: MealEntry[] }
  | { type: "SAVE_SUCCESS"; payload: MealEntry }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "DELETE_ALL_DATA_SUCCESS" }
  | { type: "DELETE_ALL_DATA_ERROR"; error: string };

export default class MealService {
  #dayStore: DayStore;
  #storageWorker: Worker;

  constructor(dayStore: DayStore) {
    this.#dayStore = dayStore;
    this.#storageWorker = new Worker(
      new URL("./storage.worker.ts", import.meta.url),
      { type: "module" }
    );
    this.#init();
  }

  #init(): void {
    this.#dayStore.addEventListener("dateChanged", () => {
      this.loadMealsFromDB();
    });

    this.#storageWorker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const { type } = event.data;

        switch (type) {
          case "LOAD_SUCCESS":
            this.#loadMealsToDayStore(event.data.payload);
            break;
          case "SAVE_SUCCESS":
            this.#addMealToDayStore(event.data.payload);
            break;
          case "SAVE_ERROR":
          case "LOAD_ERROR":
            console.error(`Error: [${type}], ${event.data.error}`);
            break;
          case "DELETE_ALL_DATA_SUCCESS":
            this.#deleteStoreData();
            break;
          case "DELETE_ALL_DATA_ERROR":
            console.error(`Error: [${type}], ${event.data.error}`);
            break;
        }
      }
    );

    this.loadMealsFromDB();
  }

  loadMealsFromDB(): void {
    const date = getLocalISOString(this.#dayStore.selectedDate).split("T")[0];
    this.#storageWorker.postMessage({ type: "LOAD_MEALS", payload: { date } });
  }

  saveMeal = (mealInfo: MealFormData, imageBlob: Blob): void => {
    const id = crypto.randomUUID();
    const mealData: Meal = {
      id,
      photoId: `${id}.webp`,
      timestamp: getLocalISOString(),
      date: getLocalISOString(this.#dayStore.selectedDate).split("T")[0],
      order: this.#dayStore.meals.length,
      ...mealInfo,
    };

    this.#storageWorker.postMessage({
      type: "SAVE_MEAL",
      payload: { mealData, imageBlob },
    });
  };

  #loadMealsToDayStore(meals: MealEntry[]): void {
    const sorted = [...meals].sort(
      (a, b) => a.mealData.order - b.mealData.order
    );
    this.#dayStore.setMeals(sorted);
  }

  #addMealToDayStore(meal: MealEntry): void {
    const sorted = [...this.#dayStore.meals, meal].sort(
      (a, b) => a.mealData.order - b.mealData.order
    );
    this.#dayStore.setMeals(sorted);
  }

  // ! DEBUG ONLY
  deleteAllData(): void {
    if (config.env === "prod") return;
    this.#storageWorker.postMessage({ type: "DELETE_ALL_DATA" });
  }

  #deleteStoreData(): void {
    this.#dayStore.setMeals([]);
  }
}
