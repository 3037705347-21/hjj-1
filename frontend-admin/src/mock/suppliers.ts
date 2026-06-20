import type {
  Supplier,
  SupplierFormData,
  SupplierDetail,
  SupplierFilterParams,
  SupplierQualification,
  SupplierPriceHistory,
  SupplierDeliveryRecord,
  SupplierExceptionRecord,
} from '@/types/supplier'
import type { PurchaseOrder, PurchaseReceiveRecord, PurchaseReturnRecord } from '@/types/purchase'
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'
import { addAuditLog } from './audit'
import type { User } from '@/types/user'
import { storage } from '@/utils/storage'

const PURCHASE_ORDER_STORAGE_KEY = 'mock_purchase_orders'
const PURCHASE_RECEIVE_STORAGE_KEY = 'mock_purchase_receives'
const PURCHASE_RETURN_STORAGE_KEY = 'mock_purchase_returns'

const STORAGE_KEY = 'mock_suppliers'
const QUALIFICATION_STORAGE_KEY = 'mock_supplier_qualifications'
const PRICE_HISTORY_STORAGE_KEY = 'mock_supplier_price_history'
const DELIVERY_RECORDS_STORAGE_KEY = 'mock_supplier_delivery_records'
const EXCEPTION_RECORDS_STORAGE_KEY = 'mock_supplier_exception_records'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getSuppliersFromStorage(): Supplier[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockSuppliers()
}

function saveSuppliersToStorage(suppliers: Supplier[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers))
}

