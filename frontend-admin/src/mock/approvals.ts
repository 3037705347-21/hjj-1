import type { PageResult } from '@/types/common'
import type {
  ApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  ApprovalFilterParams,
  ApprovalSubmitFormData,
} from '@/types/approval'
import { generateId, formatDate } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User } from '@/types/user'
import { addAuditLog } from './audit'

const STORAGE_KEY = 'mock_approvals'

function getCurrentUser(): User | null {
  return storage.getUser<User>()
}

function getApprovalsFromStorage(): ApprovalRecord[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }
  return initMockApprovals()
}

function saveApprovalsToStorage(approvals: ApprovalRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals))
}

function initMockApprovals(): ApprovalRecord[] {
  const now = new Date()
  const approvals: ApprovalRecord[] = []

  const mockData: Array<Omit<ApprovalRecord, 'id' | 'createdAt' | 'updatedAt' | 'submitTime'>> = [
    {
      type: 'reagent_create',
      title: '新增试剂申请 - 胰蛋白酶',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      status: 'pending',
      targetType: 'reagent',
      targetId: 'req_new_1',
      targetName: '胰蛋白酶 100mg',
      beforeContent: '',
      afterContent: '分类:酶, 规格:100mg, 品牌:Sigma, 存储条件:-20°C',
      remark: '实验需要，请审批',
    },
    {
      type: 'batch_outbound',
      title: '批次出库申请 - PBS缓冲液',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      status: 'approved',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      targetType: 'batch',
      targetId: 'batch_001',
      targetName: 'B202601001 - PBS缓冲液',
      beforeContent: '库存: 50瓶/500ml',
      afterContent: '库存: 40瓶/500ml',
      remark: '细胞培养实验使用10瓶',
      approveTime: formatDate(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
    },
    {
      type: 'consumable_adjust',
      title: '耗材库存调整 - 枪头',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      status: 'rejected',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      rejectReason: '请提供详细的盘点报告，说明差异原因',
      targetType: 'consumable',
      targetId: 'con_001',
      targetName: '200ul 枪头',
      beforeContent: '库存: 80盒',
      afterContent: '库存: 75盒',
      remark: '盘点发现少了5盒，调整库存',
      approveTime: formatDate(new Date(now.getTime() - 5 * 60 * 60 * 1000)),
    },
    {
      type: 'system_config',
      title: '修改系统配置 - 预警天数',
      applicantId: 'user_manager_1',
      applicantName: '张主任',
      applicantRole: 'lab_manager',
      status: 'approved',
      approverId: 'user_admin_1',
      approverName: '系统管理员',
      targetType: 'system_config',
      targetId: 'alert_before_days',
      targetName: '效期预警提前天数',
      beforeContent: '30天',
      afterContent: '45天',
      remark: '根据实验室管理要求调整预警期',
      approveTime: formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    },
  ]

  mockData.forEach((item, index) => {
    const submitTime = new Date(now.getTime() - (index + 1) * 3 * 60 * 60 * 1000)
    approvals.push({
      ...item,
      id: generateId(),
      submitTime: formatDate(submitTime),
      createdAt: formatDate(submitTime),
      updatedAt: item.approveTime || formatDate(submitTime),
    })
  })

  saveApprovalsToStorage(approvals)
  return approvals
}

export async function mockGetApprovals(
  page: number,
  pageSize: number,
  filters?: ApprovalFilterParams
): Promise<PageResult<ApprovalRecord>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = getApprovalsFromStorage()

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(kw) ||
              r.targetName.toLowerCase().includes(kw) ||
              r.applicantName.toLowerCase().includes(kw)
          )
        }
        if (filters.type) {
          records = records.filter((r) => r.type === filters.type)
        }
        if (filters.status) {
          records = records.filter((r) => r.status === filters.status)
        }
        if (filters.applicantName) {
          records = records.filter((r) =>
            r.applicantName.includes(filters.applicantName!)
          )
        }
        if (filters.startTime) {
          records = records.filter((r) => r.submitTime >= filters.startTime!)
        }
        if (filters.endTime) {
          records = records.filter((r) => r.submitTime <= filters.endTime! + ' 23:59:59')
        }
      }

      records = [...records].sort((a, b) => b.submitTime.localeCompare(a.submitTime))

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

export async function mockGetApproval(id: string): Promise<ApprovalRecord | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getApprovalsFromStorage()
      const found = records.find((r) => r.id === id)
      resolve(found || null)
    }, 100)
  })
}

export async function mockSubmitApproval(data: ApprovalSubmitFormData): Promise<ApprovalRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getApprovalsFromStorage()
      const now = formatDate(new Date())
      const newApproval: ApprovalRecord = {
        id: generateId(),
        type: data.type,
        title: data.title,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantRole: currentUser.role,
        status: 'pending',
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        beforeContent: data.beforeContent,
        afterContent: data.afterContent,
        remark: data.remark,
        submitTime: now,
        createdAt: now,
        updatedAt: now,
      }
      records.unshift(newApproval)
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_submit',
        targetType: 'approval',
        targetId: newApproval.id,
        targetName: newApproval.title,
        beforeContent: data.beforeContent,
        afterContent: data.afterContent,
        remark: data.remark || '提交审批申请',
      })

      resolve(newApproval)
    }, 200)
  })
}

export async function mockApproveApproval(
  id: string,
  remark?: string
): Promise<ApprovalRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getApprovalsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('审批记录不存在'))
        return
      }

      const now = formatDate(new Date())
      const updated = {
        ...records[index],
        status: 'approved' as ApprovalStatus,
        approverId: currentUser.id,
        approverName: currentUser.name,
        approveTime: now,
        updatedAt: now,
      }
      records[index] = updated
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_approve',
        targetType: 'approval',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: 待审批`,
        afterContent: `状态: 已通过`,
        remark: remark || '审批通过',
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockRejectApproval(
  id: string,
  reason: string
): Promise<ApprovalRecord> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        reject(new Error('用户未登录'))
        return
      }

      const records = getApprovalsFromStorage()
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) {
        reject(new Error('审批记录不存在'))
        return
      }

      const now = formatDate(new Date())
      const updated = {
        ...records[index],
        status: 'rejected' as ApprovalStatus,
        rejectReason: reason,
        approverId: currentUser.id,
        approverName: currentUser.name,
        approveTime: now,
        updatedAt: now,
      }
      records[index] = updated
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_reject',
        targetType: 'approval',
        targetId: updated.id,
        targetName: updated.title,
        beforeContent: `状态: 待审批`,
        afterContent: `状态: 已驳回`,
        remark: `驳回原因: ${reason}`,
      })

      resolve(updated)
    }, 200)
  })
}

export async function mockGetApprovalStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  myPending: number
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getApprovalsFromStorage()
      const currentUser = getCurrentUser()
      resolve({
        total: records.length,
        pending: records.filter((r) => r.status === 'pending').length,
        approved: records.filter((r) => r.status === 'approved').length,
        rejected: records.filter((r) => r.status === 'rejected').length,
        myPending: records.filter(
          (r) => r.status === 'pending' && r.applicantId === currentUser?.id
        ).length,
      })
    }, 100)
  })
}
