import type { PageResult } from '@/types/common'
import type {
  PurchaseRequest,
  PurchaseOrder,
  PurchaseItem,
  PurchaseRequestFormData,
  PurchaseOrderFormData,
  PurchaseReceiveFormData,
  PurchaseReturnFormData,
  PurchaseFilterParams,
  PurchaseRequestStatus,
  PurchaseOrderStatus,
  PurchaseReceiveRecord,
  PurchaseReturnRecord,
  PurchaseStats,
  PurchaseItemType,
} from '@/types/purchase'
import type { BatchFormData } from '@/types/batch'
import type { ConsumableOperationFormData } from '@/types/consumable'
import { generateId, formatDate } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'
import { mockCreateBatch } from './batches'
import { mockConsumableOperation, mockGetConsumable } from './consumables'

const REQUEST_STORAGE_KEY = 'mock_purchase_requests'
const ORDER_STORAGE_KEY = 'mock_purchase_orders'
const RECEIVE_STORAGE_KEY = 'mock_purchase_receives'
const RETURN_STORAGE_KEY = 'mock_purchase_returns'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getRequestsFromStorage(): PurchaseRequest[] {
  const data = localStorage.getItem(REQUEST_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockRequests()
}

function saveRequestsToStorage(requests: PurchaseRequest[]): void {
  localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests))
}

function getOrdersFromStorage(): PurchaseOrder[] {
  const data = localStorage.getItem(ORDER_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockOrders()
}

function saveOrdersToStorage(orders: PurchaseOrder[]): void {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders))
}

function getReceiveRecordsFromStorage(): PurchaseReceiveRecord[] {
  const data = localStorage.getItem(RECEIVE_STORAGE_KEY)
  if (data) {
    try {
      const records = JSON.parse(data)
      return records.map((r: PurchaseReceiveRecord) => ({
        ...r,
        stockInStatus: r.stockInStatus || 'pending',
      }))
    } catch {
      return []
    }
  }
  return []
}

function saveReceiveRecordsToStorage(records: PurchaseReceiveRecord[]): void {
  localStorage.setItem(RECEIVE_STORAGE_KEY, JSON.stringify(records))
}