function getQualificationsFromStorage(): SupplierQualification[] {
  const data = localStorage.getItem(QUALIFICATION_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function saveQualificationsToStorage(qualifications: SupplierQualification[]): void {
  localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(qualifications))
}

function getPriceHistoryFromStorage(): SupplierPriceHistory[] {
  const data = localStorage.getItem(PRICE_HISTORY_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function savePriceHistoryToStorage(history: SupplierPriceHistory[]): void {
  localStorage.setItem(PRICE_HISTORY_STORAGE_KEY, JSON.stringify(history))
}

function getDeliveryRecordsFromStorage(): SupplierDeliveryRecord[] {
  const data = localStorage.getItem(DELIVERY_RECORDS_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function saveDeliveryRecordsToStorage(records: SupplierDeliveryRecord[]): void {
  localStorage.setItem(DELIVERY_RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function getExceptionRecordsFromStorage(): SupplierExceptionRecord[] {
  const data = localStorage.getItem(EXCEPTION_RECORDS_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockExceptionRecords()
}

function saveExceptionRecordsToStorage(records: SupplierExceptionRecord[]): void {
  localStorage.setItem(EXCEPTION_RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function getPurchaseOrdersFromStorage(): PurchaseOrder[] {
  const data = localStorage.getItem(PURCHASE_ORDER_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function getPurchaseReceiveRecordsFromStorage(): PurchaseReceiveRecord[] {
  const data = localStorage.getItem(PURCHASE_RECEIVE_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function getPurchaseReturnRecordsFromStorage(): PurchaseReturnRecord[] {
  const data = localStorage.getItem(PURCHASE_RETURN_STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return []
}

function getSupplierPurchaseOrders(supplierId: string): PurchaseOrder[] {
  const allOrders = getPurchaseOrdersFromStorage()
  return allOrders.filter(o => o.supplierId === supplierId)
}

function generateDeliveryRecordsFromOrders(supplierId: string, orders: PurchaseOrder[]): SupplierDeliveryRecord[] {
  const records: SupplierDeliveryRecord[] = []
  orders.forEach(order => {
    if (order.status === 'partial_received' || order.status === 'fully_received' || order.status === 'completed') {
      const expectedDate = order.expectedDeliveryDate || order.createdAt
      const actualDate = order.actualDeliveryDate || order.updatedAt
      const expected = new Date(expectedDate)
      const actual = new Date(actualDate)
      const delayDays = Math.ceil((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
      const isOnTime = delayDays <= 0

      records.push({
        id: `delivery_${order.id}`,
        supplierId,
        orderId: order.id,
        orderNo: order.orderNo,
        expectedDate,
        actualDate,
        isOnTime,
        delayDays: isOnTime ? 0 : delayDays,
        items: order.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          receivedQuantity: item.receivedQuantity,
        })),
        remark: order.remark,
      })
    }
  })
  return records.sort((a, b) => new Date(b.actualDate).getTime() - new Date(a.actualDate).getTime())
}

function generatePriceHistoryFromOrders(supplierId: string, orders: PurchaseOrder[]): SupplierPriceHistory[] {
  const history: SupplierPriceHistory[] = []
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.unitPrice && item.unitPrice > 0) {
        history.push({
          id: `price_${order.id}_${item.itemId}`,
          supplierId,
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          specification: item.specification,
          unit: item.unit,
          unitPrice: item.unitPrice,
          quoteDate: order.orderDate || order.createdAt,
          validFrom: order.orderDate || order.createdAt,
        })
      }
    })
  })
  return history.sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime())
}

function calculateSupplierStats(supplierId: string, orders: PurchaseOrder[]): { totalOrders: number; totalAmount: number; onTimeDeliveryRate: number; qualityPassRate: number } {
  const totalOrders = orders.length
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const deliveryRecords = generateDeliveryRecordsFromOrders(supplierId, orders)
  const onTimeCount = deliveryRecords.filter(r => r.isOnTime).length
  const onTimeDeliveryRate = deliveryRecords.length > 0
    ? Math.round((onTimeCount / deliveryRecords.length) * 1000) / 10
    : 100.0

  const orderIds = orders.map(o => o.id)
  const allReceiveRecords = getPurchaseReceiveRecordsFromStorage()
  const supplierReceiveRecords = allReceiveRecords.filter(r => orderIds.includes(r.orderId))

  const allReturnRecords = getPurchaseReturnRecordsFromStorage()
  const supplierReturnRecords = allReturnRecords.filter(r => orderIds.includes(r.orderId))

  const allExceptionRecords = getExceptionRecordsFromStorage()
  const qualityExceptions = allExceptionRecords.filter(
    e => e.supplierId === supplierId && e.type === 'quality'
  )

  const totalReceived = supplierReceiveRecords.reduce((sum, r) => sum + r.receivedQuantity, 0)
  const totalReturned = supplierReturnRecords.reduce((sum, r) => sum + r.returnedQuantity, 0)
  const totalFailed = supplierReceiveRecords
    .filter(r => r.stockInStatus === 'failed')
    .reduce((sum, r) => sum + r.receivedQuantity, 0)

  const exceptionDeductQty = qualityExceptions
    .filter(e => e.status !== 'resolved' && e.status !== 'closed')
    .length

  const qualified = totalReceived > 0 ? Math.max(0, totalReceived - totalReturned - totalFailed) : 0
  let qualityPassRate = totalReceived > 0
    ? Math.round((qualified / totalReceived) * 1000) / 10
    : 100.0

  if (totalReceived > 0 && exceptionDeductQty > 0) {
    const deduction = Math.min(exceptionDeductQty * 1.5, qualityPassRate - 50)
    if (deduction > 0) {
      qualityPassRate = Math.round((qualityPassRate - deduction) * 10) / 10
    }
  }

  return {
    totalOrders,
    totalAmount,
    onTimeDeliveryRate,
    qualityPassRate,
  }
}

function initMockSuppliers(): Supplier[] {
  const now = new Date().toISOString()
  const suppliers: Supplier[] = [
    {
      id: 'sup_001',
      name: '上海生化试剂有限公司',
      shortName: '上海生化',
      contactPerson: '张经理',
      contactPhone: '13800138001',
      contactEmail: 'zhang@shshengchem.com',
      address: '上海市浦东新区张江高科技园区碧波路500号',
      mainCategories: ['试剂类', '耗材类'],
      paymentTerms: '月结30天',
      status: 'active',
      rating: 'A',
      bankAccount: '6222021234567890123',
      bankName: '中国工商银行上海分行',
      taxNumber: '91310115MA1K3X5Y8C',
      businessLicense: '91310115MA1K3X5Y8C',
      establishedDate: '2010-03-15',
      registeredCapital: '500万',
      website: 'www.shshengchem.com',
      remark: '长期合作伙伴，供货稳定，质量可靠',
      totalOrders: 156,
      totalAmount: 1285600,
      onTimeDeliveryRate: 96.5,
      qualityPassRate: 98.2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup_002',
      name: '北京实验器材股份有限公司',
      shortName: '北实股份',
      contactPerson: '李总监',
      contactPhone: '13900139002',
      contactEmail: 'li@bjlabequip.com',
      address: '北京市海淀区中关村南大街5号',
      mainCategories: ['仪器设备', '玻璃器皿'],
      paymentTerms: '月结60天',
      status: 'active',
      rating: 'B',
      bankAccount: '6228480012345678901',
      bankName: '中国农业银行北京分行',
      taxNumber: '91110108MA01G6X52D',
      businessLicense: '91110108MA01G6X52D',
      establishedDate: '2005-08-20',
      registeredCapital: '1000万',
      website: 'www.bjlabequip.com',
      remark: '大型设备供应商，售后服务较好',
      totalOrders: 89,
      totalAmount: 2650000,
      onTimeDeliveryRate: 88.3,
      qualityPassRate: 94.5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup_003',
      name: '广州防护用品有限公司',
      shortName: '广防用品',
      contactPerson: '王经理',
      contactPhone: '13700137003',
      contactEmail: 'wang@gzppe.com',
      address: '广州市天河区黄埔大道西100号',
      mainCategories: ['防护用品', '耗材类'],
      paymentTerms: '货到付款',
      status: 'active',
      rating: 'B',
      bankAccount: '6217003320001234567',
      bankName: '中国建设银行广州分行',
      taxNumber: '91440101MA59G6T88K',
      businessLicense: '91440101MA59G6T88K',
      establishedDate: '2015-01-10',
      registeredCapital: '200万',
      website: 'www.gzppe.com',
      remark: '防护用品专业供应商',
      totalOrders: 234,
      totalAmount: 456800,
      onTimeDeliveryRate: 99.1,
      qualityPassRate: 96.8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup_004',
      name: '深圳玻璃仪器厂',
      shortName: '深玻仪器',
      contactPerson: '陈厂长',
      contactPhone: '13600136004',
      contactEmail: 'chen@szglass.com',
      address: '深圳市宝安区石岩街道宝石路200号',
      mainCategories: ['玻璃器皿'],
      paymentTerms: '月结30天',
      status: 'pending',
      rating: 'C',
      bankAccount: '6225880012345678',
      bankName: '招商银行深圳分行',
      taxNumber: '91440300MA5D88K89P',
      businessLicense: '91440300MA5D88K89P',
      establishedDate: '2018-06-01',
      registeredCapital: '100万',
      website: 'www.szglass.com',
      remark: '新供应商，待审核资质',
      totalOrders: 12,
      totalAmount: 35600,
      onTimeDeliveryRate: 75.0,
      qualityPassRate: 85.0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sup_005',
      name: '杭州化学试剂批发部',
      shortName: '杭化批发',
      contactPerson: '刘经理',
      contactPhone: '13500135005',
      contactEmail: 'liu@hangzhouchem.com',
      address: '杭州市西湖区文三路369号',
      mainCategories: ['试剂类'],
      paymentTerms: '月结60天',
      status: 'inactive',
      rating: 'D',
      bankAccount: '6216610012345678901',
      bankName: '中国银行杭州分行',
      taxNumber: '91330106MA27W5X23M',
      businessLicense: '91330106MA27W5X23M',
      establishedDate: '2012-11-25',
      registeredCapital: '80万',
      website: '',
      remark: '质量不稳定，已停止合作',
      totalOrders: 45,
      totalAmount: 128000,
      onTimeDeliveryRate: 62.3,
      qualityPassRate: 70.5,
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveSuppliersToStorage(suppliers)
  initMockQualifications()

  return suppliers
}

function initMockQualifications(): SupplierQualification[] {
  const now = new Date().toISOString()
  const qualifications: SupplierQualification[] = [
    {
      id: 'qual_001',
      supplierId: 'sup_001',
      name: '营业执照',
      type: '营业执照',
      fileUrl: '/files/qualifications/sup_001_license.pdf',
      fileName: '上海生化营业执照.pdf',
      fileSize: 2048000,
      expireDate: '2027-03-15',
      issuedDate: '2022-03-15',
      remark: '三证合一',
      createdAt: now,
    },
    {
      id: 'qual_002',
      supplierId: 'sup_001',
      name: '医疗器械经营许可证',
      type: '医疗器械经营许可证',
      fileUrl: '/files/qualifications/sup_001_medical.pdf',
      fileName: '医疗器械经营许可证.pdf',
      fileSize: 1536000,
      expireDate: '2026-08-20',
      issuedDate: '2021-08-20',
      remark: '',
      createdAt: now,
    },
    {
      id: 'qual_003',
      supplierId: 'sup_002',
      name: '营业执照',
      type: '营业执照',
      fileUrl: '/files/qualifications/sup_002_license.pdf',
      fileName: '北京实验器材营业执照.pdf',
      fileSize: 1792000,
      expireDate: '2028-01-10',
      issuedDate: '2023-01-10',
      remark: '',
      createdAt: now,
    },
    {
      id: 'qual_004',
      supplierId: 'sup_003',
      name: 'ISO9001认证',
      type: 'ISO认证',
      fileUrl: '/files/qualifications/sup_003_iso.pdf',
      fileName: 'ISO9001质量体系认证.pdf',
      fileSize: 896000,
      expireDate: '2025-12-31',
      issuedDate: '2022-12-31',
      remark: '质量管理体系认证',
      createdAt: now,
    },
  ]

  saveQualificationsToStorage(qualifications)
  return qualifications
}

function initMockPriceHistory(): SupplierPriceHistory[] {
  const orders = getPurchaseOrdersFromStorage()
  const allSuppliers = getSuppliersFromStorage()
  const history: SupplierPriceHistory[] = []

  allSuppliers.forEach(supplier => {
    const supplierOrders = orders.filter(o => o.supplierId === supplier.id)
    const supplierHistory = generatePriceHistoryFromOrders(supplier.id, supplierOrders)
    history.push(...supplierHistory)
  })

  savePriceHistoryToStorage(history)
  return history
}

function initMockDeliveryRecords(): SupplierDeliveryRecord[] {
  const orders = getPurchaseOrdersFromStorage()
  const allSuppliers = getSuppliersFromStorage()
  const records: SupplierDeliveryRecord[] = []

  allSuppliers.forEach(supplier => {
    const supplierOrders = orders.filter(o => o.supplierId === supplier.id)
    const supplierRecords = generateDeliveryRecordsFromOrders(supplier.id, supplierOrders)
    records.push(...supplierRecords)
  })

  saveDeliveryRecordsToStorage(records)
  return records
}

function initMockExceptionRecords(): SupplierExceptionRecord[] {
  const now = new Date().toISOString()
  const user = getCurrentUser()
  const defaultHandler = user?.id || '2'
  const defaultHandlerName = user?.name || '李主任'

  const orders = getPurchaseOrdersFromStorage()
  const sup001Orders = orders.filter(o => o.supplierId === 'sup_001')
  const sup002Orders = orders.filter(o => o.supplierId === 'sup_002')

  const records: SupplierExceptionRecord[] = []

  if (sup001Orders.length > 0) {
    const order = sup001Orders.find(o => o.status === 'partial_received') || sup001Orders[0]
    records.push({
      id: 'except_001',
      supplierId: 'sup_001',
      type: 'quality',
      title: '试剂纯度不达标',
      description: '收到的DMEM培养基纯度检测不合格，pH值偏移超出允许范围，部分批次出现沉淀',
      orderId: order.id,
      orderNo: order.orderNo,
      status: 'resolved',
      level: 'high',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: '已更换批次并退款处理，供应商补发合格品',
    })
  }

  if (sup001Orders.length > 1) {
    const order = sup001Orders.find(o => o.status === 'purchasing') || sup001Orders[1]
    records.push({
      id: 'except_004',
      supplierId: 'sup_001',
      type: 'price',
      title: '价格突然上涨',
      description: 'PBS缓冲液价格上涨20%，未提前通知，影响预算计划',
      orderId: order.id,
      orderNo: order.orderNo,
      status: 'resolved',
      level: 'medium',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: '已协商恢复原价，提供补偿折扣',
    })
  }

  if (sup002Orders.length > 0) {
    const order = sup002Orders.find(o => o.status === 'completed') || sup002Orders[0]
    records.push({
      id: 'except_002',
      supplierId: 'sup_002',
      type: 'delivery',
      title: '延期交货',
      description: '移液器枪头订单延期5天交付，影响实验进度，部分产品外包装破损',
      orderId: order.id,
      orderNo: order.orderNo,
      status: 'processing',
      level: 'medium',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    })
    records.push({
      id: 'except_005',
      supplierId: 'sup_002',
      type: 'quality',
      title: '枪头泄漏问题',
      description: '使用中发现3盒枪头存在微量泄漏，不符合实验精度要求，已退回2盒',
      orderId: order.id,
      orderNo: order.orderNo,
      status: 'processing',
      level: 'medium',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  records.push({
    id: 'except_003',
    supplierId: 'sup_003',
    type: 'service',
    title: '售后服务响应慢',
    description: '手套质量问题反馈后3天才回复',
    status: 'pending',
    level: 'low',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  })

  saveExceptionRecordsToStorage(records)
  return records
}

export function mockGetSuppliers(
  page: number = 1,
  pageSize: number = 10,
  filters?: SupplierFilterParams
): Promise<PageResult<Supplier>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let suppliers = getSuppliersFromStorage()

      if (filters) {
        const {
          keyword,
          status,
          rating,
          mainCategory,
          paymentTerms,
          createTimeStart,
          createTimeEnd,
          updateTimeStart,
          updateTimeEnd,
        } = filters

        if (keyword) {
          const kw = keyword.toLowerCase()
          suppliers = suppliers.filter(
            (s) =>
              s.name.toLowerCase().includes(kw) ||
              s.shortName?.toLowerCase().includes(kw) ||
              s.contactPerson.toLowerCase().includes(kw) ||
              s.contactPhone.includes(kw) ||
              s.contactEmail?.toLowerCase().includes(kw) ||
              s.address.toLowerCase().includes(kw)
          )
        }

        if (status) {
          suppliers = suppliers.filter((s) => s.status === status)
        }

        if (rating) {
          suppliers = suppliers.filter((s) => s.rating === rating)
        }

        if (mainCategory) {
          suppliers = suppliers.filter((s) => s.mainCategories.includes(mainCategory))
        }

        if (paymentTerms) {
          suppliers = suppliers.filter((s) => s.paymentTerms === paymentTerms)
        }

        if (createTimeStart) {
          const start = new Date(createTimeStart).getTime()
          suppliers = suppliers.filter((s) => new Date(s.createdAt).getTime() >= start)
        }

        if (createTimeEnd) {
          const end = new Date(createTimeEnd).getTime() + 24 * 60 * 60 * 1000
          suppliers = suppliers.filter((s) => new Date(s.createdAt).getTime() < end)
        }

        if (updateTimeStart) {
          const start = new Date(updateTimeStart).getTime()
          suppliers = suppliers.filter((s) => new Date(s.updatedAt).getTime() >= start)
        }

        if (updateTimeEnd) {
          const end = new Date(updateTimeEnd).getTime() + 24 * 60 * 60 * 1000
          suppliers = suppliers.filter((s) => new Date(s.updatedAt).getTime() < end)
        }
      }

      suppliers.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      const start = (page - 1) * pageSize
      const list = suppliers.slice(start, start + pageSize)

      resolve({
        list,
        total: suppliers.length,
        page,
        pageSize,
      })
    }, 300)
  })
}

export function mockGetSupplier(id: string): Promise<Supplier | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const supplier = suppliers.find((s) => s.id === id) || null
      resolve(supplier)
    }, 200)
  })
}

export function mockGetSupplierPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getSupplierPurchaseOrders(supplierId)
      resolve(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    }, 200)
  })
}

