import type { Meal, MealEntry } from "../../../shared/types";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("MealBook", 1);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("meals")) {
        const store = db.createObjectStore("meals", { keyPath: "id" });
        store.createIndex("date_idx", "date");
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

type WorkerMessage =
  | { type: "SAVE_MEAL"; payload: MealEntry }
  | { type: "LOAD_MEALS"; payload: { date: string } }
  | { type: "DELETE_ALL_DATA" };

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  try {
    switch (type) {
      case "SAVE_MEAL": {
        await saveMeal(event.data.payload);
        self.postMessage({ type: "SAVE_SUCCESS", payload: event.data.payload });
        break;
      }
      case "LOAD_MEALS": {
        const meals = await loadMeals(event.data.payload.date);
        self.postMessage({ type: "LOAD_SUCCESS", payload: meals });
        break;
      }
      case "DELETE_ALL_DATA": {
        await deleteAllData();
        self.postMessage({ type: "DELETE_ALL_DATA_SUCCESS" });
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[storage.worker] Error in ${type}:`, error);
    self.postMessage({ type: `${type}_ERROR`, error: message });
  }
};

async function saveMeal(meal: MealEntry): Promise<void> {
  const rootDir = await navigator.storage.getDirectory();
  const photosDir = await rootDir.getDirectoryHandle("photos", {
    create: true,
  });
  const fileHandle = await photosDir.getFileHandle(meal.mealData.photoId, {
    create: true,
  });

  const buffer = await meal.imageBlob.arrayBuffer();
  const syncHandle = await fileHandle.createSyncAccessHandle();
  try {
    syncHandle.write(buffer);
    syncHandle.flush();
  } finally {
    syncHandle.close(); // musi być zamknięty nawet przy błędzie
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("meals", "readwrite");
    const store = transaction.objectStore("meals");
    store.put(meal.mealData);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function loadMeals(date: string): Promise<MealEntry[]> {
  const db = await getDB();

  const meals = await new Promise<Meal[]>((resolve, reject) => {
    const transaction = db.transaction("meals", "readonly");
    const index = transaction.objectStore("meals").index("date_idx");
    const request = index.getAll(IDBKeyRange.only(date));

    request.onsuccess = () => resolve(request.result as Meal[]);
    request.onerror = () => reject(request.error);
  });

  if (meals.length === 0) return []; // shortcut - nie dotykaj OPFS jeśli nie ma posiłków

  const rootDir = await navigator.storage.getDirectory();
  const photosDir = await rootDir.getDirectoryHandle("photos", {
    create: true,
  });

  return Promise.all(
    meals.map(async (meal): Promise<MealEntry> => {
      const handle = await photosDir.getFileHandle(meal.photoId);
      const file = await handle.getFile();
      return { mealData: meal, imageBlob: file };
    })
  );
}
async function deleteAllData(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch (e) {
      console.error("[storage.worker] Closing db error:", e);
    }
    dbPromise = null;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("MealBook");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database delete blocked"));
  });

  try {
    const rootDir = await navigator.storage.getDirectory();
    await rootDir.removeEntry("photos", { recursive: true });
  } catch {
    console.warn("[storage.worker] Error when deleting files from OPFS");
  }
}
