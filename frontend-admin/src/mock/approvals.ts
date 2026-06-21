import type { PageResult } from '@/types/common'
import type {
  ApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  ApprovalFilterParams,
  ApprovalSubmitFormData,
  ApprovalNode,
  ApprovalHistoryRecord,
  CcRecord,
  ApproveActionData,
  RejectActionData,
  TransferActionData,
  CcActionData,
  ApprovalStats,
  ApprovalUserOption,
  ApprovalActionType,
  ApprovalNodeStatus,
} from '@/types/approval'
import { generateId, formatDate } from '@/utils/date'
import { storage } from '@/utils/storage'
import type { User, UserRole } from '@/types/user'
import { addAuditLog } from './audit'
import { roleLabels } from '@/types/user'

const STORAGE_KEY = 'mock_approvals'

const mockUsers: ApprovalUserOption[] = [
  { id: 'user_lab_1', name: '李研究员', role: 'lab_staff', department: '分子生物学实验室' },
  { id: 'user_lab_2', name: '王技术员', role: 'lab_staff', department: '细胞培养实验室' },
  { id: 'user_lab_3', name: '赵实验员', role: 'lab_staff', department: '化学分析实验室' },
  { id: 'user_manager_1', name: '张主任', role: 'lab_manager', department: '实验室管理' },
  { id: 'user_manager_2', name: '刘副主任', role: 'lab_manager', department: '实验室管理' },
  { id: 'user_safety_1', name: '陈安全员', role: 'safety_officer', department: '安全管理' },
  { id: 'user_purchase_1', name: '孙采购', role: 'purchase_officer', department: '采购部' },
  { id: 'user_admin_1', name: '系统管理员', role: 'admin', department: '信息中心' },
  { id: 'user_finance_1', name: '周财务', role: 'finance_officer', department: '财务部' },
]

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