export function mockGetSupplierDetail(id: string): Promise<SupplierDetail | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const supplier = suppliers.find((s) => s.id === id)

      if (!supplier) {
        resolve(null)
        return
      }

      const allQualifications = getQualificationsFromStorage()
      const qualifications = allQualifications.filter((q) => q.supplierId === id)

      const allExceptionRecords = getExceptionRecordsFromStorage()
      const exceptionRecords = allExceptionRecords
        .filter((e) => e.supplierId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const purchaseOrders = getSupplierPurchaseOrders(id)
      const deliveryRecords = generateDeliveryRecordsFromOrders(id, purchaseOrders)
      const priceHistory = generatePriceHistoryFromOrders(id, purchaseOrders)
      const stats = calculateSupplierStats(id, purchaseOrders)

      resolve({
        ...supplier,
        ...stats,
        qualifications,
        priceHistory,
        deliveryRecords,
        exceptionRecords,
        purchaseOrders: purchaseOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      })
    }, 300)
  })
}

export function mockCreateSupplier(data: SupplierFormData): Promise<Supplier> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const now = new Date().toISOString()
      const newSupplier: Supplier = {
        ...data,
        id: generateId(),
        totalOrders: 0,
        totalAmount: 0,
        onTimeDeliveryRate: 100,
        qualityPassRate: 100,
        createdAt: now,
        updatedAt: now,
      }
      suppliers.unshift(newSupplier)
      saveSuppliersToStorage(suppliers)

      addAuditLog({
        module: 'supplier',
        operationType: 'create',
        targetType: 'supplier',
        targetId: newSupplier.id,
        targetName: newSupplier.name,
        afterContent: `名称: ${newSupplier.name}, 联系人: ${newSupplier.contactPerson}, 电话: ${newSupplier.contactPhone}, 状态: ${newSupplier.status}, 评级: ${newSupplier.rating}`,
        remark: '新增供应商',
      })

      resolve(newSupplier)
    }, 300)
  })
}

