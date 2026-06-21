import type { PageResult } from '@/types/common'
import type {
  Requisition,
  RequisitionStatus,
  RequisitionFormData,
  RequisitionFilterParams,
  RequisitionItem,
  RequisitionStats,
  ProjectConsumptionStat,
  TopicCostStat,
  UserUsageStat,
} from '@/types/requisition'
import { generateId, formatDate } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'

const STORAGE_KEY = 'mock_requisitions'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getRequisitionsFromStorage(): Requisition[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockRequisitions()
}

function saveRequisitionsToStorage(items: Requisition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function generateRequestCode(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `REQ-${dateStr}-${seq}`
}

function initMockRequisitions(): Requisition[] {
  const now = new Date()
  const items: Requisition[] = []

  const mockData: Array<Omit<Requisition, 'id' | 'requestCode' | 'createdAt' | 'updatedAt'>> = [
    {
      projectName: '肿瘤标志物检测研究',
      projectCode: 'PRJ-2026-001',
      topicCode: 'TPC-2026-A01',
      topicName: '蛋白质组学分析',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      department: '分子生物学实验室',
      usagePurpose: '蛋白质组学质谱分析前处理',
      usageTime: formatDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_001', materialName: '胰蛋白酶', specification: '100mg', unit: 'mg', expectedQuantity: 5, actualQuantity: 5, stockBefore: 100, stockAfter: 95 },
        { id: generateId(), materialType: 'consumable', materialId: 'con_001', materialName: '1.5mL 离心管', specification: '500个/包', unit: '包', expectedQuantity: 2, actualQuantity: 2, stockBefore: 25, stockAfter: 23 },
      ],
      status: 'used',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      approveTime: formatDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
      outboundOperatorId: 'user_manager_1',
      outboundOperatorName: '张主任',
      outboundTime: formatDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)),
      usageRegisteredBy: 'user_lab_1',
      usageRegisteredByName: '李研究员',
      usageRegisterTime: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      remark: '质谱样品前处理，需要高纯度胰蛋白酶',
    },
    {
      projectName: '基因编辑效率优化',
      projectCode: 'PRJ-2026-002',
      topicCode: 'TPC-2026-B01',
      topicName: 'CRISPR-Cas9切割效率',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      department: '分子生物学实验室',
      usagePurpose: 'CRISPR-Cas9基因编辑实验',
      usageTime: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_002', materialName: 'Taq DNA 聚合酶', specification: '500U', unit: 'U', expectedQuantity: 100, actualQuantity: 100, stockBefore: 500, stockAfter: 400 },
        { id: generateId(), materialType: 'reagent', materialId: 'req_003', materialName: 'dNTP Mix', specification: '10mM', unit: 'μL', expectedQuantity: 50, actualQuantity: 50, stockBefore: 1000, stockAfter: 950 },
        { id: generateId(), materialType: 'consumable', materialId: 'con_002', materialName: '200μL 吸头', specification: '1000个/盒', unit: '盒', expectedQuantity: 3, actualQuantity: 3, stockBefore: 10, stockAfter: 7 },
      ],
      status: 'outbound',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)),
      outboundOperatorId: 'user_manager_1',
      outboundOperatorName: '张主任',
      outboundTime: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)),
      remark: '基因编辑效率验证实验',
    },
    {
      projectName: '新型抗体药物筛选',
      projectCode: 'PRJ-2026-003',
      topicCode: 'TPC-2026-C01',
      topicName: '单克隆抗体筛选',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      department: '分子生物学实验室',
      usagePurpose: 'ELISA法筛选单克隆抗体',
      usageTime: formatDate(now, 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_004', materialName: 'PBS缓冲液', specification: '500mL', unit: '瓶', expectedQuantity: 5 },
        { id: generateId(), materialType: 'consumable', materialId: 'con_003', materialName: '96孔ELISA板', specification: '50个/盒', unit: '盒', expectedQuantity: 2 },
      ],
      status: 'pending',
      remark: '抗体筛选实验，需要大量PBS和ELISA板',
    },
    {
      projectName: '细胞信号通路分析',
      projectCode: 'PRJ-2026-004',
      topicCode: 'TPC-2026-D01',
      topicName: 'MAPK通路激活检测',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      department: '细胞生物学实验室',
      usagePurpose: 'Western Blot检测MAPK通路蛋白',
      usageTime: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_005', materialName: 'SDS-PAGE凝胶', specification: '10%', unit: '块', expectedQuantity: 4, actualQuantity: 4, stockBefore: 20, stockAfter: 16 },
        { id: generateId(), materialType: 'reagent', materialId: 'req_006', materialName: '转膜缓冲液', specification: '1L', unit: '瓶', expectedQuantity: 2, actualQuantity: 2, stockBefore: 8, stockAfter: 6 },
        { id: generateId(), materialType: 'consumable', materialId: 'con_004', materialName: 'PVDF膜', specification: '20cm×20cm', unit: '张', expectedQuantity: 4, actualQuantity: 4, stockBefore: 15, stockAfter: 11 },
      ],
      status: 'used',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      approveTime: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000)),
      outboundOperatorId: 'user_manager_1',
      outboundOperatorName: '张主任',
      outboundTime: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)),
      usageRegisteredBy: 'user_lab_2',
      usageRegisteredByName: '王技术员',
      usageRegisterTime: formatDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      remark: 'WB实验全套材料',
    },
    {
      projectName: '肿瘤标志物检测研究',
      projectCode: 'PRJ-2026-001',
      topicCode: 'TPC-2026-A02',
      topicName: 'Western Blot验证',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      department: '分子生物学实验室',
      usagePurpose: 'Western Blot验证蛋白表达',
      usageTime: formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_005', materialName: 'SDS-PAGE凝胶', specification: '10%', unit: '块', expectedQuantity: 2, actualQuantity: 2, stockBefore: 22, stockAfter: 20 },
      ],
      status: 'rejected',
      approverId: 'user_manager_1',
      approverName: '张主任',
      rejectReason: '库存不足，请等待下一批采购到货后再申请',
      remark: 'WB验证实验',
    },
    {
      projectName: '微生物耐药性监测',
      projectCode: 'PRJ-2025-010',
      topicCode: 'TPC-2025-E01',
      topicName: '耐药菌株鉴定',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      department: '微生物实验室',
      usagePurpose: '细菌培养与药敏实验',
      usageTime: formatDate(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm'),
      items: [
        { id: generateId(), materialType: 'reagent', materialId: 'req_007', materialName: 'LB培养基', specification: '500g', unit: 'g', expectedQuantity: 100, actualQuantity: 100, stockBefore: 500, stockAfter: 400 },
        { id: generateId(), materialType: 'consumable', materialId: 'con_005', materialName: '培养皿', specification: '90mm', unit: '包', expectedQuantity: 5, actualQuantity: 5, stockBefore: 30, stockAfter: 25 },
      ],
      status: 'used',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      approveTime: formatDate(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
      outboundOperatorId: 'user_manager_1',
      outboundOperatorName: '张主任',
      outboundTime: formatDate(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)),
      usageRegisteredBy: 'user_lab_2',
      usageRegisteredByName: '王技术员',
      usageRegisterTime: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      remark: '药敏检测常规耗材',
    },
  ]

  mockData.forEach((item) => {
    const createdAt = item.approveTime || formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    items.push({
      ...item,
      id: generateId(),
      requestCode: generateRequestCode(),
      createdAt,
      updatedAt: item.usageRegisterTime || item.outboundTime || item.approveTime || createdAt,
    })
  })

  saveRequisitionsToStorage(items)
  return items
}

