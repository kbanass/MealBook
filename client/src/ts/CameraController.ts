import { MealEditor } from "./MealEditor";
import { ImageCompressor } from "./utilities";

export class CameraController {
  #imageCompressor: ImageCompressor;

  constructor(
    cameraInput: HTMLInputElement,
    cameraButton: HTMLButtonElement,
    mealDialog: MealEditor
  ) {
    this.#imageCompressor = new ImageCompressor(1200, 0.7);

    cameraButton.addEventListener("click", () => cameraInput.click());

    cameraInput.addEventListener("change", async (event) => {
      const photo = (event.target as HTMLInputElement).files?.[0];
      if (!photo) return;

      try {
        const compressedPhoto = await this.#imageCompressor.compress(photo);
        mealDialog.open(compressedPhoto);
      } catch (error) {
        console.error("[CameraController] Błąd kompresji zdjęcia:", error);
      }

      cameraInput.value = "";
    });
  }
}