export function mockUpdateSupplier(id: string, data: SupplierFormData): Promise<Supplier> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const index = suppliers.findIndex((s) => s.id === id)
      if (index === -1) {
        reject(new Error('供应商不存在'))
        return
      }

      const oldSupplier = suppliers[index]
      const beforeContent = `名称: ${oldSupplier.name}, 联系人: ${oldSupplier.contactPerson}, 电话: ${oldSupplier.contactPhone}, 状态: ${oldSupplier.status}, 评级: ${oldSupplier.rating}`

      suppliers[index] = {
        ...suppliers[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveSuppliersToStorage(suppliers)

      const newSupplier = suppliers[index]
      const afterContent = `名称: ${newSupplier.name}, 联系人: ${newSupplier.contactPerson}, 电话: ${newSupplier.contactPhone}, 状态: ${newSupplier.status}, 评级: ${newSupplier.rating}`

      addAuditLog({
        module: 'supplier',
        operationType: 'update',
        targetType: 'supplier',
        targetId: id,
        targetName: newSupplier.name,
        beforeContent,
        afterContent,
        remark: '编辑供应商',
      })

      resolve(suppliers[index])
    }, 300)
  })
}

export function mockDeleteSupplier(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const target = suppliers.find((s) => s.id === id)
      const filtered = suppliers.filter((s) => s.id !== id)
      saveSuppliersToStorage(filtered)

      const qualifications = getQualificationsFromStorage()
      const filteredQuals = qualifications.filter((q) => q.supplierId !== id)
      saveQualificationsToStorage(filteredQuals)

      if (target) {
        const beforeContent = `名称: ${target.name}, 联系人: ${target.contactPerson}, 电话: ${target.contactPhone}`
        addAuditLog({
          module: 'supplier',
          operationType: 'delete',
          targetType: 'supplier',
          targetId: id,
          targetName: target.name,
          beforeContent,
          remark: '删除供应商',
        })
      }

      resolve()
    }, 200)
  })
}

