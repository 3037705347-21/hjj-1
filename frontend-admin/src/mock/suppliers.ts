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
import type { PageResult } from '@/types/common'
import { generateId } from '@/utils/date'
import { addAuditLog } from './audit'
import type { User } from '@/types/user'
import { storage } from '@/utils/storage'

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
  return []
}

function saveExceptionRecordsToStorage(records: SupplierExceptionRecord[]): void {
  localStorage.setItem(EXCEPTION_RECORDS_STORAGE_KEY, JSON.stringify(records))
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
  initMockPriceHistory()
  initMockDeliveryRecords()
  initMockExceptionRecords()

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
  const history: SupplierPriceHistory[] = []
  const today = new Date()

  const priceData = [
    { supplierId: 'sup_001', itemName: 'PBS缓冲液', specification: '500mL/瓶', unit: '瓶', basePrice: 45 },
    { supplierId: 'sup_001', itemName: 'Trizol试剂', specification: '100mL/瓶', unit: '瓶', basePrice: 380 },
    { supplierId: 'sup_001', itemName: 'PCR 8联管', specification: '125条/包', unit: '包', basePrice: 85 },
    { supplierId: 'sup_002', itemName: '移液枪 1000μL', specification: '单道', unit: '把', basePrice: 1200 },
    { supplierId: 'sup_003', itemName: '一次性手套 M号', specification: '100只/盒', unit: '盒', basePrice: 28 },
  ]

  priceData.forEach((item, idx) => {
    for (let i = 11; i >= 0; i--) {
      const quoteDate = new Date(today)
      quoteDate.setMonth(quoteDate.getMonth() - i)
      const priceVariation = (Math.random() - 0.5) * 0.15 * item.basePrice
      const unitPrice = parseFloat((item.basePrice + priceVariation).toFixed(2))

      history.push({
        id: `price_${idx}_${i}`,
        supplierId: item.supplierId,
        itemType: idx < 3 ? 'reagent' : 'consumable',
        itemId: `item_${idx}_${i}`,
        itemName: item.itemName,
        specification: item.specification,
        unit: item.unit,
        unitPrice,
        quoteDate: quoteDate.toISOString().split('T')[0],
        validFrom: quoteDate.toISOString().split('T')[0],
        remark: i === 0 ? '当前报价' : `第${12 - i}次报价`,
      })
    }
  })

  savePriceHistoryToStorage(history)
  return history
}

function initMockDeliveryRecords(): SupplierDeliveryRecord[] {
  const records: SupplierDeliveryRecord[] = []
  const today = new Date()

  for (let i = 0; i < 20; i++) {
    const supplierIdx = i % 3
    const supplierIds = ['sup_001', 'sup_002', 'sup_003']
    const supplierId = supplierIds[supplierIdx]

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i * 7 - Math.floor(Math.random() * 3))

    const actualDate = new Date(expectedDate)
    const delayDays = Math.floor(Math.random() * 5) - 1
    actualDate.setDate(actualDate.getDate() + Math.max(0, delayDays))

    records.push({
      id: `delivery_${i + 1}`,
      supplierId,
      orderId: `order_${i + 1}`,
      orderNo: `PO${String(2024001 + i).padStart(8, '0')}`,
      expectedDate: expectedDate.toISOString().split('T')[0],
      actualDate: actualDate.toISOString().split('T')[0],
      isOnTime: delayDays <= 0,
      delayDays: delayDays > 0 ? delayDays : 0,
      items: [
        {
          itemId: `item_${i}_1`,
          itemName: `产品${i + 1}-A`,
          quantity: 10 + Math.floor(Math.random() * 40),
          receivedQuantity: 10 + Math.floor(Math.random() * 40),
        },
        {
          itemId: `item_${i}_2`,
          itemName: `产品${i + 1}-B`,
          quantity: 5 + Math.floor(Math.random() * 20),
          receivedQuantity: 5 + Math.floor(Math.random() * 20),
        },
      ],
      remark: delayDays > 2 ? '物流延误' : '',
    })
  }

  saveDeliveryRecordsToStorage(records)
  return records
}

function initMockExceptionRecords(): SupplierExceptionRecord[] {
  const now = new Date().toISOString()
  const user = getCurrentUser()
  const defaultHandler = user?.id || '2'
  const defaultHandlerName = user?.name || '李主任'

  const records: SupplierExceptionRecord[] = [
    {
      id: 'except_001',
      supplierId: 'sup_001',
      type: 'quality',
      title: '试剂纯度不达标',
      description: '收到的Trizol试剂纯度检测不合格，A260/A280比值偏低',
      orderId: 'order_5',
      orderNo: 'PO2024006',
      status: 'resolved',
      level: 'high',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: '已更换批次并退款处理',
    },
    {
      id: 'except_002',
      supplierId: 'sup_002',
      type: 'delivery',
      title: '延期交货',
      description: '移液枪订单延期5天交付，影响实验进度',
      orderId: 'order_8',
      orderNo: 'PO2024009',
      status: 'processing',
      level: 'medium',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: '',
    },
    {
      id: 'except_003',
      supplierId: 'sup_003',
      type: 'service',
      title: '售后服务响应慢',
      description: '手套质量问题反馈后3天才回复',
      status: 'pending',
      level: 'low',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'except_004',
      supplierId: 'sup_001',
      type: 'price',
      title: '价格突然上涨',
      description: 'PBS缓冲液价格上涨20%，未提前通知',
      orderId: 'order_3',
      orderNo: 'PO2024004',
      status: 'resolved',
      level: 'medium',
      handler: defaultHandler,
      handlerName: defaultHandlerName,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: '已协商恢复原价，提供补偿折扣',
    },
  ]

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

      const allPriceHistory = getPriceHistoryFromStorage()
      const priceHistory = allPriceHistory
        .filter((p) => p.supplierId === id)
        .sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime())

      const allDeliveryRecords = getDeliveryRecordsFromStorage()
      const deliveryRecords = allDeliveryRecords
        .filter((d) => d.supplierId === id)
        .sort((a, b) => new Date(b.actualDate).getTime() - new Date(a.actualDate).getTime())

      const allExceptionRecords = getExceptionRecordsFromStorage()
      const exceptionRecords = allExceptionRecords
        .filter((e) => e.supplierId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      resolve({
        ...supplier,
        qualifications,
        priceHistory,
        deliveryRecords,
        exceptionRecords,
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