function getReturnRecordsFromStorage(): PurchaseReturnRecord[] {
  const data = localStorage.getItem(RETURN_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function saveReturnRecordsToStorage(records: PurchaseReturnRecord[]): void {
  localStorage.setItem(RETURN_STORAGE_KEY, JSON.stringify(records))
}

function generateRequestNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PR${year}${month}${day}${random}`
}

function generateOrderNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PO${year}${month}${day}${random}`
}

function createPurchaseItem(
  itemType: PurchaseItemType,
  itemId: string,
  itemName: string,
  specification: string,
  unit: string,
  quantity: number,
  manufacturer?: string,
  brand?: string,
  casNo?: string,
  category?: string
): PurchaseItem {
  return {
    id: generateId(),
    itemType,
    itemId,
    itemName,
    specification,
    unit,
    quantity,
    manufacturer,
    brand,
    casNo,
    category,
    receivedQuantity: 0,
    returnedQuantity: 0,
  }
}

function initMockRequests(): PurchaseRequest[] {
  const now = new Date()
  const requests: PurchaseRequest[] = []

  const mockItems: PurchaseItem[] = [
    createPurchaseItem('reagent', 'reagent_001', '胰蛋白酶', '100mg', '瓶', 10, 'Sigma-Aldrich', 'Sigma', '9002-07-7', '酶'),
    createPurchaseItem('reagent', 'reagent_002', 'PBS缓冲液', '500ml', '瓶', 20, 'Thermo Fisher', 'Gibco', undefined, '缓冲液'),
    createPurchaseItem('consumable', 'consumable_001', '离心管', '15ml', '包', 50, 'Axygen', 'Axygen', undefined, '离心管'),
    createPurchaseItem('consumable', 'consumable_002', '枪头', '200ul', '盒', 100, 'Eppendorf', 'Eppendorf', undefined, '吸头'),
  ]

  const mockData: Array<{
    title: string
    itemType: PurchaseItemType
    items: PurchaseItem[]
    status: PurchaseRequestStatus
    expectedDeliveryDate?: string
    purpose: string
    reason: string
    applicantId: string
    applicantName: string
    applicantRole: User['role']
    approverId?: string
    approverName?: string
    approveTime?: string
    rejectReason?: string
    purchaseOrderId?: string
    purchaseOrderNo?: string
    daysAgo: number
  }> = [
    {
      title: '细胞培养试剂采购申请',
      itemType: 'reagent',
      items: [mockItems[0], mockItems[1]],
      status: 'pending',
      expectedDeliveryDate: formatDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      purpose: '细胞培养实验',
      reason: '库存不足，需要补充实验用试剂',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      daysAgo: 1,
    },
    {
      title: '实验耗材采购申请',
      itemType: 'consumable',
      items: [mockItems[2], mockItems[3]],
      status: 'approving',
      expectedDeliveryDate: formatDate(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
      purpose: '日常实验耗材',
      reason: '消耗量大，库存不足',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      daysAgo: 2,
    },
    {
      title: 'PCR实验试剂采购',
      itemType: 'reagent',
      items: [
        createPurchaseItem('reagent', 'reagent_003', 'Taq DNA聚合酶', '500U', '支', 5, 'Thermo Fisher', 'Invitrogen', '9012-90-2', '酶'),
      ],
      status: 'approved',
      expectedDeliveryDate: formatDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
      purpose: 'PCR扩增实验',
      reason: '即将开展PCR实验，需要采购相关试剂',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      purchaseOrderId: 'order_001',
      purchaseOrderNo: 'PO202606190001',
      daysAgo: 3,
    },
    {
      title: '抗体试剂采购申请',
      itemType: 'reagent',
      items: [
        createPurchaseItem('reagent', 'reagent_004', 'GAPDH抗体', '100ul', '支', 2, 'Abcam', 'Abcam', undefined, '抗体'),
      ],
      status: 'purchasing',
      expectedDeliveryDate: formatDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
      purpose: 'Western Blot实验',
      reason: 'WB实验内参抗体用完',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      purchaseOrderId: 'order_002',
      purchaseOrderNo: 'PO202606180001',
      daysAgo: 5,
    },
    {
      title: '培养基采购申请',
      itemType: 'reagent',
      items: [
        createPurchaseItem('reagent', 'reagent_005', 'DMEM培养基', '500ml', '瓶', 15, 'Thermo Fisher', 'Gibco', undefined, '培养基'),
      ],
      status: 'partial_received',
      expectedDeliveryDate: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      purpose: '细胞培养',
      reason: '细胞培养用培养基库存不足',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      purchaseOrderId: 'order_003',
      purchaseOrderNo: 'PO202606150001',
      daysAgo: 7,
    },
    {
      title: '移液器枪头采购',
      itemType: 'consumable',
      items: [
        createPurchaseItem('consumable', 'consumable_003', '枪头', '1000ul', '盒', 30, 'Eppendorf', 'Eppendorf', undefined, '吸头'),
      ],
      status: 'completed',
      expectedDeliveryDate: formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      purpose: '移液操作',
      reason: '日常消耗，补充库存',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
      purchaseOrderId: 'order_004',
      purchaseOrderNo: 'PO202606100001',
      daysAgo: 12,
    },
    {
      title: '有机试剂采购申请',
      itemType: 'reagent',
      items: [
        createPurchaseItem('reagent', 'reagent_006', '无水乙醇', '500ml', '瓶', 20, '国药集团', '国药', '64-17-5', '有机溶剂'),
      ],
      status: 'rejected',
      expectedDeliveryDate: formatDate(new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)),
      purpose: '实验用有机溶剂',
      reason: '实验需要',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      approverId: 'user_manager_1',
      approverName: '张主任',
      approveTime: formatDate(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)),
      rejectReason: '请说明具体实验用途和用量计算依据',
      daysAgo: 6,
    },
  ]

  mockData.forEach((item, index) => {
    const createdAt = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000)
    const items = item.items.map(i => ({ ...i, id: generateId() }))
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

    requests.push({
      id: generateId(),
      requestNo: generateRequestNo(),
      title: item.title,
      applicantId: item.applicantId,
      applicantName: item.applicantName,
      applicantRole: item.applicantRole,
      status: item.status,
      itemType: item.itemType,
      items,
      totalQuantity,
      expectedDeliveryDate: item.expectedDeliveryDate,
      purpose: item.purpose,
      reason: item.reason,
      approverId: item.approverId,
      approverName: item.approverName,
      approveTime: item.approveTime,
      rejectReason: item.rejectReason,
      purchaseOrderId: item.purchaseOrderId,
      purchaseOrderNo: item.purchaseOrderNo,
      submitTime: item.status !== 'draft' ? formatDate(createdAt) : undefined,
      createdAt: formatDate(createdAt),
      updatedAt: item.approveTime || formatDate(createdAt),
    })
  })

  saveRequestsToStorage(requests)
  return requests
}

