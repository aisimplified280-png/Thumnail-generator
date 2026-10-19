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

      request.onsuccess = async (event) => {
        const db = event.target.result;
        // Attempt one-time legacy migration if newly created DB is empty
        try {
          const tx = db.transaction(STORE_PROJECTS, 'readonly');
          const countReq = tx.objectStore(STORE_PROJECTS).count();
          countReq.onsuccess = () => {
            if (countReq.result === 0 && window.indexedDB.databases) {
              const oldReq = indexedDB.open(OLD_DB_NAME, 1);
              oldReq.onsuccess = () => {
                const oldDb = oldReq.result;
                if (oldDb.objectStoreNames.contains(STORE_PROJECTS)) {
                  const oldTx = oldDb.transaction(STORE_PROJECTS, 'readonly');
                  const getOld = oldTx.objectStore(STORE_PROJECTS).getAll();
                  getOld.onsuccess = () => {
                    const oldProjects = getOld.result || [];
                    if (oldProjects.length > 0) {
                      const writeTx = db.transaction(STORE_PROJECTS, 'readwrite');
                      const writeStore = writeTx.objectStore(STORE_PROJECTS);
                      oldProjects.forEach(p => writeStore.put(p));
                    }
                  };
                }
              };
            }
          };
        } catch (e) {
          // Migration check ignored if not supported
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
      const currentClone = JSON.parse(JSON.stringify(currentStateSnapshot));
      this.redoStack.push(currentClone);

      this.undoStack.pop(); // Remove top (current) state
      const targetState = this.undoStack[this.undoStack.length - 1];
      this.isLocked = false;
      return JSON.parse(JSON.stringify(targetState));
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
