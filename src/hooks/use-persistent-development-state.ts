"use client"

import {
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"

type StateUpdater<T> =
  | T
  | ((currentValue: T) => T)

interface PersistentDevelopmentStore<T> {
  subscribe: (
    listener: () => void
  ) => () => void

  getSnapshot: () => T
  getServerSnapshot: () => T

  setValue: (
    nextValue: StateUpdater<T>
  ) => void
}

type PersistentStoreRegistry = Map<
  string,
  PersistentDevelopmentStore<unknown>
>

const globalRegistryHost =
  globalThis as typeof globalThis & {
    __galenmedPersistentDevelopmentStores__?:
      PersistentStoreRegistry
  }

const persistentStoreRegistry =
  globalRegistryHost
    .__galenmedPersistentDevelopmentStores__ ??
  new Map<
    string,
    PersistentDevelopmentStore<unknown>
  >()

globalRegistryHost.__galenmedPersistentDevelopmentStores__ =
  persistentStoreRegistry

function createPersistentDevelopmentStore<T>(
  storageKey: string,
  initialValue: T
): PersistentDevelopmentStore<T> {
  let currentValue = initialValue
  let hasHydrated = false

  const listeners =
    new Set<() => void>()

  function emitChange() {
    listeners.forEach(
      (listener) => listener()
    )
  }

  function saveToStorage(
    value: T
  ): void {
    if (
      typeof window === "undefined"
    ) {
      return
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(value)
    )
  }

  function hydrateFromStorage(): T {
    if (
      hasHydrated ||
      typeof window === "undefined"
    ) {
      return currentValue
    }

    hasHydrated = true

    try {
      const storedValue =
        window.localStorage.getItem(
          storageKey
        )

      if (storedValue === null) {
        saveToStorage(currentValue)
        return currentValue
      }

      currentValue =
        JSON.parse(storedValue) as T
    } catch {
      currentValue = initialValue

      try {
        window.localStorage.removeItem(
          storageKey
        )

        saveToStorage(currentValue)
      } catch {
        // Development storage is unavailable.
      }
    }

    return currentValue
  }

  return {
    subscribe(listener) {
      listeners.add(listener)

      if (
        typeof window === "undefined"
      ) {
        return () => {
          listeners.delete(listener)
        }
      }

      function handleStorageEvent(
        event: StorageEvent
      ) {
        if (
          event.storageArea !==
            window.localStorage ||
          event.key !== storageKey
        ) {
          return
        }

        try {
          currentValue =
            event.newValue === null
              ? initialValue
              : (JSON.parse(
                  event.newValue
                ) as T)
        } catch {
          currentValue = initialValue
        }

        hasHydrated = true
        emitChange()
      }

      window.addEventListener(
        "storage",
        handleStorageEvent
      )

      return () => {
        listeners.delete(listener)

        window.removeEventListener(
          "storage",
          handleStorageEvent
        )
      }
    },

    getSnapshot() {
      return hydrateFromStorage()
    },

    getServerSnapshot() {
      return initialValue
    },

    setValue(nextValue) {
      const currentSnapshot =
        hydrateFromStorage()

      const resolvedValue =
        typeof nextValue === "function"
          ? (
              nextValue as (
                value: T
              ) => T
            )(currentSnapshot)
          : nextValue

      currentValue = resolvedValue
      hasHydrated = true

      saveToStorage(resolvedValue)
      emitChange()
    },
  }
}

function getPersistentDevelopmentStore<T>(
  storageKey: string,
  initialValue: T
): PersistentDevelopmentStore<T> {
  const existingStore =
    persistentStoreRegistry.get(
      storageKey
    )

  if (existingStore) {
    return existingStore as
      PersistentDevelopmentStore<T>
  }

  const newStore =
    createPersistentDevelopmentStore(
      storageKey,
      initialValue
    )

  persistentStoreRegistry.set(
    storageKey,
    newStore as
      PersistentDevelopmentStore<unknown>
  )

  return newStore
}

export function usePersistentDevelopmentState<T>(
  storageKey: string,
  initialValue: T
): readonly [
  T,
  (nextValue: StateUpdater<T>) => void,
] {
  const store = useMemo(
    () =>
      getPersistentDevelopmentStore(
        storageKey,
        initialValue
      ),
    [storageKey, initialValue]
  )

  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )

  const setValue = useCallback(
    (
      nextValue: StateUpdater<T>
    ) => {
      store.setValue(nextValue)
    },
    [store]
  )

  return [
    value,
    setValue,
  ] as const
}