function initMockOrders(): PurchaseOrder[] {
  const now = new Date()
  const orders: PurchaseOrder[] = []

  const requests = getRequestsFromStorage()
  const approvedRequests = requests.filter(r => r.status === 'approved' || r.purchaseOrderId)

  const orderData: Array<{
    request: PurchaseRequest
    status: PurchaseOrderStatus
    supplier?: string
    purchaser?: string
    orderDate?: string
    actualDeliveryDate?: string
    receivedQuantity?: number
  }> = [
    {
      request: requests[2],
      status: 'purchasing',
      supplier: 'Thermo Fisher Scientific',
      purchaser: '张主任',
      orderDate: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      receivedQuantity: 0,
    },
    {
      request: requests[3],
      status: 'purchasing',
      supplier: 'Abcam',
      purchaser: '李采购员',
      orderDate: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      receivedQuantity: 0,
    },
    {
      request: requests[4],
      status: 'partial_received',
      supplier: '赛默飞世尔科技',
      purchaser: '王采购',
      orderDate: formatDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      actualDeliveryDate: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      receivedQuantity: 10,
    },
    {
      request: requests[5],
      status: 'completed',
      supplier: 'Eppendorf',
      purchaser: '张主任',
      orderDate: formatDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
      actualDeliveryDate: formatDate(new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)),
      receivedQuantity: 30,
    },
  ]

  orderData.forEach((item, index) => {
    const items = item.request.items.map(i => ({
      ...i,
      id: generateId(),
      receivedQuantity: item.status === 'completed' ? i.quantity : (item.receivedQuantity || 0),
      returnedQuantity: 0,
    }))
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

    orders.push({
      id: item.request.purchaseOrderId || generateId(),
      orderNo: item.request.purchaseOrderNo || generateOrderNo(),
      title: item.request.title,
      requestId: item.request.id,
      requestNo: item.request.requestNo,
      purchaserId: 'user_manager_1',
      purchaserName: item.purchaser,
      supplier: item.supplier,
      status: item.status,
      itemType: item.request.itemType,
      items,
      totalQuantity,
      expectedDeliveryDate: item.request.expectedDeliveryDate,
      actualDeliveryDate: item.actualDeliveryDate,
      orderDate: item.orderDate,
      receivedQuantity: item.receivedQuantity || 0,
      returnedQuantity: 0,
      createdAt: item.orderDate || formatDate(new Date(now.getTime() - (index + 3) * 24 * 60 * 60 * 1000)),
      updatedAt: item.actualDeliveryDate || item.orderDate || formatDate(new Date()),
    })
  })

  saveOrdersToStorage(orders)
  return orders
}

export async function mockGetPurchaseRequests(
  page: number,
  pageSize: number,
  filters?: PurchaseFilterParams
): Promise<PageResult<PurchaseRequest>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = getRequestsFromStorage()

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(kw) ||
              r.requestNo.toLowerCase().includes(kw) ||
              r.applicantName.toLowerCase().includes(kw) ||
              r.items.some(i => i.itemName.toLowerCase().includes(kw))
          )
        }
        if (filters.status) {
          records = records.filter((r) => r.status === filters.status)
        }
        if (filters.itemType) {
          records = records.filter((r) => r.itemType === filters.itemType)
        }
        if (filters.applicantName) {
          records = records.filter((r) =>
            r.applicantName.includes(filters.applicantName!)
          )
        }
        if (filters.startTime) {
          records = records.filter((r) => r.createdAt >= filters.startTime!)
        }
        if (filters.endTime) {
          records = records.filter((r) => r.createdAt <= filters.endTime! + ' 23:59:59')
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

export async function mockGetPurchaseRequest(id: string): Promise<PurchaseRequest | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getRequestsFromStorage()
      const found = records.find((r) => r.id === id)
      resolve(found || null)
    }, 100)
  })
}

export async function mockCreatePurchaseRequest(
  data: PurchaseRequestFormData
): Promise<PurchaseRequest> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequestsFromStorage()
      const now = formatDate(new Date())
      const items: PurchaseItem[] = data.items.map(i => ({
        ...i,
        id: generateId(),
        receivedQuantity: 0,
        returnedQuantity: 0,
      }))
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

      const newRequest: PurchaseRequest = {
        id: generateId(),
        requestNo: generateRequestNo(),
        title: data.title,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantRole: currentUser.role,
        status: 'draft',
        itemType: data.itemType,
        items,
        totalQuantity,
        expectedDeliveryDate: data.expectedDeliveryDate,
        purpose: data.purpose,
        reason: data.reason,
        createdAt: now,
        updatedAt: now,
      }

      records.unshift(newRequest)
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_create',
        targetType: 'purchase_request',
        targetId: newRequest.id,
        targetName: newRequest.title,
        remark: '创建采购申请',
      })

      resolve(newRequest)
    }, 200)
  })
}

