export interface Consumable {
  id: string
  name: string
  category: string
  specification: string
  unit: string
  stockQuantity: number
  safetyStock: number
  manufacturer?: string
  location?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ConsumableFormData {
  name: string
  category: string
  specification: string
  unit: string
  stockQuantity: number
  safetyStock: number
  manufacturer?: string
  location?: string
  description?: string
}

export const consumableCategories = [
  '离心管',
  '吸头',
  '培养皿',
  'PCR板',
  '手套',
  '口罩',
  '滤纸',
  '封口膜',
  '其他',
]