export async function mockGetRequisitions(
  page: number,
  pageSize: number,
  filters?: RequisitionFilterParams
): Promise<PageResult<Requisition>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = getRequisitionsFromStorage()

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.requestCode.toLowerCase().includes(kw) ||
              r.projectName.toLowerCase().includes(kw) ||
              r.topicName.toLowerCase().includes(kw) ||
              r.applicantName.toLowerCase().includes(kw) ||
              r.items.some((i) => i.materialName.toLowerCase().includes(kw))
          )
        }
        if (filters.status) {
          records = records.filter((r) => r.status === filters.status)
        }
        if (filters.projectName) {
          records = records.filter((r) => r.projectName === filters.projectName)
        }
        if (filters.topicCode) {
          records = records.filter((r) => r.topicCode === filters.topicCode)
        }
        if (filters.applicantName) {
          records = records.filter((r) => r.applicantName.includes(filters.applicantName!))
        }
        if (filters.materialType) {
          records = records.filter((r) => r.items.some((i) => i.materialType === filters.materialType))
        }
        if (filters.startTime) {
          records = records.filter((r) => r.usageTime >= filters.startTime!)
        }
        if (filters.endTime) {
          records = records.filter((r) => r.usageTime <= filters.endTime! + ' 23:59:59')
        }
      }

      records = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      const start = (page - 1) * pageSize
      const paginated = records.slice(start, start + pageSize)

      resolve({
        list: paginated,
        total: records.length,
        page,
        pageSize,
      })
    }, 200)
  })
}

