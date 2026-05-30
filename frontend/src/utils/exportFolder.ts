/**
 * IndexedDB-backed persistence for File System Access API directory handles.
 * Used by ExportCapsuleModal to remember the user's chosen export folder.
 *
 * FileSystemDirectoryHandle is structured-cloneable and can be stored in IndexedDB
 * (but NOT localStorage). Before each use, we must re-request permission since
 * handles lose their grant across browser sessions.
 */

const DB_NAME = 'vantacore-export'
const DB_VERSION = 1
const STORE_NAME = 'settings'
const DIR_HANDLE_KEY = 'exportDirHandle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSavedDirHandle(): Promise<any | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(DIR_HANDLE_KEY)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveDirHandle(handle: any): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(handle, DIR_HANDLE_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Silent fail — worst case user picks folder again next time
  }
}

export async function clearDirHandle(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(DIR_HANDLE_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Silent fail
  }
}

/**
 * Verify a stored handle still has readwrite permission.
 * Returns true if granted, false if denied or handle is invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyPermission(handle: any): Promise<boolean> {
  try {
    const options = { mode: 'readwrite' }
    if ((await handle.queryPermission(options)) === 'granted') return true
    if ((await handle.requestPermission(options)) === 'granted') return true
    return false
  } catch {
    return false
  }
}

/**
 * Write content to a file inside the given directory handle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeToDir(dirHandle: any, filename: string, content: string): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

/** Feature detection */
export const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window
export const supportsSaveFilePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window