function generateFlowNodes(type: ApprovalType): ApprovalNode[] {
  const nodes: ApprovalNode[] = []

  switch (type) {
    case 'purchase_request':
      nodes.push(
        { id: 'node_1', name: '课题组负责人审批', order: 1, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
        { id: 'node_2', name: '采购部审核', order: 2, approverId: 'user_purchase_1', approverName: '孙采购', approverRole: 'purchase_officer', status: 'pending' },
        { id: 'node_3', name: '财务审批', order: 3, approverId: 'user_finance_1', approverName: '周财务', approverRole: 'finance_officer', status: 'pending' },
        { id: 'node_4', name: '实验室主任审批', order: 4, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
      break
    case 'requisition_hazardous':
      nodes.push(
        { id: 'node_1', name: '课题组负责人审批', order: 1, approverId: 'user_manager_2', approverName: '刘副主任', approverRole: 'lab_manager', status: 'pending' },
        { id: 'node_2', name: '安全员审核', order: 2, approverId: 'user_safety_1', approverName: '陈安全员', approverRole: 'safety_officer', status: 'pending' },
        { id: 'node_3', name: '实验室主任审批', order: 3, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
      break
    case 'requisition_overlimit':
      nodes.push(
        { id: 'node_1', name: '课题组负责人审批', order: 1, approverId: 'user_manager_2', approverName: '刘副主任', approverRole: 'lab_manager', status: 'pending' },
        { id: 'node_2', name: '实验室主任审批', order: 2, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
      break
    case 'scrap_apply':
      nodes.push(
        { id: 'node_1', name: '课题组负责人审批', order: 1, approverId: 'user_manager_2', approverName: '刘副主任', approverRole: 'lab_manager', status: 'pending' },
        { id: 'node_2', name: '安全员审核', order: 2, approverId: 'user_safety_1', approverName: '陈安全员', approverRole: 'safety_officer', status: 'pending' },
        { id: 'node_3', name: '实验室主任审批', order: 3, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
      break
    case 'inventory_adjust':
      nodes.push(
        { id: 'node_1', name: '仓库管理员确认', order: 1, approverId: 'user_lab_2', approverName: '王技术员', approverRole: 'lab_staff', status: 'pending' },
        { id: 'node_2', name: '实验室主任审批', order: 2, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
      break
    default:
      nodes.push(
        { id: 'node_1', name: '课题组负责人审批', order: 1, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
        { id: 'node_2', name: '实验室主任审批', order: 2, approverId: 'user_manager_1', approverName: '张主任', approverRole: 'lab_manager', status: 'pending' },
      )
  }

  return nodes
}

function initMockApprovals(): ApprovalRecord[] {
  const now = new Date()
  const approvals: ApprovalRecord[] = []

  const createHistory = (actions: Array<{ nodeName: string; actionType: ApprovalActionType; operatorId: string; operatorName: string; hoursAgo: number; comment?: string; toUserId?: string; toUserName?: string }>): ApprovalHistoryRecord[] => {
    return actions.map(a => ({
      id: generateId(),
      nodeName: a.nodeName,
      actionType: a.actionType,
      operatorId: a.operatorId,
      operatorName: a.operatorName,
      actionTime: formatDate(new Date(now.getTime() - a.hoursAgo * 60 * 60 * 1000)),
      comment: a.comment,
      toUserId: a.toUserId,
      toUserName: a.toUserName,
    }))
  }

  const createCcList = (items: Array<{ userId: string; userName: string; hoursAgo: number; isRead?: boolean }>): CcRecord[] => {
    return items.map(i => ({
      id: generateId(),
      userId: i.userId,
      userName: i.userName,
      isRead: i.isRead ?? false,
      ccTime: formatDate(new Date(now.getTime() - i.hoursAgo * 60 * 60 * 1000)),
    }))
  }

  const mockData: Array<Partial<ApprovalRecord> & { type: ApprovalType; title: string; applicantId: string; applicantName: string; applicantRole: UserRole; applicantDepartment: string; status: ApprovalStatus; targetType: string; targetId: string; targetName: string; targetSummary?: string; hoursAgo: number; nodeProgress?: number }> = [
    {
      type: 'purchase_request',
      title: '采购申请 - PCR试剂一批',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      applicantDepartment: '分子生物学实验室',
      status: 'approving',
      targetType: 'purchase',
      targetId: 'pur_001',
      targetName: 'PCR扩增试剂盒、Taq酶、dNTP等',
      targetSummary: '共计 15 项，预估金额 ¥12,580',
      hoursAgo: 4,
      nodeProgress: 2,
    },
    {
      type: 'requisition_hazardous',
      title: '危险试剂领用 - 氯仿',
      applicantId: 'user_lab_3',
      applicantName: '赵实验员',
      applicantRole: 'lab_staff',
      applicantDepartment: '化学分析实验室',
      status: 'pending',
      targetType: 'requisition',
      targetId: 'req_001',
      targetName: '氯仿 500ml x 2瓶',
      targetSummary: '危险化学品，需双人双锁管理',
      hoursAgo: 2,
      nodeProgress: 1,
    },
    {
      type: 'requisition_overlimit',
      title: '超量领用申请 - 无水乙醇',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      applicantDepartment: '细胞培养实验室',
      status: 'approving',
      targetType: 'requisition',
      targetId: 'req_002',
      targetName: '无水乙醇 500ml x 20瓶',
      targetSummary: '超出月度限额50%，用于大规模细胞培养',
      hoursAgo: 8,
      nodeProgress: 1,
    },
    {
      type: 'scrap_apply',
      title: '报废申请 - 过期培养基',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      applicantDepartment: '细胞培养实验室',
      status: 'approved',
      targetType: 'scrap',
      targetId: 'scp_001',
      targetName: 'DMEM培养基 500ml x 8瓶',
      targetSummary: '已过有效期，按规定销毁处理',
      hoursAgo: 48,
      nodeProgress: 3,
    },
    {
      type: 'inventory_adjust',
      title: '库存调整 - 枪头盘点差异',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      applicantDepartment: '分子生物学实验室',
      status: 'pending',
      targetType: 'inventory',
      targetId: 'inv_001',
      targetName: '200ul 枪头',
      targetSummary: '系统记录80盒，实际盘点75盒，差异-5盒',
      beforeContent: '库存: 80盒',
      afterContent: '库存: 75盒',
      remark: '月度盘点发现差异，调整系统库存',
      hoursAgo: 6,
      nodeProgress: 1,
    },
    {
      type: 'requisition_apply',
      title: '普通领用申请 - PBS缓冲液',
      applicantId: 'user_lab_3',
      applicantName: '赵实验员',
      applicantRole: 'lab_staff',
      applicantDepartment: '化学分析实验室',
      status: 'completed',
      targetType: 'requisition',
      targetId: 'req_003',
      targetName: 'PBS缓冲液 500ml x 5瓶',
      targetSummary: '常规实验使用',
      hoursAgo: 72,
      nodeProgress: 2,
    },
    {
      type: 'purchase_request',
      title: '采购申请 - 离心管耗材',
      applicantId: 'user_lab_3',
      applicantName: '赵实验员',
      applicantRole: 'lab_staff',
      applicantDepartment: '化学分析实验室',
      status: 'rejected',
      targetType: 'purchase',
      targetId: 'pur_002',
      targetName: '1.5ml离心管 5000支/包 x 5包',
      targetSummary: '报价偏高，建议重新询价比价',
      rejectReason: '请提供至少3家供应商的报价单进行比价后重新提交',
      hoursAgo: 36,
      nodeProgress: 2,
    },
    {
      type: 'consumable_adjust',
      title: '耗材库存调整 - 培养皿',
      applicantId: 'user_lab_2',
      applicantName: '王技术员',
      applicantRole: 'lab_staff',
      applicantDepartment: '细胞培养实验室',
      status: 'approved',
      targetType: 'consumable',
      targetId: 'con_001',
      targetName: '10cm细胞培养皿',
      targetSummary: '破损报损调整',
      beforeContent: '库存: 200个',
      afterContent: '库存: 185个',
      hoursAgo: 24,
      nodeProgress: 2,
    },
    {
      type: 'requisition_hazardous',
      title: '危险试剂领用 - 甲醇',
      applicantId: 'user_lab_1',
      applicantName: '李研究员',
      applicantRole: 'lab_staff',
      applicantDepartment: '分子生物学实验室',
      status: 'approved',
      targetType: 'requisition',
      targetId: 'req_004',
      targetName: '色谱纯甲醇 500ml x 1瓶',
      targetSummary: 'HPLC检测使用',
      hoursAgo: 96,
      nodeProgress: 3,
    },
    {
      type: 'reagent_create',
      title: '试剂新增 - 重组人胰岛素',
      applicantId: 'user_lab_3',
      applicantName: '赵实验员',
      applicantRole: 'lab_staff',
      applicantDepartment: '化学分析实验室',
      status: 'approved',
      targetType: 'reagent',
      targetId: 'rgt_new_1',
      targetName: '重组人胰岛素 100mg',
      targetSummary: '新增试剂档案',
      hoursAgo: 120,
      nodeProgress: 2,
    },
  ]

  mockData.forEach((item, index) => {
    const submitTime = new Date(now.getTime() - item.hoursAgo * 60 * 60 * 1000)
    const nodes = generateFlowNodes(item.type)
    const history: ApprovalHistoryRecord[] = []
    const ccList: CcRecord[] = []

    history.push({
      id: generateId(),
      nodeName: '发起申请',
      actionType: 'submit',
      operatorId: item.applicantId,
      operatorName: item.applicantName,
      actionTime: formatDate(submitTime),
      comment: '提交审批申请',
    })

    if (item.status === 'approved' || item.status === 'completed' || item.status === 'rejected') {
      nodes.forEach((node, idx) => {
        if (idx < (item.nodeProgress ?? nodes.length)) {
          const isLastApproved = idx === (item.nodeProgress ?? nodes.length) - 1
          if (item.status === 'rejected' && isLastApproved) {
            node.status = 'rejected'
            node.comment = item.rejectReason
          } else {
            node.status = 'approved'
            node.comment = idx === 0 ? '同意，情况属实' : idx === 1 ? '审核通过' : '同意'
          }
          node.actionTime = formatDate(new Date(submitTime.getTime() + (idx + 1) * 2 * 60 * 60 * 1000))

          history.push({
            id: generateId(),
            nodeName: node.name,
            actionType: item.status === 'rejected' && isLastApproved ? 'reject' : 'approve',
            operatorId: node.approverId,
            operatorName: node.approverName,
            actionTime: node.actionTime,
            comment: node.comment,
          })
        }
      })
    } else if (item.status === 'approving' || item.status === 'pending') {
      const progress = (item.nodeProgress ?? 1) - 1
      nodes.forEach((node, idx) => {
        if (idx < progress) {
          node.status = 'approved'
          node.comment = idx === 0 ? '同意，情况属实' : '审核通过'
          node.actionTime = formatDate(new Date(submitTime.getTime() + (idx + 1) * 2 * 60 * 60 * 1000))
          history.push({
            id: generateId(),
            nodeName: node.name,
            actionType: 'approve',
            operatorId: node.approverId,
            operatorName: node.approverName,
            actionTime: node.actionTime,
            comment: node.comment,
          })
        } else if (idx === progress) {
          node.status = 'current'
        }
      })
    }

    if (index % 3 === 0) {
      ccList.push(...createCcList([
        { userId: 'user_admin_1', userName: '系统管理员', hoursAgo: item.hoursAgo - 0.5, isRead: true },
      ]))
    }
    if (index % 4 === 0) {
      ccList.push(...createCcList([
        { userId: 'user_safety_1', userName: '陈安全员', hoursAgo: item.hoursAgo - 0.3, isRead: false },
      ]))
    }

    const currentNode = nodes.find(n => n.status === 'current')

    approvals.push({
      id: generateId(),
      type: item.type,
      title: item.title,
      applicantId: item.applicantId,
      applicantName: item.applicantName,
      applicantRole: item.applicantRole,
      applicantDepartment: item.applicantDepartment,
      status: item.status,
      rejectReason: item.rejectReason,
      currentNodeId: currentNode?.id,
      currentNodeName: currentNode?.name,
      currentApproverId: currentNode?.approverId,
      currentApproverName: currentNode?.approverName,
      nodes,
      history,
      ccList,
      targetType: item.targetType,
      targetId: item.targetId,
      targetName: item.targetName,
      targetSummary: item.targetSummary,
      beforeContent: item.beforeContent,
      afterContent: item.afterContent,
      remark: item.remark,
      submitTime: formatDate(submitTime),
      approveTime: (item.status === 'approved' || item.status === 'completed') ? formatDate(new Date(submitTime.getTime() + (item.nodeProgress ?? nodes.length) * 2 * 60 * 60 * 1000)) : undefined,
      completeTime: item.status === 'completed' ? formatDate(new Date(submitTime.getTime() + (item.nodeProgress ?? nodes.length) * 2.5 * 60 * 60 * 1000)) : undefined,
      createdAt: formatDate(submitTime),
      updatedAt: formatDate(new Date()),
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
      const currentUser = getCurrentUser()

      if (filters?.view) {
        switch (filters.view) {
          case 'pending':
            records = records.filter(r =>
              (r.status === 'pending' || r.status === 'approving') &&
              r.nodes.some(n => n.status === 'current' && n.approverId === currentUser?.id)
            )
            break
          case 'initiated':
            records = records.filter(r => r.applicantId === currentUser?.id)
            break
          case 'processed':
            records = records.filter(r =>
              r.history.some(h => h.operatorId === currentUser?.id && h.actionType !== 'submit')
            )
            break
        }
      }

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
          records = records.filter((r) => (r.submitTime || '') >= filters.startTime!)
        }
        if (filters.endTime) {
          records = records.filter((r) => (r.submitTime || '') <= filters.endTime! + ' 23:59:59')
        }
      }

      records = [...records].sort((a, b) => (b.submitTime || '').localeCompare(a.submitTime || ''))

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
      const nodes = generateFlowNodes(data.type)
      if (nodes.length > 0) {
        nodes[0].status = 'current'
      }

      const ccList: CcRecord[] = (data.ccUserIds || []).map(uid => {
        const user = mockUsers.find(u => u.id === uid)
        return {
          id: generateId(),
          userId: uid,
          userName: user?.name || uid,
          isRead: false,
          ccTime: now,
        }
      })

      const newApproval: ApprovalRecord = {
        id: generateId(),
        type: data.type,
        title: data.title,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantRole: currentUser.role,
        status: nodes.length > 1 ? 'approving' : 'pending',
        currentNodeId: nodes[0]?.id,
        currentNodeName: nodes[0]?.name,
        currentApproverId: nodes[0]?.approverId,
        currentApproverName: nodes[0]?.approverName,
        nodes,
        history: [
          {
            id: generateId(),
            nodeName: '发起申请',
            actionType: 'submit',
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            actionTime: now,
            comment: data.remark || '提交审批申请',
          },
        ],
        ccList,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        targetSummary: data.targetSummary,
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
  data?: ApproveActionData
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
      const record = { ...records[index] }
      const currentNodeIndex = record.nodes.findIndex(n => n.status === 'current')

      if (currentNodeIndex >= 0) {
        record.nodes[currentNodeIndex] = {
          ...record.nodes[currentNodeIndex],
          status: 'approved',
          actionTime: now,
          comment: data?.comment || '同意',
        }

        record.history.push({
          id: generateId(),
          nodeName: record.nodes[currentNodeIndex].name,
          actionType: 'approve',
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          actionTime: now,
          comment: data?.comment || '同意',
        })

        if (data?.ccUserIds && data.ccUserIds.length > 0) {
          data.ccUserIds.forEach(uid => {
            const user = mockUsers.find(u => u.id === uid)
            record.ccList.push({
              id: generateId(),
              userId: uid,
              userName: user?.name || uid,
              isRead: false,
              ccTime: now,
            })
          })
        }

        const nextNodeIndex = currentNodeIndex + 1
        if (nextNodeIndex < record.nodes.length) {
          record.nodes[nextNodeIndex].status = 'current'
          record.currentNodeId = record.nodes[nextNodeIndex].id
          record.currentNodeName = record.nodes[nextNodeIndex].name
          record.currentApproverId = record.nodes[nextNodeIndex].approverId
          record.currentApproverName = record.nodes[nextNodeIndex].approverName
          record.status = 'approving'
        } else {
          record.currentNodeId = undefined
          record.currentNodeName = undefined
          record.currentApproverId = undefined
          record.currentApproverName = undefined
          record.status = 'approved'
          record.approveTime = now
        }
      }

      record.updatedAt = now
      records[index] = record
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_approve',
        targetType: 'approval',
        targetId: record.id,
        targetName: record.title,
        remark: data?.comment || '审批通过',
      })

      resolve(record)
    }, 200)
  })
}

export async function mockRejectApproval(
  id: string,
  data: RejectActionData
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
      const record = { ...records[index] }
      const currentNodeIndex = record.nodes.findIndex(n => n.status === 'current')

      if (currentNodeIndex >= 0) {
        record.nodes[currentNodeIndex] = {
          ...record.nodes[currentNodeIndex],
          status: 'rejected',
          actionTime: now,
          comment: data.reason,
        }

        record.history.push({
          id: generateId(),
          nodeName: record.nodes[currentNodeIndex].name,
          actionType: 'reject',
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          actionTime: now,
          comment: data.reason,
        })
      }

      record.status = 'rejected'
      record.rejectReason = data.reason
      record.currentNodeId = undefined
      record.currentNodeName = undefined
      record.currentApproverId = undefined
      record.currentApproverName = undefined
      record.updatedAt = now

      records[index] = record
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_reject',
        targetType: 'approval',
        targetId: record.id,
        targetName: record.title,
        remark: `驳回原因: ${data.reason}`,
      })

      resolve(record)
    }, 200)
  })
}

export async function mockTransferApproval(
  id: string,
  data: TransferActionData
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
      const record = { ...records[index] }
      const currentNodeIndex = record.nodes.findIndex(n => n.status === 'current')

      if (currentNodeIndex >= 0) {
        const originalNode = record.nodes[currentNodeIndex]
        record.nodes[currentNodeIndex] = {
          ...originalNode,
          status: 'current',
          approverId: data.toUserId,
          approverName: data.toUserName,
          originalApproverId: originalNode.approverId,
          originalApproverName: originalNode.approverName,
          transferredAt: now,
          actionTime: now,
          comment: data.comment,
        }

        record.history.push({
          id: generateId(),
          nodeName: originalNode.name,
          actionType: 'transfer',
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          actionTime: now,
          comment: data.comment,
          toUserId: data.toUserId,
          toUserName: data.toUserName,
        })

        record.currentApproverId = data.toUserId
        record.currentApproverName = data.toUserName
      }

      record.updatedAt = now
      records[index] = record
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_transfer',
        targetType: 'approval',
        targetId: record.id,
        targetName: record.title,
        remark: `转交给 ${data.toUserName}，原因: ${data.comment || '无'}`,
      })

      resolve(record)
    }, 200)
  })
}

