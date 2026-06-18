export type HazardLevel = 'low' | 'medium' | 'high'

export interface Reagent {
  id: string
  name: string
  casNumber?: string
  category: string
  specification: string
  unit: string
  manufacturer?: string
  storageCondition: string
  description?: string
  hazardLevel?: HazardLevel
  createdAt: string
  updatedAt: string
}

export interface ReagentFormData {
  name: string
  casNumber?: string
  category: string
  specification: string
  unit: string
  manufacturer?: string
  storageCondition: string
  description?: string
  hazardLevel?: HazardLevel
}

export const hazardLevelLabels: Record<HazardLevel, string> = {
  low: '低危',
  medium: '中危',
  high: '高危',
}

export const hazardLevelColors: Record<HazardLevel, string> = {
  low: 'bg-success-50 text-success-600',
  medium: 'bg-warning-50 text-warning-600',
  high: 'bg-danger-50 text-danger-600',
}

export const reagentCategories = [
  '抗体',
  '酶',
  '核酸',
  '蛋白质',
  '缓冲液',
  '培养基',
  '染色剂',
  '有机溶剂',
  '无机盐',
  '其他',
]

export const storageConditions = [
  '常温',
  '2-8°C',
  '-20°C',
  '-80°C',
  '避光',
  '无菌',
]
