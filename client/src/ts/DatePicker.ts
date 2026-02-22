import { DayStore } from "./DayStore";
import { sameDates, getMonthName } from "./utilities";
import { getElement } from "./utilities";

export default class DatePicker {
  #dayStore: DayStore;
  #selectedDate: Date;
  #todaysDate: Date;
  #selectedWeekDates: Date[];
  #controller: AbortController;

  constructor(dayStore: DayStore) {
    this.#dayStore = dayStore;
    this.#selectedDate = dayStore.selectedDate;
    this.#todaysDate = dayStore.todaysDate;
    this.#selectedWeekDates = [];
    this.#controller = new AbortController();

    this.#dayStore.addEventListener("dateChanged", () => {
      this.#selectedDate = this.#dayStore.selectedDate;
      this.#update();
    });

    this.#setWeekChanger();
    this.#update();
  }

  #setWeekChanger(): void {
    getElement(".next-week").addEventListener("click", () =>
      this.#goToNextWeek()
    );
    getElement(".previus-week").addEventListener("click", () =>
      this.#goToPreviusWeek()
    );
  }

  #setDate(date: Date): void {
    this.#dayStore.setDate(date);
  }

  #goToNextWeek(): void {
    const date = this.#selectedDate;
    date.setDate(this.#selectedDate.getDate() + 7);
    this.#dayStore.setDate(date);
  }

  #goToPreviusWeek(): void {
    const date = this.#selectedDate;
    date.setDate(this.#selectedDate.getDate() - 7);
    this.#dayStore.setDate(date);
  }

  #update(): void {
    this.#calculateSelectedWeekDates();
    this.#controller.abort();
    this.#controller = new AbortController();

    const datePickerMonth = getElement<HTMLElement>(".date-picker__month");
    const monthName = getMonthName(this.#selectedDate);
    datePickerMonth.textContent =
      monthName + " " + this.#selectedDate.getFullYear();

    const datePickerListItems = document.querySelectorAll<HTMLLIElement>(
      ".date-picker__days-list li"
    );

    datePickerListItems.forEach((li, index) => {
      const dayNumberElement = li.querySelector<HTMLElement>(".day-number")!;
      dayNumberElement.innerHTML = String(
        this.#selectedWeekDates[index].getDate()
      );

      const buttonElement = li.querySelector<HTMLButtonElement>("button")!;
      buttonElement.addEventListener(
        "click",
        () => {
          this.#setDate(this.#selectedWeekDates[index]);
        },
        { signal: this.#controller.signal }
      );

      if (sameDates(this.#selectedWeekDates[index], this.#todaysDate)) {
        buttonElement.ariaCurrent = "date";
      } else {
        buttonElement.removeAttribute("aria-current");
      }

      if (sameDates(this.#selectedWeekDates[index], this.#selectedDate)) {
        buttonElement.ariaSelected = "true";
      } else {
        buttonElement.ariaSelected = "false";
      }
    });
  }

  #calculateSelectedWeekDates(): void {
    this.#selectedWeekDates = [];
    const selectedWeekDayNumber =
      this.#selectedDate.getDay() === 0 ? 7 : this.#selectedDate.getDay();

    this.#selectedWeekDates.push(this.#selectedDate);

    for (let i = selectedWeekDayNumber + 1; i <= 7; i++) {
      const date = new Date(this.#selectedDate);
      date.setDate(this.#selectedDate.getDate() + (i - selectedWeekDayNumber));
      this.#selectedWeekDates.push(date);
    }

    for (let i = selectedWeekDayNumber - 1; i > 0; i--) {
      const date = new Date(this.#selectedDate);
      date.setDate(this.#selectedDate.getDate() - (selectedWeekDayNumber - i));
      this.#selectedWeekDates.unshift(date);
    }
  }
}
