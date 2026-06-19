import { ref, onMounted } from 'vue'

export interface SavedFilter {
  id: string
  name: string
  values: Record<string, any>
}

export function useSavedFilters(storageKey: string) {
  const savedFilters = ref<SavedFilter[]>([])

  const loadFilters = () => {
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        savedFilters.value = JSON.parse(data)
      }
    } catch {
      savedFilters.value = []
    }
  }

  const saveFilters = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedFilters.value))
    } catch {
      console.warn('Failed to save filters to localStorage')
    }
  }

  const addFilter = (name: string, values: Record<string, any>) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      values: { ...values },
    }
    savedFilters.value.push(newFilter)
    saveFilters()
    return newFilter
  }

  const deleteFilter = (id: string) => {
    savedFilters.value = savedFilters.value.filter((f) => f.id !== id)
    saveFilters()
  }

  const updateFilter = (id: string, name: string, values: Record<string, any>) => {
    const index = savedFilters.value.findIndex((f) => f.id === id)
    if (index > -1) {
      savedFilters.value[index] = {
        ...savedFilters.value[index],
        name,
        values: { ...values },
      }
      saveFilters()
    }
  }

  onMounted(() => {
    loadFilters()
  })

  return {
    savedFilters,
    loadFilters,
    addFilter,
    deleteFilter,
    updateFilter,
  }
}
