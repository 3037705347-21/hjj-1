import type { Consumable, ConsumableFormData } from '@/types/consumable'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'

const STORAGE_KEY = 'mock_consumables'

function getConsumablesFromStorage(): Consumable[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockConsumables()
}

function saveConsumablesToStorage(consumables: Consumable[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consumables))
}

function initMockConsumables(): Consumable[] {
  const now = new Date().toISOString()
  const consumables: Consumable[] = [
    {
      id: generateId(),
      name: '1.5mL 离心管',
      category: '离心管',
      specification: '500个/包',
      unit: '包',
      stockQuantity: 25,
      safetyStock: 10,
      manufacturer: 'Axygen',
      location: '耗材柜A-01',
      description: '无酶无热源离心管',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '200μL 吸头',
      category: '吸头',
      specification: '1000个/盒',
      unit: '盒',
      stockQuantity: 8,
      safetyStock: 5,
      manufacturer: 'Gilson',
      location: '耗材柜A-02',
      description: '带滤芯吸头',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '100mm 细胞培养皿',
      category: '培养皿',
      specification: '20个/包',
      unit: '包',
      stockQuantity: 12,
      safetyStock: 5,
      manufacturer: 'Corning',
      location: '耗材柜B-01',
      description: 'TC处理培养皿',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '96孔PCR板',
      category: 'PCR板',
      specification: '25块/包',
      unit: '包',
      stockQuantity: 3,
      safetyStock: 5,
      manufacturer: 'Bio-Rad',
      location: '耗材柜B-02',
      description: '半裙边96孔板',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '一次性手套 M号',
      category: '手套',
      specification: '100只/盒',
      unit: '盒',
      stockQuantity: 15,
      safetyStock: 10,
      manufacturer: '英科',
      location: '耗材柜C-01',
      description: '丁腈手套，无粉',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '医用外科口罩',
      category: '口罩',
      specification: '50只/盒',
      unit: '盒',
      stockQuantity: 30,
      safetyStock: 20,
      manufacturer: '3M',
      location: '耗材柜C-02',
      description: '三层防护口罩',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '定性滤纸 中速',
      category: '滤纸',
      specification: '100张/盒 直径11cm',
      unit: '盒',
      stockQuantity: 2,
      safetyStock: 3,
      manufacturer: 'Whatman',
      location: '耗材柜D-01',
      description: 'Grade 1 滤纸',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Parafilm 封口膜',
      category: '封口膜',
      specification: '10cm×38m',
      unit: '卷',
      stockQuantity: 4,
      safetyStock: 2,
      manufacturer: 'Bemis',
      location: '耗材柜D-02',
      description: '实验室通用封口膜',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '0.2mL PCR管',
      category: '离心管',
      specification: '1000个/包',
      unit: '包',
      stockQuantity: 6,
      safetyStock: 5,
      manufacturer: 'Axygen',
      location: '耗材柜A-03',
      description: '平盖PCR管',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '1000μL 吸头',
      category: '吸头',
      specification: '100个/盒',
      unit: '盒',
      stockQuantity: 18,
      safetyStock: 10,
      manufacturer: 'Eppendorf',
      location: '耗材柜A-04',
      description: '普通吸头',
      createdAt: now,
      updatedAt: now,
    },
  ]
  saveConsumablesToStorage(consumables)
  return consumables
}

export function mockGetConsumables(
  page: number = 1,
  pageSize: number = 10,
  keyword?: string,
  category?: string
): Promise<PageResult<Consumable>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let consumables = getConsumablesFromStorage()
      
      if (keyword) {
        const kw = keyword.toLowerCase()
        consumables = consumables.filter(
          c => c.name.toLowerCase().includes(kw) ||
               c.manufacturer?.toLowerCase().includes(kw)
        )
      }
      
      if (category) {
        consumables = consumables.filter(c => c.category === category)
      }
      
      consumables.sort((a, b) => {
        const aLow = a.stockQuantity <= a.safetyStock
        const bLow = b.stockQuantity <= b.safetyStock
        if (aLow && !bLow) return -1
        if (!aLow && bLow) return 1
        return a.name.localeCompare(b.name)
      })
      
      const start = (page - 1) * pageSize
      const list = consumables.slice(start, start + pageSize)
      
      resolve({
        list,
        total: consumables.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetConsumable(id: string): Promise<Consumable | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const consumable = consumables.find(c => c.id === id) || null
      resolve(consumable)
    }, 200)
  })
}

export function mockCreateConsumable(data: ConsumableFormData): Promise<Consumable> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const now = new Date().toISOString()
      const newConsumable: Consumable = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      consumables.unshift(newConsumable)
      saveConsumablesToStorage(consumables)
      resolve(newConsumable)
    }, 300)
  })
}

export function mockUpdateConsumable(id: string, data: ConsumableFormData): Promise<Consumable> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const index = consumables.findIndex(c => c.id === id)
      if (index === -1) {
        reject(new Error('耗材不存在'))
        return
      }
      consumables[index] = {
        ...consumables[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveConsumablesToStorage(consumables)
      resolve(consumables[index])
    }, 300)
  })
}

export function mockDeleteConsumable(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const filtered = consumables.filter(c => c.id !== id)
      saveConsumablesToStorage(filtered)
      resolve()
    }, 200)
  })
}

export function mockGetLowStockCount(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consumables = getConsumablesFromStorage()
      const count = consumables.filter(c => c.stockQuantity <= c.safetyStock).length
      resolve(count)
    }, 200)
  })
}