export function mockBatchDeleteSuppliers(ids: string[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      const targets = suppliers.filter((s) => ids.includes(s.id))
      const filtered = suppliers.filter((s) => !ids.includes(s.id))
      saveSuppliersToStorage(filtered)

      const qualifications = getQualificationsFromStorage()
      const filteredQuals = qualifications.filter((q) => !ids.includes(q.supplierId))
      saveQualificationsToStorage(filteredQuals)

      addAuditLog({
        module: 'supplier',
        operationType: 'batch_delete',
        targetType: 'supplier',
        targetId: ids.join(','),
        targetName: `批量删除${ids.length}个供应商`,
        remark: '批量删除供应商',
      })

      resolve()
    }, 300)
  })
}

export function mockAddQualification(
  supplierId: string,
  data: Omit<SupplierQualification, 'id' | 'supplierId' | 'createdAt'>
): Promise<SupplierQualification> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const qualifications = getQualificationsFromStorage()
      const newQual: SupplierQualification = {
        ...data,
        id: generateId(),
        supplierId,
        createdAt: new Date().toISOString(),
      }
      qualifications.unshift(newQual)
      saveQualificationsToStorage(qualifications)

      addAuditLog({
        module: 'supplier',
        operationType: 'create',
        targetType: 'qualification',
        targetId: newQual.id,
        targetName: newQual.name,
        afterContent: `资质名称: ${newQual.name}, 类型: ${newQual.type}, 有效期至: ${newQual.expireDate || '长期'}`,
        remark: '新增供应商资质',
      })

      resolve(newQual)
    }, 200)
  })
}

export function mockDeleteQualification(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const qualifications = getQualificationsFromStorage()
      const target = qualifications.find((q) => q.id === id)
      const filtered = qualifications.filter((q) => q.id !== id)
      saveQualificationsToStorage(filtered)

      if (target) {
        addAuditLog({
          module: 'supplier',
          operationType: 'delete',
          targetType: 'qualification',
          targetId: id,
          targetName: target.name,
          beforeContent: `资质名称: ${target.name}, 类型: ${target.type}`,
          remark: '删除供应商资质',
        })
      }

      resolve()
    }, 200)
  })
}

export function mockGetAllSuppliers(): Promise<Supplier[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const suppliers = getSuppliersFromStorage()
      resolve(suppliers)
    }, 200)
  })
}

export function mockGetSupplierPriceHistory(
  supplierId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PageResult<SupplierPriceHistory>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allHistory = getPriceHistoryFromStorage()
      const history = allHistory
        .filter((h) => h.supplierId === supplierId)
        .sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime())

      const start = (page - 1) * pageSize
      const list = history.slice(start, start + pageSize)

      resolve({
        list,
        total: history.length,
        page,
        pageSize,
      })
    }, 200)
  })
}
