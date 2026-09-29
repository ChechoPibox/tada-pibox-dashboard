// ============================================================
// CAPA DE ALMACENAMIENTO INDEXEDDB - TADA / PIBOX
// Elimina los límites de 5MB de localStorage y caídas de memoria
// ============================================================

const TaDaDB = {
  dbName: 'TaDaPiboxOperationsDB',
  version: 1,
  db: null,

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Store para turnos históricos de la Malla (Sheet 1)
        if (!db.objectStoreNames.contains('malla_shifts')) {
          const store = db.createObjectStore('malla_shifts', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('pilot', 'pilot', { unique: false });
          store.createIndex('city', 'city', { unique: false });
          store.createIndex('store', 'store', { unique: false });
        }

        // Store para turnos de programación activa/preventiva (Sheet 2)
        if (!db.objectStoreNames.contains('programacion_shifts')) {
          const progStore = db.createObjectStore('programacion_shifts', { keyPath: 'id', autoIncrement: true });
          progStore.createIndex('date', 'date', { unique: false });
          progStore.createIndex('store', 'store', { unique: false });
          progStore.createIndex('city', 'city', { unique: false });
          progStore.createIndex('pilot', 'pilot', { unique: false });
        }

        // Store para metadatos y estado de sincronización
        if (!db.objectStoreNames.contains('app_meta')) {
          db.createObjectStore('app_meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  async saveMallaShifts(shifts) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('malla_shifts', 'readwrite');
      const store = tx.objectStore('malla_shifts');
      store.clear(); // Reemplazar con ventana actualizada
      for (const shift of shifts) {
        store.add(shift);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async getMallaShifts() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('malla_shifts', 'readonly');
      const store = tx.objectStore('malla_shifts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async saveProgramacionShifts(shifts) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('programacion_shifts', 'readwrite');
      const store = tx.objectStore('programacion_shifts');
      store.clear();
      for (const shift of shifts) {
        store.add(shift);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async getProgramacionShifts() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('programacion_shifts', 'readonly');
      const store = tx.objectStore('programacion_shifts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async setMeta(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_meta', 'readwrite');
      const store = tx.objectStore('app_meta');
      store.put({ key, value, updated_at: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async getMeta(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_meta', 'readonly');
      const store = tx.objectStore('app_meta');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Limpia TODOS los stores de IndexedDB.
   * Usar cuando se detecta caché obsoleto (ej: datos de una sola ciudad con el GID incorrecto).
   */
  async clearAll() {
    const db = await this.open();
    const storeNames = ['malla_shifts', 'programacion_shifts', 'app_meta'];
    const promises = storeNames.map(storeName => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    });
    return Promise.all(promises);
  }
};