export async function mockUpdatePurchaseRequest(
  id: string,
  data: Partial<PurchaseRequestFormData>
): Promise<PurchaseRequest> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRequestsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = records[index]
      if (!['draft', 'rejected'].includes(request.status)) {
        reject(new Error('只有草稿或已驳回状态的申请才能编辑'))
        return
      }

      const now = formatDate(new Date())
      let items = request.items
      if (data.items) {
        items = data.items.map(i => ({
          ...i,
          id: (i as PurchaseItem).id || generateId(),
          receivedQuantity: 0,
          returnedQuantity: 0,
        }))
      }

      const updated: PurchaseRequest = {
        ...request,
        title: data.title || request.title,
        itemType: data.itemType || request.itemType,
        items,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        expectedDeliveryDate: data.expectedDeliveryDate ?? request.expectedDeliveryDate,
        purpose: data.purpose ?? request.purpose,
        reason: data.reason ?? request.reason,
        updatedAt: now,
      }

      records[index] = updated
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_edit',
        targetType: 'purchase_request',
        targetId: updated.id,
        targetName: updated.title,
        remark: '编辑采购申请',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockSubmitPurchaseRequest(id: string): Promise<PurchaseRequest> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRequestsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = records[index]
      if (request.status !== 'draft' && request.status !== 'rejected') {
        reject(new Error('只有草稿或已驳回状态的申请才能提交'))
        return
      }

      const now = formatDate(new Date())
      const updated: PurchaseRequest = {
        ...request,
        status: 'pending',
        submitTime: now,
        updatedAt: now,
      }

      records[index] = updated
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_submit',
        targetType: 'purchase_request',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: ${request.status}`,
        afterContent: `状态: pending`,
        remark: '提交采购申请',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockApprovePurchaseRequest(
  id: string,
  remark?: string
): Promise<{ request: PurchaseRequest; order?: PurchaseOrder }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequestsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = records[index]
      if (request.status !== 'pending') {
        reject(new Error('只有待审批状态的申请才能审批'))
        return
      }

      const now = formatDate(new Date())
      const updatedRequest: PurchaseRequest = {
        ...request,
        status: 'approved',
        approverId: currentUser.id,
        approverName: currentUser.name,
        approveTime: now,
        approveRemark: remark,
        updatedAt: now,
      }

      records[index] = updatedRequest

      const orders = getOrdersFromStorage()
      const orderItems: PurchaseItem[] = request.items.map(i => ({
        ...i,
        id: generateId(),
        receivedQuantity: 0,
        returnedQuantity: 0,
      }))
      const totalQuantity = orderItems.reduce((sum, i) => sum + i.quantity, 0)

      const newOrder: PurchaseOrder = {
        id: generateId(),
        orderNo: generateOrderNo(),
        title: request.title,
        requestId: request.id,
        requestNo: request.requestNo,
        purchaserId: currentUser.id,
        purchaserName: currentUser.name,
        supplier: '',
        status: 'pending',
        itemType: request.itemType,
        items: orderItems,
        totalQuantity,
        expectedDeliveryDate: request.expectedDeliveryDate,
        orderDate: now,
        remark: remark || '审批通过自动生成',
        receivedQuantity: 0,
        returnedQuantity: 0,
        createdAt: now,
        updatedAt: now,
      }

      orders.unshift(newOrder)
      saveOrdersToStorage(orders)

      updatedRequest.status = 'purchasing'
      updatedRequest.purchaseOrderId = newOrder.id
      updatedRequest.purchaseOrderNo = newOrder.orderNo
      records[index] = updatedRequest
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_approve',
        targetType: 'purchase_request',
        targetId: updatedRequest.id,
        targetName: updatedRequest.title,
        beforeContent: `状态: pending`,
        afterContent: `状态: purchasing, 已生成采购单 ${newOrder.orderNo}`,
        remark: remark || '审批通过采购申请并自动生成采购单',
      })

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_order_create',
        targetType: 'purchase_order',
        targetId: newOrder.id,
        targetName: newOrder.title,
        remark: `审批通过后自动从采购申请 ${request.requestNo} 生成采购单`,
      })

      resolve({ request: updatedRequest, order: newOrder })
    }, 200)
  })
}

export async function mockRejectPurchaseRequest(
  id: string,
  reason: string
): Promise<PurchaseRequest> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getRequestsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = records[index]
      if (request.status !== 'pending') {
        reject(new Error('只有待审批状态的申请才能驳回'))
        return
      }

      const now = formatDate(new Date())
      const updated: PurchaseRequest = {
        ...request,
        status: 'rejected',
        approverId: currentUser.id,
        approverName: currentUser.name,
        approveTime: now,
        rejectReason: reason,
        updatedAt: now,
      }

      records[index] = updated
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_reject',
        targetType: 'purchase_request',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: pending`,
        afterContent: `状态: rejected`,
        remark: `驳回原因: ${reason}`,
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockDeletePurchaseRequest(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getRequestsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = records[index]
      if (!['draft', 'rejected'].includes(request.status)) {
        reject(new Error('只有草稿或已驳回状态的申请才能删除'))
        return
      }

      records.splice(index, 1)
      saveRequestsToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_request_delete',
        targetType: 'purchase_request',
        targetId: id,
        targetName: request.title,
        remark: '删除采购申请',
      })

      resolve()
    }, 200)
  })
}

