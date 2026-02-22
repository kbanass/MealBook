import "./ts/effects";
import DatePicker from "./ts/DatePicker";
import DayCard from "./ts/DayCard";
import { DayStore } from "./ts/DayStore";
import { CameraController } from "./ts/CameraController";
import MealService from "./ts/MealService";
import { isOpfsSupported } from "./ts/utilities";
import { getElement } from "./ts/utilities";
import { MealEditor } from "./ts/MealEditor";

const opfsOk = await isOpfsSupported();
console.log("OPFS supported:", opfsOk);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("ServiceWorker.js")
    .then(() => console.log("Service Worker zarejestrowany"))
    .catch((err) => console.error("Błąd rejestracji SW", err));
}

const dayStore = new DayStore();

new DatePicker(dayStore);

new DayCard(dayStore, getElement("#day-card"));

const mealService = new MealService(dayStore);

const mealEditor = new MealEditor(
  getElement<HTMLDialogElement>("#meal-editor"),
  mealService
);

new CameraController(
  getElement<HTMLInputElement>("#camera-input"),
  getElement<HTMLButtonElement>("#camera-button"),
  mealEditor
);

mealService.loadMealsFromDB();

document.querySelector("#delete-all-data")?.addEventListener("click", () => {
  console.log("Deleting all data...");
  mealService.deleteAllData();
});

// TODO - Resize i kompresja zdjęć przed zapisem
// TODO - Dokończyć CRUD (Update/Delete/Zmiana orderu)
// TODO - Dokończenie logiki zapisu (debugging edge casy itd.)
// TODO - Dokumentacja wszystkich funkcji

// TODO - Modal z inputem mealData
// TODO - DayCard UI
// TODO - Touch motions (swap right/left...)
// TODO - Deployment ( github, docker, CI/CD)