export async function mockGetRequisition(id: string): Promise<Requisition | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequisitionsFromStorage()
      resolve(records.find((r) => r.id === id) || null)
    }, 100)
  })
}

export async function mockCreateRequisition(data: RequisitionFormData): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const now = formatDate(new Date())
      const newReq: Requisition = {
        id: generateId(),
        requestCode: generateRequestCode(),
        projectName: data.projectName,
        projectCode: data.projectCode,
        topicCode: data.topicCode,
        topicName: data.topicName,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        department: currentUser.department,
        usagePurpose: data.usagePurpose,
        usageTime: data.usageTime,
        items: data.items.map((item) => ({
          ...item,
          id: generateId(),
        })),
        status: 'pending',
        remark: data.remark,
        createdAt: now,
        updatedAt: now,
      }
      records.unshift(newReq)
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_submit',
        targetType: 'requisition',
        targetId: newReq.id,
        targetName: newReq.requestCode,
        afterContent: `项目: ${newReq.projectName}, 课题: ${newReq.topicName}, 物料: ${newReq.items.length}项`,
        remark: '提交领用申请',
      })

      resolve(newReq)
    }, 200)
  })
}

export async function mockApproveRequisition(
  id: string,
  remark?: string
): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('领用记录不存在'))
        return
      }

      const now = formatDate(new Date())
      records[index] = {
        ...records[index],
        status: 'approved',
        approverId: currentUser.id,
        approverName: currentUser.name,
        approveTime: now,
        updatedAt: now,
      }
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_approve',
        targetType: 'requisition',
        targetId: id,
        targetName: records[index].requestCode,
        beforeContent: '状态: 待审批',
        afterContent: '状态: 已通过',
        remark: remark || '审批通过',
      })

      resolve(records[index])
    }, 200)
  })
}

export async function mockRejectRequisition(
  id: string,
  reason: string
): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('领用记录不存在'))
        return
      }

      const now = formatDate(new Date())
      records[index] = {
        ...records[index],
        status: 'rejected',
        approverId: currentUser.id,
        approverName: currentUser.name,
        rejectReason: reason,
        approveTime: now,
        updatedAt: now,
      }
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_reject',
        targetType: 'requisition',
        targetId: id,
        targetName: records[index].requestCode,
        beforeContent: '状态: 待审批',
        afterContent: '状态: 已驳回',
        remark: `驳回原因: ${reason}`,
      })

      resolve(records[index])
    }, 200)
  })
}

export async function mockOutboundRequisition(id: string): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('领用记录不存在'))
        return
      }

      const now = formatDate(new Date())
      const req = records[index]
      const updatedItems = req.items.map((item) => ({
        ...item,
        actualQuantity: item.expectedQuantity,
      }))

      records[index] = {
        ...req,
        status: 'outbound',
        items: updatedItems,
        outboundOperatorId: currentUser.id,
        outboundOperatorName: currentUser.name,
        outboundTime: now,
        updatedAt: now,
      }
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_outbound',
        targetType: 'requisition',
        targetId: id,
        targetName: records[index].requestCode,
        beforeContent: '状态: 已通过',
        afterContent: `状态: 已出库, 出库${req.items.length}项物料`,
        remark: '领用出库，自动扣减库存',
      })

      resolve(records[index])
    }, 200)
  })
}

export async function mockRegisterUsage(
  id: string,
  actualQuantities: Record<string, number>
): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('领用记录不存在'))
        return
      }

      const now = formatDate(new Date())
      const req = records[index]
      const updatedItems = req.items.map((item) => ({
        ...item,
        actualQuantity: actualQuantities[item.id] ?? item.actualQuantity ?? item.expectedQuantity,
      }))

      records[index] = {
        ...req,
        status: 'used',
        items: updatedItems,
        usageRegisteredBy: currentUser.id,
        usageRegisteredByName: currentUser.name,
        usageRegisterTime: now,
        updatedAt: now,
      }
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_register',
        targetType: 'requisition',
        targetId: id,
        targetName: records[index].requestCode,
        beforeContent: '状态: 已出库',
        afterContent: '状态: 已登记使用',
        remark: '使用登记完成',
      })

      resolve(records[index])
    }, 200)
  })
}