export async function mockCreatePurchaseOrder(
  requestId: string,
  data: PurchaseOrderFormData
): Promise<PurchaseOrder> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const requests = getRequestsFromStorage()
      const requestIndex = requests.findIndex((r) => r.id === requestId)
      if (requestIndex === -1) {
        reject(new Error('采购申请不存在'))
        return
      }

      const request = requests[requestIndex]
      if (request.status !== 'approved') {
        reject(new Error('只有审批通过的申请才能生成采购单'))
        return
      }
      if (request.purchaseOrderId) {
        reject(new Error('该采购申请已生成采购单'))
        return
      }

      const orders = getOrdersFromStorage()
      const now = formatDate(new Date())
      const items: PurchaseItem[] = request.items.map(i => ({
        ...i,
        id: generateId(),
        receivedQuantity: 0,
        returnedQuantity: 0,
      }))
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

      const newOrder: PurchaseOrder = {
        id: generateId(),
        orderNo: generateOrderNo(),
        title: data.title || request.title,
        requestId: request.id,
        requestNo: request.requestNo,
        purchaserId: data.purchaserId || currentUser.id,
        purchaserName: data.purchaserName || currentUser.name,
        supplier: data.supplier,
        status: 'pending',
        itemType: request.itemType,
        items,
        totalQuantity,
        expectedDeliveryDate: data.expectedDeliveryDate || request.expectedDeliveryDate,
        orderDate: data.orderDate || now,
        remark: data.remark,
        receivedQuantity: 0,
        returnedQuantity: 0,
        createdAt: now,
        updatedAt: now,
      }

      orders.unshift(newOrder)
      saveOrdersToStorage(orders)

      requests[requestIndex] = {
        ...request,
        status: 'purchasing',
        purchaseOrderId: newOrder.id,
        purchaseOrderNo: newOrder.orderNo,
        updatedAt: now,
      }
      saveRequestsToStorage(requests)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_order_create',
        targetType: 'purchase_order',
        targetId: newOrder.id,
        targetName: newOrder.title,
        remark: `从采购申请 ${request.requestNo} 生成采购单`,
      })

      resolve(newOrder)
    }, 200)
  })
}

export async function mockGetPurchaseOrders(
  page: number,
  pageSize: number,
  filters?: PurchaseFilterParams
): Promise<PageResult<PurchaseOrder>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = getOrdersFromStorage()

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(kw) ||
              r.orderNo.toLowerCase().includes(kw) ||
              r.requestNo.toLowerCase().includes(kw) ||
              r.supplier?.toLowerCase().includes(kw) ||
              r.items.some(i => i.itemName.toLowerCase().includes(kw))
          )
        }
        if (filters.status) {
          records = records.filter((r) => r.status === filters.status)
        }
        if (filters.itemType) {
          records = records.filter((r) => r.itemType === filters.itemType)
        }
        if (filters.startTime) {
          records = records.filter((r) => r.createdAt >= filters.startTime!)
        }
        if (filters.endTime) {
          records = records.filter((r) => r.createdAt <= filters.endTime! + ' 23:59:59')
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

export async function mockGetPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getOrdersFromStorage()
      const found = records.find((r) => r.id === id)
      resolve(found || null)
    }, 100)
  })
}

export async function mockGetPurchaseOrderByRequestId(requestId: string): Promise<PurchaseOrder | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getOrdersFromStorage()
      const found = records.find((r) => r.requestId === requestId)
      if (found) {
        resolve(found)
      } else {
        reject(new Error('该采购申请尚未生成采购单'))
      }
    }, 100)
  })
}