export async function mockAddCcApproval(
  id: string,
  data: CcActionData
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
      const record = { ...records[index] }

      data.userIds.forEach(uid => {
        if (!record.ccList.some(c => c.userId === uid)) {
          const user = mockUsers.find(u => u.id === uid)
          record.ccList.push({
            id: generateId(),
            userId: uid,
            userName: user?.name || uid,
            isRead: false,
            ccTime: now,
          })
        }
      })

      record.history.push({
        id: generateId(),
        nodeName: record.currentNodeName || '审批流程',
        actionType: 'cc',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        actionTime: now,
        comment: data.comment,
      })

      record.updatedAt = now
      records[index] = record
      saveApprovalsToStorage(records)

      addAuditLog({
        module: 'approval',
        operationType: 'approval_cc',
        targetType: 'approval',
        targetId: record.id,
        targetName: record.title,
        remark: data.comment || '添加抄送',
      })

      resolve(record)
    }, 200)
  })
}

export async function mockWithdrawApproval(id: string, reason?: string): Promise<ApprovalRecord> {
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
      const record = { ...records[index] }

      if (record.applicantId !== currentUser.id) {
        reject(new Error('只能撤回自己发起的申请'))
        return
      }

      record.nodes.forEach(n => {
        if (n.status === 'current') n.status = 'pending'
      })

      record.history.push({
        id: generateId(),
        nodeName: '发起申请',
        actionType: 'withdraw',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        actionTime: now,
        comment: reason || '撤回申请',
      })

      record.status = 'withdrawn'
      record.currentNodeId = undefined
      record.currentNodeName = undefined
      record.currentApproverId = undefined
      record.currentApproverName = undefined
      record.updatedAt = now

      records[index] = record
      saveApprovalsToStorage(records)

      resolve(record)
    }, 200)
  })
}

export async function mockGetApprovalStats(): Promise<ApprovalStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = getApprovalsFromStorage()
      const currentUser = getCurrentUser()
      resolve({
        pendingCount: records.filter(r =>
          (r.status === 'pending' || r.status === 'approving') &&
          r.nodes.some(n => n.status === 'current' && n.approverId === currentUser?.id)
        ).length,
        initiatedCount: records.filter(r => r.applicantId === currentUser?.id).length,
        processedCount: records.filter(r =>
          r.history.some(h => h.operatorId === currentUser?.id && h.actionType !== 'submit')
        ).length,
        approvedCount: records.filter(r => r.status === 'approved' || r.status === 'completed').length,
        rejectedCount: records.filter(r => r.status === 'rejected').length,
        ccCount: records.reduce((acc, r) => acc + r.ccList.filter(c => c.userId === currentUser?.id && !c.isRead).length, 0),
      })
    }, 100)
  })
}

export async function mockGetApprovalUsers(): Promise<ApprovalUserOption[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers)
    }, 100)
  })
}
