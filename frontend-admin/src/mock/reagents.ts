import type { Reagent, ReagentFormData } from '@/types/reagent'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'

const STORAGE_KEY = 'mock_reagents'

export interface ReagentFilterParams {
  keyword?: string
  category?: string
  brand?: string
  catalogNumber?: string
  hazardLevel?: string
  storageCondition?: string
  enabled?: string
  manufacturer?: string
  casNumber?: string
  createTimeStart?: string
  createTimeEnd?: string
  updateTimeStart?: string
  updateTimeEnd?: string
  operator?: string
}

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
      brand: 'Sigma-Aldrich',
      catalogNumber: 'A7906-100ML',
      purity: '≥98%',
      concentration: '100mg/mL',
      packagingSpec: '100mL/瓶',
      experimentTypes: ['Western Blot', 'ELISA', '免疫组化'],
      aliases: 'BSA; Bovine Serum Albumin',
      openedValidity: '30天',
      incompatibilities: '避免与强氧化剂接触',
      sdsAttachment: { name: 'A7906_SDS.pdf', url: '/files/A7906_SDS.pdf', size: 245000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_A7906_20250601.pdf', url: '/files/QC_A7906.pdf', size: 128000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '2-8°C',
      hazardLevel: 'low',
      description: '用于Western Blot封闭液配制、蛋白标准品制备等',
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
      brand: 'Thermo Fisher',
      catalogNumber: '10342-020',
      purity: '≥95%',
      concentration: '5U/μL',
      packagingSpec: '500μL/管',
      experimentTypes: ['PCR扩增', '荧光定量PCR'],
      aliases: 'Taq Polymerase; Taq酶',
      openedValidity: '60天',
      incompatibilities: '避免反复冻融，避免与核酸酶污染',
      sdsAttachment: { name: '10342020_SDS.pdf', url: '/files/10342020_SDS.pdf', size: 312000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '-20°C',
      hazardLevel: 'low',
      description: '常规PCR扩增用，具有5\'→3\'聚合酶活性',
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
      brand: 'Invitrogen',
      catalogNumber: 'AM9855',
      purity: '分子生物学级',
      concentration: '1M',
      packagingSpec: '500mL/瓶',
      experimentTypes: ['PCR扩增', '核酸电泳', 'Western Blot'],
      aliases: 'Tris-HCl Buffer',
      openedValidity: '180天',
      incompatibilities: '避免与强酸强碱混合',
      sdsAttachment: { name: 'AM9855_SDS.pdf', url: '/files/AM9855_SDS.pdf', size: 198000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_AM9855.pdf', url: '/files/QC_AM9855.pdf', size: 88000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '分子生物学实验常用缓冲液，pH 8.0 ± 0.1',
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
      brand: 'Merck',
      catalogNumber: '1.00030.4008',
      purity: '≥99.9%',
      concentration: '',
      packagingSpec: '4L/瓶',
      experimentTypes: ['液相色谱'],
      aliases: 'Acetonitrile; ACN; 氰基甲烷',
      openedValidity: '365天',
      incompatibilities: '易燃，远离火源。避免与氧化剂、还原剂、酸类接触',
      sdsAttachment: { name: '1000304008_SDS.pdf', url: '/files/1000304008_SDS.pdf', size: 425000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_1000304008.pdf', url: '/files/QC_1000304008.pdf', size: 156000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'high',
      description: '液相色谱流动相，HPLC梯度级',
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
      brand: 'HyClone',
      catalogNumber: 'SH30258.01',
      purity: '细胞培养级',
      concentration: '10×',
      packagingSpec: '1L/瓶',
      experimentTypes: ['细胞培养', 'ELISA', '免疫组化'],
      aliases: 'Phosphate Buffered Saline; 磷酸盐缓冲盐水',
      openedValidity: '30天',
      incompatibilities: '',
      sdsAttachment: { name: 'SH30258_SDS.pdf', url: '/files/SH30258_SDS.pdf', size: 168000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '细胞培养和免疫实验用，pH 7.2 ± 0.2',
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
      brand: 'Biowest',
      catalogNumber: '111860',
      purity: '电泳级',
      concentration: '',
      packagingSpec: '100g/瓶',
      experimentTypes: ['核酸电泳'],
      aliases: 'Agarose',
      openedValidity: '730天',
      incompatibilities: '避免潮湿，避免与强酸接触',
      sdsAttachment: { name: '111860_SDS.pdf', url: '/files/111860_SDS.pdf', size: 210000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_111860.pdf', url: '/files/QC_111860.pdf', size: 92000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '核酸电泳用琼脂糖，凝胶强度均匀',
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
      brand: 'Sigma-Aldrich',
      catalogNumber: 'D2650-100ML',
      purity: '≥99.9%',
      concentration: '',
      packagingSpec: '100mL/瓶',
      experimentTypes: ['细胞培养'],
      aliases: 'DMSO; Dimethyl sulfoxide; 二甲亚砜',
      openedValidity: '365天',
      incompatibilities: '避免与强氧化剂、酸性氯化物接触',
      sdsAttachment: { name: 'D2650_SDS.pdf', url: '/files/D2650_SDS.pdf', size: 380000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'medium',
      description: '细胞冻存和试剂溶解用，细胞培养级',
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
      brand: 'BD Biosciences',
      catalogNumber: '244620',
      purity: '微生物级',
      concentration: '',
      packagingSpec: '500g/瓶',
      experimentTypes: ['细胞培养'],
      aliases: 'Luria-Bertani Medium; LB Broth',
      openedValidity: '365天',
      incompatibilities: '避免潮湿环境',
      sdsAttachment: { name: '244620_SDS.pdf', url: '/files/244620_SDS.pdf', size: 175000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_244620.pdf', url: '/files/QC_244620.pdf', size: 110000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '大肠杆菌培养用，粉末培养基',
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
      brand: 'Sigma-Aldrich',
      catalogNumber: 'B7920-10G',
      purity: '≥70%',
      concentration: '',
      packagingSpec: '10g/瓶',
      experimentTypes: ['蛋白质电泳', 'Western Blot'],
      aliases: 'Coomassie Brilliant Blue R-250; CBB R-250',
      openedValidity: '730天',
      incompatibilities: '避免与强氧化剂接触',
      sdsAttachment: { name: 'B7920_SDS.pdf', url: '/files/B7920_SDS.pdf', size: 225000, uploadedAt: now },
      reagentImage: '',
      enabled: true,
      storageCondition: '常温',
      hazardLevel: 'medium',
      description: '蛋白质电泳染色，灵敏度高',
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
      brand: '国药集团',
      catalogNumber: '10019318',
      purity: '≥99.5%（AR级）',
      concentration: '',
      packagingSpec: '500g/瓶',
      experimentTypes: ['其他'],
      aliases: 'Sodium Chloride; 食盐',
      openedValidity: '1095天',
      incompatibilities: '避免与银盐接触',
      sdsAttachment: { name: '10019318_SDS.pdf', url: '/files/10019318_SDS.pdf', size: 142000, uploadedAt: now },
      qcReportAttachment: { name: 'QC_10019318.pdf', url: '/files/QC_10019318.pdf', size: 78000, uploadedAt: now },
      reagentImage: '',
      enabled: false,
      storageCondition: '常温',
      hazardLevel: 'low',
      description: '分析纯氯化钠，用于缓冲液配制',
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
  filters?: ReagentFilterParams
): Promise<PageResult<Reagent>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let reagents = getReagentsFromStorage()

      if (filters) {
        const {
          keyword,
          category,
          brand,
          catalogNumber,
          hazardLevel,
          storageCondition,
          enabled,
          manufacturer,
          casNumber,
          createTimeStart,
          createTimeEnd,
          updateTimeStart,
          updateTimeEnd,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          reagents = reagents.filter(
            (r) =>
              r.name.toLowerCase().includes(kw) ||
              r.casNumber?.toLowerCase().includes(kw) ||
              r.manufacturer?.toLowerCase().includes(kw) ||
              r.brand?.toLowerCase().includes(kw) ||
              r.catalogNumber?.toLowerCase().includes(kw) ||
              r.aliases?.toLowerCase().includes(kw) ||
              r.description?.toLowerCase().includes(kw)
          )
        }

        if (category) {
          reagents = reagents.filter((r) => r.category === category)
        }

        if (brand) {
          reagents = reagents.filter((r) => r.brand === brand)
        }

        if (catalogNumber) {
          const cn = catalogNumber.toLowerCase()
          reagents = reagents.filter((r) => r.catalogNumber?.toLowerCase().includes(cn))
        }

        if (hazardLevel) {
          reagents = reagents.filter((r) => r.hazardLevel === hazardLevel)
        }

        if (storageCondition) {
          reagents = reagents.filter((r) => r.storageCondition === storageCondition)
        }

        if (enabled !== undefined && enabled !== '') {
          const enabledBool = enabled === 'true'
          reagents = reagents.filter((r) => r.enabled === enabledBool)
        }

        if (manufacturer) {
          const mf = manufacturer.toLowerCase()
          reagents = reagents.filter((r) => r.manufacturer?.toLowerCase().includes(mf))
        }

        if (casNumber) {
          const cn = casNumber.toLowerCase()
          reagents = reagents.filter((r) => r.casNumber?.toLowerCase().includes(cn))
        }

        if (createTimeStart) {
          const start = new Date(createTimeStart).getTime()
          reagents = reagents.filter((r) => new Date(r.createdAt).getTime() >= start)
        }

        if (createTimeEnd) {
          const end = new Date(createTimeEnd).getTime() + 24 * 60 * 60 * 1000
          reagents = reagents.filter((r) => new Date(r.createdAt).getTime() < end)
        }

        if (updateTimeStart) {
          const start = new Date(updateTimeStart).getTime()
          reagents = reagents.filter((r) => new Date(r.updatedAt).getTime() >= start)
        }

        if (updateTimeEnd) {
          const end = new Date(updateTimeEnd).getTime() + 24 * 60 * 60 * 1000
          reagents = reagents.filter((r) => new Date(r.updatedAt).getTime() < end)
        }
      }

      reagents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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
