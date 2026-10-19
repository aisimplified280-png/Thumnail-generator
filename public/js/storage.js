// AI SIMPLIFIED LAB - STORAGE & HISTORY ENGINE
// IndexedDB persistence for offline projects and uploaded assets, with full Undo/Redo stack.

window.StudioStorage = (function() {
  'use strict';

  const DB_NAME = 'as_thumb_studio_db';
  const OLD_DB_NAME = 'ThumbnailStudioDB';
  const DB_VERSION = 1;
  const STORE_PROJECTS = 'projects';
  const STORE_ASSETS = 'assets';

  let dbPromise = null;

  function initDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
        }
      };

  // Asynchronous migration of projects from legacy ThumbnailStudioDB
  async function migrateLegacyProjects(newDb) {
    if (!window.indexedDB) return;
    try {
      const isMigrated = localStorage.getItem('as_thumb_idb_migrated');
      if (isMigrated === 'true') return;

      // Check if databases() method exists to avoid creating an empty legacy DB
      if (typeof indexedDB.databases === 'function') {
        const dbs = await indexedDB.databases().catch(() => null);
        if (Array.isArray(dbs)) {
          const hasOld = dbs.some(d => d && d.name === OLD_DB_NAME);
          if (!hasOld) {
            localStorage.setItem('as_thumb_idb_migrated', 'true');
            return;
          }
        }
      }

      const migrationSuccess = await new Promise((resolveMigration) => {
        let isBrandNewDb = false;
        let completed = false;

        const finish = (success) => {
          if (!completed) {
            completed = true;
            resolveMigration(Boolean(success));
          }
        };

        let oldReq;
        try {
          oldReq = indexedDB.open(OLD_DB_NAME);
        } catch (openErr) {
          console.warn('Cannot open legacy DB:', openErr);
          return finish(false);
        }

        oldReq.onerror = () => {
          console.warn('Legacy DB open error; will retry next session');
          finish(false);
        };

        oldReq.onblocked = () => {
          console.warn('Legacy DB open blocked; will retry next session');
          finish(false);
        };

        oldReq.onupgradeneeded = (e) => {
          // If oldVersion === 0, the DB did not exist prior to this call
          if (e.oldVersion === 0) {
            isBrandNewDb = true;
          }
        };

        oldReq.onsuccess = () => {
          const oldDb = oldReq.result;

          // If this was an unintended newly created empty DB, clean it up
          if (isBrandNewDb) {
            oldDb.close();
            try { indexedDB.deleteDatabase(OLD_DB_NAME); } catch (delErr) {}
            return finish(true);
          }

          if (!oldDb.objectStoreNames.contains(STORE_PROJECTS)) {
            oldDb.close();
            return finish(true);
          }

          try {
            const oldTx = oldDb.transaction(STORE_PROJECTS, 'readonly');
            const getOld = oldTx.objectStore(STORE_PROJECTS).getAll();

            getOld.onerror = () => {
              oldDb.close();
              finish(false);
            };

            getOld.onsuccess = () => {
              const oldProjects = getOld.result || [];
              oldDb.close(); // Safely close legacy DB immediately after reading

              if (oldProjects.length === 0) {
                return finish(true);
              }

              try {
                const writeTx = newDb.transaction(STORE_PROJECTS, 'readwrite');
                const writeStore = writeTx.objectStore(STORE_PROJECTS);
                const keysReq = writeStore.getAllKeys();

                keysReq.onerror = () => finish(false);
                keysReq.onsuccess = () => {
                  const existingKeys = new Set(keysReq.result || []);
                  for (const p of oldProjects) {
                    if (p && p.id && !existingKeys.has(p.id)) {
                      writeStore.put(p);
                    }
                  }
                };

                writeTx.oncomplete = () => finish(true);
                writeTx.onerror = (txErr) => {
                  console.warn('Migration write failed:', txErr);
                  finish(false);
                };
              } catch (writeErr) {
                console.warn('Migration write transaction error:', writeErr);
                finish(false);
              }
            };
          } catch (txErr) {
            console.warn('Migration read transaction error:', txErr);
            try { oldDb.close(); } catch (cErr) {}
            finish(false);
          }
        };
      });

      if (migrationSuccess) {
        localStorage.setItem('as_thumb_idb_migrated', 'true');
      }
    } catch (e) {
      console.warn('Migration exception:', e);
    }
  }

  request.onsuccess = async (event) => {
    const db = event.target.result;
    try {
      await migrateLegacyProjects(db);
    } catch (e) {
      console.warn('Migration error during DB initialization:', e);
    }
    resolve(db);
  };

      request.onerror = (event) => {
        console.warn('IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });

    return dbPromise;
  }

  // Save project
  async function saveProject(project) {
    const db = await initDB();
    project.updatedAt = Date.now();

    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        store.put(project);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } else {
      // LocalStorage fallback with namespaced key
      try {
        const key = `as_thumb_proj_${project.id}`;
        localStorage.setItem(key, JSON.stringify(project));
        return true;
      } catch (e) {
        console.error('LocalStorage quota exceeded:', e);
        return false;
      }
    }
  }

  // List all recent projects
  async function listProjects() {
    const db = await initDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } else {
      const list = [];
      const seenIds = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('as_thumb_proj_') || k.startsWith('studio_proj_'))) {
          try {
            const p = JSON.parse(localStorage.getItem(k));
            if (p && p.id && !seenIds.has(p.id)) {
              seenIds.add(p.id);
              list.push(p);
            }
          } catch (e) {}
        }
      }
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return list;
    }
  }

  // Delete project
  async function deleteProject(id) {
    const db = await initDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else {
      localStorage.removeItem(`as_thumb_proj_${id}`);
      localStorage.removeItem(`studio_proj_${id}`);
      return true;
    }
  }

  // Undo / Redo History Stack Manager
  class HistoryManager {
    constructor(maxSteps = 30) {
      this.maxSteps = maxSteps;
      this.undoStack = [];
      this.redoStack = [];
      this.isLocked = false;
    }

    pushState(stateSnapshot) {
      if (this.isLocked) return;
      const clone = JSON.parse(JSON.stringify(stateSnapshot));
      this.undoStack.push(clone);
      if (this.undoStack.length > this.maxSteps) {
        this.undoStack.shift();
      }
      this.redoStack = []; // Clear forward history on new action
    }

    canUndo() {
      return this.undoStack.length > 1;
    }

    canRedo() {
      return this.redoStack.length > 0;
    }

    undo(currentStateSnapshot) {
      if (!this.canUndo()) return null;
      this.isLocked = true;
      if (currentStateSnapshot) {
        const currentClone = JSON.parse(JSON.stringify(currentStateSnapshot));
        this.redoStack.push(currentClone);
      } else {
        const popped = this.undoStack[this.undoStack.length - 1];
        if (popped) this.redoStack.push(JSON.parse(JSON.stringify(popped)));
      }

      this.undoStack.pop(); // Remove top (current) state
      const targetState = this.undoStack[this.undoStack.length - 1];
      this.isLocked = false;
      return targetState ? JSON.parse(JSON.stringify(targetState)) : null;
    }

    redo() {
      if (!this.canRedo()) return null;
      this.isLocked = true;
      const targetState = this.redoStack.pop();
      this.undoStack.push(JSON.parse(JSON.stringify(targetState)));
      this.isLocked = false;
      return JSON.parse(JSON.stringify(targetState));
    }
  }

  return {
    initDB,
    saveProject,
    listProjects,
    deleteProject,
    HistoryManager
  };
})();
