// day-card.ts
import { DayStore } from "./DayStore";
import type { MealEntry } from "../../../shared/types";
import { sameDates } from "./utilities";

const weekDays = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

export default class DayCard {
  #dayStore: DayStore;
  #element: HTMLElement;
  #tempUrls: string[] = [];

  constructor(dayStore: DayStore, element: HTMLElement) {
    this.#dayStore = dayStore;
    this.#element = element;

    this.#dayStore.addEventListener("dateChanged", () => this.#update());
    this.#dayStore.addEventListener("mealsChanged", () => this.#update());
  }

  #update(): void {
    this.#tempUrls.forEach((url) => URL.revokeObjectURL(url));
    this.#tempUrls = [];
    this.#element.innerHTML = "";

    this.#updateHeader();

    this.#dayStore.meals.forEach((entry: MealEntry) => {
      try {
        const imageUrl = URL.createObjectURL(entry.imageBlob);
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = "Meal photo";
        img.onerror = () =>
          console.error(
            `Błąd ładowania obrazka dla posiłku ${entry.mealData.id}`
          );

        this.#element.appendChild(img);
        this.#tempUrls.push(imageUrl);
      } catch (err) {
        console.error(
          `Nie udało się wyrenderować zdjęcia dla posiłku ${entry.mealData.id}:`,
          err
        );
      }
    });
  }

  #updateHeader(): void {
    const date = this.#dayStore.selectedDate;
    const cardHeader = document.createElement("h2");

    if (sameDates(new Date(), date)) {
      cardHeader.textContent = "Dzisiejsze posiłki";
    } else {
      const selectedWeekDayNumber = date.getDay() === 0 ? 7 : date.getDay();
      const weekDay = weekDays[selectedWeekDayNumber - 1];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      cardHeader.textContent = `${weekDay}, ${day}.${month}.${year}`;
    }

    this.#element.appendChild(cardHeader);
  }
}
