export type HazardLevel = 'low' | 'medium' | 'high'

export interface Attachment {
  name: string
  url: string
  size?: number
  uploadedAt?: string
}

export interface Reagent {
  id: string
  name: string
  casNumber?: string
  category: string
  specification: string
  unit: string
  manufacturer?: string
  brand?: string
  catalogNumber?: string
  purity?: string
  concentration?: string
  packagingSpec?: string
  experimentTypes?: string[]
  aliases?: string
  openedValidity?: string
  incompatibilities?: string
  sdsAttachment?: Attachment
  qcReportAttachment?: Attachment
  reagentImage?: string
  enabled: boolean
  storageCondition: string
  description?: string
  hazardLevel?: HazardLevel
  supplierIds?: string[]
  defaultSupplierId?: string
  unitPrice?: number
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
  brand?: string
  catalogNumber?: string
  purity?: string
  concentration?: string
  packagingSpec?: string
  experimentTypes?: string[]
  aliases?: string
  openedValidity?: string
  incompatibilities?: string
  sdsAttachment?: Attachment
  qcReportAttachment?: Attachment
  reagentImage?: string
  enabled: boolean
  storageCondition: string
  description?: string
  hazardLevel?: HazardLevel
  supplierIds?: string[]
  defaultSupplierId?: string
  unitPrice?: number
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

export const enabledStatusLabels = {
  true: '启用',
  false: '停用',
} as const

export const enabledStatusColors = {
  true: 'bg-success-50 text-success-600',
  false: 'bg-gray-100 text-gray-500',
} as const

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

export const experimentTypeOptions = [
  'PCR扩增',
  'Western Blot',
  'ELISA',
  '细胞培养',
  '免疫组化',
  '核酸电泳',
  '蛋白质电泳',
  '液相色谱',
  '气相色谱',
  '荧光定量PCR',
  '流式细胞术',
  '其他',
]

export const commonBrands = [
  'Sigma-Aldrich',
  'Thermo Fisher',
  'Invitrogen',
  'Merck',
  'HyClone',
  'BD Biosciences',
  'Biowest',
  '国药集团',
  '阿拉丁',
  '麦克林',
]