export async function mockUpdatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrderFormData>
): Promise<PurchaseOrder> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const records = getOrdersFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('采购单不存在'))
        return
      }

      const order = records[index]
      if (!['pending', 'purchasing'].includes(order.status)) {
        reject(new Error('只有待采购或采购中状态的采购单才能编辑'))
        return
      }

      const now = formatDate(new Date())
      const updated: PurchaseOrder = {
        ...order,
        title: data.title || order.title,
        supplier: data.supplier ?? order.supplier,
        purchaserId: data.purchaserId ?? order.purchaserId,
        purchaserName: data.purchaserName ?? order.purchaserName,
        orderDate: data.orderDate ?? order.orderDate,
        expectedDeliveryDate: data.expectedDeliveryDate ?? order.expectedDeliveryDate,
        remark: data.remark ?? order.remark,
        updatedAt: now,
      }

      records[index] = updated
      saveOrdersToStorage(records)

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_order_edit',
        targetType: 'purchase_order',
        targetId: updated.id,
        targetName: updated.title,
        remark: '编辑采购单',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockStartPurchase(id: string): Promise<PurchaseOrder> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const orders = getOrdersFromStorage()
      const orderIndex = orders.findIndex((r) => r.id === id)
      if (orderIndex === -1) {
        reject(new Error('采购单不存在'))
        return
      }

      const order = orders[orderIndex]
      if (order.status !== 'pending') {
        reject(new Error('只有待采购状态的采购单才能开始采购'))
        return
      }

      const now = formatDate(new Date())
      const updated: PurchaseOrder = {
        ...order,
        status: 'purchasing',
        updatedAt: now,
      }

      orders[orderIndex] = updated
      saveOrdersToStorage(orders)

      const requests = getRequestsFromStorage()
      const requestIndex = requests.findIndex(r => r.id === order.requestId)
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: 'purchasing',
          updatedAt: now,
        }
        saveRequestsToStorage(requests)
      }

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_order_start',
        targetType: 'purchase_order',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: pending`,
        afterContent: `状态: purchasing`,
        remark: '开始采购',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockReceivePurchaseItem(
  orderId: string,
  data: PurchaseReceiveFormData
): Promise<PurchaseReceiveRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const orders = getOrdersFromStorage()
      const orderIndex = orders.findIndex((r) => r.id === orderId)
      if (orderIndex === -1) {
        reject(new Error('采购单不存在'))
        return
      }

      const order = orders[orderIndex]
      if (!['purchasing', 'partial_received'].includes(order.status)) {
        reject(new Error('只有采购中或部分到货状态的采购单才能登记到货'))
        return
      }

      const itemIndex = order.items.findIndex(i => i.id === data.itemId)
      if (itemIndex === -1) {
        reject(new Error('采购明细不存在'))
        return
      }

      const item = order.items[itemIndex]
      const remainingQuantity = item.quantity - item.receivedQuantity - item.returnedQuantity
      if (data.receivedQuantity > remainingQuantity) {
        reject(new Error(`到货数量不能超过剩余未到货数量 ${remainingQuantity} ${item.unit}`))
        return
      }

      const now = formatDate(new Date())
      const receiveRecord: PurchaseReceiveRecord = {
        id: generateId(),
        orderId,
        itemId: data.itemId,
        itemName: data.itemName,
        receivedQuantity: data.receivedQuantity,
        unit: data.unit,
        receivedDate: data.receivedDate || now,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
        batchNumber: data.batchNumber,
        productionDate: data.productionDate,
        expiryDate: data.expiryDate,
        storageLocation: data.storageLocation,
        remark: data.remark,
        stockInStatus: 'pending',
        createdAt: now,
      }

      const receiveRecords = getReceiveRecordsFromStorage()
      receiveRecords.unshift(receiveRecord)
      saveReceiveRecordsToStorage(receiveRecords)

      const updatedItems = [...order.items]
      updatedItems[itemIndex] = {
        ...item,
        receivedQuantity: item.receivedQuantity + data.receivedQuantity,
      }

      const totalReceived = updatedItems.reduce((sum, i) => sum + i.receivedQuantity, 0)
      const allReceived = updatedItems.every(i => i.receivedQuantity + i.returnedQuantity >= i.quantity)

      const updatedOrder: PurchaseOrder = {
        ...order,
        items: updatedItems,
        receivedQuantity: totalReceived,
        status: allReceived ? 'fully_received' : 'partial_received',
        actualDeliveryDate: order.actualDeliveryDate || data.receivedDate || now,
        updatedAt: now,
      }

      orders[orderIndex] = updatedOrder
      saveOrdersToStorage(orders)

      const requests = getRequestsFromStorage()
      const requestIndex = requests.findIndex(r => r.id === order.requestId)
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: allReceived ? 'fully_received' : 'partial_received',
          updatedAt: now,
        }
        saveRequestsToStorage(requests)
      }

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_receive',
        targetType: 'purchase_order',
        targetId: updatedOrder.id,
        targetName: updatedOrder.title,
        afterContent: `${data.itemName} 到货 ${data.receivedQuantity} ${data.unit}, 入库状态: 待入库`,
        remark: data.remark || '登记到货',
      })

      resolve(receiveRecord)
    }, 200)
  })
}

export async function mockStockInReceiveRecord(
  receiveRecordId: string
): Promise<{ batchId?: string; consumableId?: string; success: boolean }> {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const receiveRecords = getReceiveRecordsFromStorage()
      const recordIndex = receiveRecords.findIndex(r => r.id === receiveRecordId)
      if (recordIndex === -1) {
        reject(new Error('到货记录不存在'))
        return
      }

      const record = receiveRecords[recordIndex]
      if (record.stockInStatus === 'completed') {
        reject(new Error('该到货记录已入库'))
        return
      }

      const orders = getOrdersFromStorage()
      const order = orders.find(o => o.id === record.orderId)
      if (!order) {
        reject(new Error('采购单不存在'))
        return
      }

      const purchaseItem = order.items.find(i => i.id === record.itemId)

      const now = formatDate(new Date())
      let stockInId: string | undefined
      let success = false

      if (order.itemType === 'reagent') {
        if (!record.batchNumber) {
          reject(new Error('试剂入库必须填写批次号'))
          return
        }

        const batchData: BatchFormData = {
          reagentId: purchaseItem?.itemId || '',
          batchNumber: record.batchNumber,
          productionDate: record.productionDate || '',
          expiryDate: record.expiryDate || '',
          initialQuantity: record.receivedQuantity,
          storageLocation: record.storageLocation || '室温',
          receivedDate: record.receivedDate,
          remark: record.remark ? `采购入库: ${record.remark}` : '采购入库',
        }

        const batch = await mockCreateBatch(batchData)
        stockInId = batch.id
        success = true

        receiveRecords[recordIndex] = {
          ...record,
          stockInStatus: 'completed',
          stockInId: batch.id,
          stockInTime: now,
        }
      } else {
        const consumableId = purchaseItem?.itemId
        if (!consumableId) {
          reject(new Error('耗材ID不存在'))
          return
        }

        const consumable = await mockGetConsumable(consumableId)
        if (!consumable) {
          reject(new Error('耗材不存在，请先在耗材管理中创建该耗材'))
          return
        }

        const operationData: ConsumableOperationFormData = {
          type: 'receive',
          quantity: record.receivedQuantity,
          purpose: '采购入库',
          remark: record.remark ? `采购到货入库: ${record.remark}` : '采购到货入库',
        }

        const operation = await mockConsumableOperation(consumableId, operationData)
        stockInId = operation.id
        success = true

        receiveRecords[recordIndex] = {
          ...record,
          stockInStatus: 'completed',
          stockInId: operation.id,
          stockInTime: now,
        }
      }

      saveReceiveRecordsToStorage(receiveRecords)

      addAuditLog({
        module: 'purchase',
        operationType: 'receive',
        targetType: order.itemType === 'reagent' ? 'reagent_batch' : 'consumable',
        targetId: stockInId || '',
        targetName: record.itemName,
        beforeContent: `入库状态: 待入库`,
        afterContent: `入库状态: 已完成, 数量: ${record.receivedQuantity} ${record.unit}`,
        remark: `${order.itemType === 'reagent' ? '试剂批次' : '耗材库存'}入库成功, 批次号: ${record.batchNumber || 'N/A'}`,
      })

      resolve({
        batchId: order.itemType === 'reagent' ? stockInId : undefined,
        consumableId: order.itemType === 'consumable' ? purchaseItem?.itemId : undefined,
        success,
      })
    } catch (e: any) {
      const receiveRecords = getReceiveRecordsFromStorage()
      const recordIndex = receiveRecords.findIndex(r => r.id === receiveRecordId)
      if (recordIndex !== -1) {
        receiveRecords[recordIndex] = {
          ...receiveRecords[recordIndex],
          stockInStatus: 'failed',
        }
        saveReceiveRecordsToStorage(receiveRecords)
      }
      reject(e)
    }
  })
}

export async function mockReturnPurchaseItem(
  orderId: string,
  data: PurchaseReturnFormData
): Promise<PurchaseReturnRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const orders = getOrdersFromStorage()
      const orderIndex = orders.findIndex((r) => r.id === orderId)
      if (orderIndex === -1) {
        reject(new Error('采购单不存在'))
        return
      }

      const order = orders[orderIndex]
      if (!['partial_received', 'fully_received', 'completed'].includes(order.status)) {
        reject(new Error('只有已到货状态的采购单才能退货'))
        return
      }

      const itemIndex = order.items.findIndex(i => i.id === data.itemId)
      if (itemIndex === -1) {
        reject(new Error('采购明细不存在'))
        return
      }

      const item = order.items[itemIndex]
      const returnableQuantity = item.receivedQuantity - item.returnedQuantity
      if (data.returnedQuantity > returnableQuantity) {
        reject(new Error(`退货数量不能超过已到货数量 ${returnableQuantity} ${item.unit}`))
        return
      }

      const now = formatDate(new Date())
      const returnRecord: PurchaseReturnRecord = {
        id: generateId(),
        orderId,
        itemId: data.itemId,
        itemName: data.itemName,
        returnedQuantity: data.returnedQuantity,
        unit: data.unit,
        returnedDate: data.returnedDate || now,
        returnerId: currentUser.id,
        returnerName: currentUser.name,
        reason: data.reason,
        remark: data.remark,
        createdAt: now,
      }

      const returnRecords = getReturnRecordsFromStorage()
      returnRecords.unshift(returnRecord)
      saveReturnRecordsToStorage(returnRecords)

      const updatedItems = [...order.items]
      updatedItems[itemIndex] = {
        ...item,
        returnedQuantity: item.returnedQuantity + data.returnedQuantity,
      }

      const totalReturned = updatedItems.reduce((sum, i) => sum + i.returnedQuantity, 0)
      const totalReceived = updatedItems.reduce((sum, i) => sum + i.receivedQuantity, 0)
      const allReturned = updatedItems.every(i => i.returnedQuantity >= i.quantity)
      const allFullyReceivedAfterReturn = updatedItems.every(
        i => (i.receivedQuantity - i.returnedQuantity) >= i.quantity
      )
      const anyPartialReceived = updatedItems.some(
        i => (i.receivedQuantity - i.returnedQuantity) > 0 && (i.receivedQuantity - i.returnedQuantity) < i.quantity
      )

      let newStatus: PurchaseOrderStatus = order.status
      if (allReturned) {
        newStatus = 'returned'
      } else if (allFullyReceivedAfterReturn) {
        newStatus = 'fully_received'
      } else if (anyPartialReceived || totalReceived - totalReturned > 0) {
        newStatus = 'partial_received'
      } else {
        newStatus = 'purchasing'
      }

      const updatedOrder: PurchaseOrder = {
        ...order,
        items: updatedItems,
        returnedQuantity: totalReturned,
        status: newStatus,
        updatedAt: now,
      }

      orders[orderIndex] = updatedOrder
      saveOrdersToStorage(orders)

      const requests = getRequestsFromStorage()
      const requestIndex = requests.findIndex(r => r.id === order.requestId)
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: newStatus,
          updatedAt: now,
        }
        saveRequestsToStorage(requests)
      }

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_return',
        targetType: 'purchase_order',
        targetId: updatedOrder.id,
        targetName: updatedOrder.title,
        beforeContent: `状态: ${order.status}`,
        afterContent: `状态: ${newStatus}, ${data.itemName} 退货 ${data.returnedQuantity} ${data.unit}`,
        remark: `退货原因: ${data.reason}`,
      })

      resolve(returnRecord)
    }, 200)
  })
}

export async function mockCompletePurchaseOrder(id: string): Promise<PurchaseOrder> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const orders = getOrdersFromStorage()
      const orderIndex = orders.findIndex((r) => r.id === id)
      if (orderIndex === -1) {
        reject(new Error('采购单不存在'))
        return
      }

      const order = orders[orderIndex]
      if (order.status !== 'fully_received') {
        reject(new Error('只有全部到货状态的采购单才能完成'))
        return
      }

      const now = formatDate(new Date())
      const updated: PurchaseOrder = {
        ...order,
        status: 'completed',
        updatedAt: now,
      }

      orders[orderIndex] = updated
      saveOrdersToStorage(orders)

      const requests = getRequestsFromStorage()
      const requestIndex = requests.findIndex(r => r.id === order.requestId)
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: 'completed',
          updatedAt: now,
        }
        saveRequestsToStorage(requests)
      }

      addAuditLog({
        module: 'purchase',
        operationType: 'purchase_order_complete',
        targetType: 'purchase_order',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: fully_received`,
        afterContent: `状态: completed`,
        remark: '完成采购单',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockGetReceiveRecords(orderId: string): Promise<PurchaseReceiveRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getReceiveRecordsFromStorage()
      const filtered = records.filter(r => r.orderId === orderId)
      resolve(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }, 100)
  })
}

export async function mockGetReturnRecords(orderId: string): Promise<PurchaseReturnRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getReturnRecordsFromStorage()
      const filtered = records.filter(r => r.orderId === orderId)
      resolve(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }, 100)
  })
}

export async function mockGetPurchaseStats(): Promise<PurchaseStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const requests = getRequestsFromStorage()
      const orders = getOrdersFromStorage()
      resolve({
        totalRequests: requests.length,
        pendingApproval: requests.filter(r => r.status === 'pending' || r.status === 'approving').length,
        purchasing: requests.filter(r => r.status === 'purchasing').length,
        partialReceived: requests.filter(r => r.status === 'partial_received').length,
        fullyReceived: requests.filter(r => r.status === 'fully_received').length,
        completed: requests.filter(r => r.status === 'completed').length,
        returned: requests.filter(r => r.status === 'returned').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        totalOrders: orders.length,
      })
    }, 100)
  })
}
