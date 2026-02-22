import MealService from "./MealService";
import type { Fullness, Trigger, MealFormData } from "../../../shared/types";

export class MealEditor {
  #dialog: HTMLDialogElement;
  #mealService: MealService;
  #imageBlob: Blob | null = null;
  #mealPhotoUrl: string | null;

  constructor(dialog: HTMLDialogElement, mealService: MealService) {
    this.#dialog = dialog;
    this.#mealService = mealService;
    this.#mealPhotoUrl = null;

    this.#dialog.addEventListener("submit", (e) => {
      e.preventDefault();
      this.#handleSubmit();
    });

    this.#dialog.addEventListener("click", (e) => {
      const rect = this.#dialog.getBoundingClientRect();
      const clickedOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;

      if (clickedOutside) this.#close();
    });

    this.#dialog
      .querySelector(".exit-button")
      ?.addEventListener("click", () => this.#close());
  }

  open(imageBlob: Blob): void {
    this.#imageBlob = imageBlob;
    this.#mealPhotoUrl = URL.createObjectURL(imageBlob);
    console.log(this.#mealPhotoUrl);
    this.#reset();
    this.#dialog
      .querySelector(".meal-editor__meal-image")
      ?.setAttribute("src", this.#mealPhotoUrl);

    this.#dialog.showModal();
  }

  #handleSubmit(): void {
    if (!this.#imageBlob) return;

    const formData = new FormData(this.#dialog.querySelector("form")!);

    const mealFormData: MealFormData = {
      before: {
        fullness: Number(formData.get("fullness")) as Fullness,
        trigger: formData.get("trigger") as Trigger,
      },
      isSynced: false,
    };

    this.#mealService.saveMeal(mealFormData, this.#imageBlob);
    this.#close();
  }

  #close(): void {
    this.#dialog.close();
    this.#imageBlob = null;
    if (this.#mealPhotoUrl) URL.revokeObjectURL(this.#mealPhotoUrl);
    this.#mealPhotoUrl = null;
  }

  #reset(): void {
    this.#dialog.querySelector("form")?.reset();
  }
}
