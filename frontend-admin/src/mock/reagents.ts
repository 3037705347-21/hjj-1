import type { Reagent, ReagentFormData } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'

const STORAGE_KEY = 'mock_reagents'

function getReagentsFromStorage(): Reagent[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockReagents()
}

function saveReagentsToStorage(reagents: Reagent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reagents))
}

function initMockReagents(): Reagent[] {
  const now = new Date().toISOString()
  const reagents: Reagent[] = [
    {
      id: generateId(),
      name: '牛血清白蛋白 BSA',
      casNumber: '9048-46-8',
      category: '蛋白质',
      specification: '100mg/mL',
      unit: 'mL',
      manufacturer: 'Sigma-Aldrich',
      storageCondition: '2-8°C',
      hazardLevel: 'low',
      description: '用于Western Blot封闭液配制',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Taq DNA 聚合酶',
      casNumber: '9012-90-2',
      category: '酶',
      specification: '5U/μL',
      unit: 'μL',
      manufacturer: 'Thermo Fisher',
      storageCondition: '-20°C',
      hazardLevel: 'low',
      description: '常规PCR扩增用',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Tris-盐酸缓冲液 1M pH8.0',
      casNumber: '77-86-1',
      category: '缓冲液',
      specification: '500mL',
      unit: 'mL',
      manufacturer: 'Invitrogen',
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '分子生物学实验常用缓冲液',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '乙腈 (ACN)',
      casNumber: '75-05-8',
      category: '有机溶剂',
      specification: 'HPLC级 4L',
      unit: 'L',
      manufacturer: 'Merck',
      storageCondition: '常温',
      hazardLevel: 'high',
      description: '液相色谱流动相',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'PBS 磷酸盐缓冲液',
      casNumber: '',
      category: '缓冲液',
      specification: '10× 1L',
      unit: 'L',
      manufacturer: 'HyClone',
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '细胞培养和免疫实验用',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '琼脂糖',
      casNumber: '9012-36-6',
      category: '核酸',
      specification: '100g',
      unit: 'g',
      manufacturer: 'Biowest',
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '核酸电泳用琼脂糖',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '二甲基亚砜 DMSO',
      casNumber: '67-68-5',
      category: '有机溶剂',
      specification: '100mL',
      unit: 'mL',
      manufacturer: 'Sigma-Aldrich',
      storageCondition: '常温',
      hazardLevel: 'medium',
      description: '细胞冻存和试剂溶解用',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'LB培养基',
      casNumber: '',
      category: '培养基',
      specification: '500g',
      unit: 'g',
      manufacturer: 'BD Biosciences',
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '大肠杆菌培养用',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '考马斯亮蓝 R-250',
      casNumber: '6104-59-2',
      category: '染色剂',
      specification: '10g',
      unit: 'g',
      manufacturer: 'Sigma-Aldrich',
      storageCondition: '常温',
      hazardLevel: 'medium',
      description: '蛋白质电泳染色',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: '氯化钠 NaCl',
      casNumber: '7647-14-5',
      category: '无机盐',
      specification: 'AR 500g',
      unit: 'g',
      manufacturer: '国药集团',
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '分析纯氯化钠',
      createdAt: now,
      updatedAt: now,
    },
  ]
  saveReagentsToStorage(reagents)
  return reagents
}

export function mockGetReagents(
  page: number = 1,
  pageSize: number = 10,
  keyword?: string,
  category?: string
): Promise<PageResult<Reagent>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let reagents = getReagentsFromStorage()
      
      if (keyword) {
        const kw = keyword.toLowerCase()
        reagents = reagents.filter(
          r => r.name.toLowerCase().includes(kw) || 
               r.casNumber?.toLowerCase().includes(kw) ||
               r.manufacturer?.toLowerCase().includes(kw)
        )
      }
      
      if (category) {
        reagents = reagents.filter(r => r.category === category)
      }
      
      const start = (page - 1) * pageSize
      const list = reagents.slice(start, start + pageSize)
      
      resolve({
        list,
        total: reagents.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetReagent(id: string): Promise<Reagent | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reagents = getReagentsFromStorage()
      const reagent = reagents.find(r => r.id === id) || null
      resolve(reagent)
    }, 200)
  })
}

export function mockCreateReagent(data: ReagentFormData): Promise<Reagent> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reagents = getReagentsFromStorage()
      const now = new Date().toISOString()
      const newReagent: Reagent = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      reagents.unshift(newReagent)
      saveReagentsToStorage(reagents)
      resolve(newReagent)
    }, 300)
  })
}

export function mockUpdateReagent(id: string, data: ReagentFormData): Promise<Reagent> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const reagents = getReagentsFromStorage()
      const index = reagents.findIndex(r => r.id === id)
      if (index === -1) {
        reject(new Error('试剂不存在'))
        return
      }
      reagents[index] = {
        ...reagents[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveReagentsToStorage(reagents)
      resolve(reagents[index])
    }, 300)
  })
}

export function mockDeleteReagent(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reagents = getReagentsFromStorage()
      const filtered = reagents.filter(r => r.id !== id)
      saveReagentsToStorage(filtered)
      resolve()
    }, 200)
  })
}

export function mockGetAllReagents(): Promise<Reagent[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getReagentsFromStorage())
    }, 200)
  })
}
