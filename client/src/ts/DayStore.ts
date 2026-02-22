import type { MealEntry } from "../../../shared/types";

export class DayStore extends EventTarget {
  selectedDate: Date;
  todaysDate: Date;
  meals: MealEntry[];

  constructor() {
    super();
    this.selectedDate = new Date();
    this.todaysDate = new Date();
    this.meals = [];
  }

  setDate(newDate: Date): void {
    this.selectedDate = newDate;
    this.dispatchEvent(new Event("dateChanged"));
  }

  setMeals(meals: MealEntry[]): void {
    this.meals = meals;
    this.dispatchEvent(new Event("mealsChanged"));
  }

  addMeal(meal: MealEntry): void {
    this.meals.push(meal);
    this.dispatchEvent(new Event("mealsChanged"));
  }
}