export async function mockCancelRequisition(id: string): Promise<Requisition> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequisitionsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('领用记录不存在'))
        return
      }

      const now = formatDate(new Date())
      records[index] = {
        ...records[index],
        status: 'cancelled',
        updatedAt: now,
      }
      saveRequisitionsToStorage(records)

      addAuditLog({
        module: 'requisition',
        operationType: 'requisition_cancel',
        targetType: 'requisition',
        targetId: id,
        targetName: records[index].requestCode,
        beforeContent: `状态: ${records[index].status}`,
        afterContent: '状态: 已取消',
        remark: '取消领用申请',
      })

      resolve(records[index])
    }, 200)
  })
}

export async function mockGetRequisitionStats(): Promise<RequisitionStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequisitionsFromStorage()
      const currentUser = getCurrentUser()
      resolve({
        totalRequisitions: records.length,
        pendingCount: records.filter((r) => r.status === 'pending').length,
        approvedCount: records.filter((r) => r.status === 'approved').length,
        outboundCount: records.filter((r) => r.status === 'outbound').length,
        usedCount: records.filter((r) => r.status === 'used').length,
        totalReagentUsage: records
          .filter((r) => r.status === 'used' || r.status === 'outbound')
          .reduce((sum, r) => sum + r.items.filter((i) => i.materialType === 'reagent').reduce((s, i) => s + (i.actualQuantity || i.expectedQuantity), 0), 0),
        totalConsumableUsage: records
          .filter((r) => r.status === 'used' || r.status === 'outbound')
          .reduce((sum, r) => sum + r.items.filter((i) => i.materialType === 'consumable').reduce((s, i) => s + (i.actualQuantity || i.expectedQuantity), 0), 0),
      })
    }, 100)
  })
}

export async function mockGetProjectConsumption(): Promise<ProjectConsumptionStat[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequisitionsFromStorage().filter((r) => r.status === 'used' || r.status === 'outbound')
      const map = new Map<string, ProjectConsumptionStat>()

      records.forEach((r) => {
        const key = r.projectCode
        if (!map.has(key)) {
          map.set(key, {
            projectName: r.projectName,
            projectCode: r.projectCode,
            totalItems: 0,
            totalQuantity: 0,
            reagentQuantity: 0,
            consumableQuantity: 0,
            estimatedCost: 0,
          })
        }
        const stat = map.get(key)!
        r.items.forEach((item) => {
          stat.totalItems++
          const qty = item.actualQuantity || item.expectedQuantity
          stat.totalQuantity += qty
          if (item.materialType === 'reagent') {
            stat.reagentQuantity += qty
            stat.estimatedCost += qty * 50
          } else {
            stat.consumableQuantity += qty
            stat.estimatedCost += qty * 20
          }
        })
      })

      resolve(Array.from(map.values()).sort((a, b) => b.estimatedCost - a.estimatedCost))
    }, 200)
  })
}

export async function mockGetTopicCost(): Promise<TopicCostStat[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequisitionsFromStorage().filter((r) => r.status === 'used' || r.status === 'outbound')
      const map = new Map<string, TopicCostStat>()

      records.forEach((r) => {
        const key = r.topicCode
        if (!map.has(key)) {
          map.set(key, {
            topicCode: r.topicCode,
            topicName: r.topicName,
            totalRequisitions: 0,
            totalQuantity: 0,
            estimatedCost: 0,
            reagentCost: 0,
            consumableCost: 0,
          })
        }
        const stat = map.get(key)!
        stat.totalRequisitions++
        r.items.forEach((item) => {
          const qty = item.actualQuantity || item.expectedQuantity
          stat.totalQuantity += qty
          if (item.materialType === 'reagent') {
            stat.reagentCost += qty * 50
          } else {
            stat.consumableCost += qty * 20
          }
          stat.estimatedCost = stat.reagentCost + stat.consumableCost
        })
      })

      resolve(Array.from(map.values()).sort((a, b) => b.estimatedCost - a.estimatedCost))
    }, 200)
  })
}

export async function mockGetUserUsage(): Promise<UserUsageStat[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequisitionsFromStorage()
      const map = new Map<string, UserUsageStat>()

      records.forEach((r) => {
        const key = r.applicantId
        if (!map.has(key)) {
          map.set(key, {
            userId: r.applicantId,
            userName: r.applicantName,
            department: r.department,
            requisitionCount: 0,
            totalItems: 0,
            reagentCount: 0,
            consumableCount: 0,
          })
        }
        const stat = map.get(key)!
        stat.requisitionCount++
        r.items.forEach((item) => {
          stat.totalItems++
          if (item.materialType === 'reagent') stat.reagentCount++
          else stat.consumableCount++
        })
      })

      resolve(Array.from(map.values()).sort((a, b) => b.requisitionCount - a.requisitionCount))
    }, 200)
  })
}
