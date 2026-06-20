<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Package,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  ArrowDownToLine,
  Undo2,
  Play,
  CheckSquare,
  Edit3,
  Trash2,
  Send,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-vue-next'
import type {
  PurchaseRequest,
  PurchaseOrder,
  PurchaseRequestStatus,
  PurchaseOrderStatus,
} from '@/types/purchase'
import {
  purchaseRequestStatusLabels,
  purchaseRequestStatusColors,
  purchaseOrderStatusLabels,
  purchaseOrderStatusColors,
} from '@/types/purchase'
import {
  mockGetPurchaseRequest,
  mockGetPurchaseOrder,
  mockGetPurchaseOrderByRequestId,
  mockSubmitPurchaseRequest,
  mockApprovePurchaseRequest,
  mockRejectPurchaseRequest,
  mockStartPurchase,
  mockCompletePurchaseOrder,
  mockDeletePurchaseRequest,
  mockCreatePurchaseOrder,
} from '@/mock/purchases'
import { getUserStore } from '@/stores/user'
import { usePermission } from '@/composables/usePermission'
import PurchaseReceiveDialog from '@/components/PurchaseReceiveDialog.vue'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const userStore = getUserStore()
const { hasPermission } = usePermission()

const loading = ref(true)
const purchaseRequest = ref<PurchaseRequest | null>(null)
const purchaseOrder = ref<PurchaseOrder | null>(null)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const receiveDialogVisible = ref(false)
const actionLoading = ref(false)

const routeId = computed(() => route.params.id as string)
const viewType = computed(() => (route.query.type === 'order' ? 'order' : 'request'))

const currentStatus = computed(() => {
  if (viewType.value === 'order' && purchaseOrder.value) {
    return purchaseOrder.value.status
  }
  if (purchaseRequest.value) {
    return purchaseRequest.value.status
  }
  return ''
})

const statusLabel = computed(() => {
  if (viewType.value === 'order' && purchaseOrder.value) {
    return purchaseOrderStatusLabels[purchaseOrder.value.status]
  }
  if (purchaseRequest.value) {
    return purchaseRequestStatusLabels[purchaseRequest.value.status]
  }
  return ''
})

const statusColorClass = computed(() => {
  if (viewType.value === 'order' && purchaseOrder.value) {
    return purchaseOrderStatusColors[purchaseOrder.value.status]
  }
  if (purchaseRequest.value) {
    return purchaseRequestStatusColors[purchaseRequest.value.status]
  }
  return 'bg-gray-100 text-gray-600'
})

const items = computed(() => {
  if (purchaseOrder.value) {
    return purchaseOrder.value.items
  }
  if (purchaseRequest.value) {
    return purchaseRequest.value.items
  }
  return []
})

const itemType = computed(() => {
  if (purchaseOrder.value) {
    return purchaseOrder.value.itemType
  }
  if (purchaseRequest.value) {
    return purchaseRequest.value.itemType
  }
  return 'reagent' as const
})

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalReceived = computed(() => {
  return items.value.reduce((sum, item) => sum + item.receivedQuantity, 0)
})

const totalReturned = computed(() => {
  return items.value.reduce((sum, item) => sum + item.returnedQuantity, 0)
})

const receiveProgress = computed(() => {
  if (totalQuantity.value === 0) return 0
  return Math.round(((totalReceived.value - totalReturned.value) / totalQuantity.value) * 100)
})

const canEdit = computed(() => {
  if (viewType.value === 'order') {
    return (
      hasPermission('purchase:order:edit') &&
      purchaseOrder.value?.status === 'pending'
    )
  }
  return (
    hasPermission('purchase:request:edit') &&
    purchaseRequest.value?.status === 'draft'
  )
})

const canDelete = computed(() => {
  if (viewType.value === 'order') {
    return false
  }
  return (
    hasPermission('purchase:request:delete') &&
    (purchaseRequest.value?.status === 'draft' ||
      purchaseRequest.value?.status === 'rejected')
  )
})

const canSubmit = computed(() => {
  if (viewType.value === 'order') {
    return false
  }
  return (
    hasPermission('purchase:request:submit') &&
    purchaseRequest.value?.status === 'draft'
  )
})

const canApprove = computed(() => {
  if (viewType.value === 'order') {
    return false
  }
  return (
    hasPermission('purchase:request:approve') &&
    purchaseRequest.value?.status === 'approving'
  )
})

const canReject = computed(() => {
  if (viewType.value === 'order') {
    return false
  }
  return (
    hasPermission('purchase:request:approve') &&
    purchaseRequest.value?.status === 'approving'
  )
})

const canGenerateOrder = computed(() => {
  if (viewType.value === 'order') {
    return false
  }
  return (
    hasPermission('purchase:order:create') &&
    purchaseRequest.value?.status === 'approved' &&
    !purchaseOrder.value
  )
})

const canStartPurchase = computed(() => {
  return (
    hasPermission('purchase:order:edit') &&
    purchaseOrder.value?.status === 'pending'
  )
})

const canReceive = computed(() => {
  return (
    hasPermission('purchase:order:receive') &&
    purchaseOrder.value &&
    (purchaseOrder.value.status === 'purchasing' || purchaseOrder.value.status === 'partial_received')
  )
})

const canComplete = computed(() => {
  return (
    hasPermission('purchase:order:complete') &&
    purchaseOrder.value?.status === 'fully_received'
  )
})

const loadData = async () => {
  loading.value = true
  try {
    const id = routeId.value

    if (viewType.value === 'order') {
      purchaseOrder.value = await mockGetPurchaseOrder(id)
      if (purchaseOrder.value?.requestId) {
        purchaseRequest.value = await mockGetPurchaseRequest(purchaseOrder.value.requestId)
      }
    } else {
      purchaseRequest.value = await mockGetPurchaseRequest(id)
      try {
        purchaseOrder.value = await mockGetPurchaseOrderByRequestId(id)
      } catch (e) {
        purchaseOrder.value = null
      }
    }
  } catch (e: any) {
    console.error('Failed to load purchase detail', e)
    alert(e.message || '加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => [route.params.id, route.query.type], () => {
  loadData()
})

const goBack = () => {
  router.back()
}

const handleEdit = () => {
  if (viewType.value === 'order') {
    // 采购单编辑在列表页有弹窗，这里返回列表页
    router.push('/purchase-orders')
  } else {
    // 采购申请编辑在列表页有弹窗，这里返回列表页
    router.push('/purchases')
  }
}

const handleDelete = async () => {
  if (!confirm('确定要删除此采购申请吗？')) return

  actionLoading.value = true
  try {
    await mockDeletePurchaseRequest(routeId.value)
    alert('删除成功')
    router.push('/purchases')
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    actionLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!confirm('确定要提交审批吗？')) return

  actionLoading.value = true
  try {
    await mockSubmitPurchaseRequest(routeId.value)
    await loadData()
  } catch (e: any) {
    alert(e.message || '提交失败')
  } finally {
    actionLoading.value = false
  }
}

const handleApprove = async () => {
  if (!confirm('确定要审批通过吗？')) return

  actionLoading.value = true
  try {
    await mockApprovePurchaseRequest(routeId.value)
    await loadData()
  } catch (e: any) {
    alert(e.message || '审批失败')
  } finally {
    actionLoading.value = false
  }
}

const handleReject = () => {
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('请填写驳回原因')
    return
  }

  actionLoading.value = true
  try {
    await mockRejectPurchaseRequest(routeId.value, rejectReason.value)
    rejectDialogVisible.value = false
    rejectReason.value = ''
    await loadData()
  } catch (e: any) {
    alert(e.message || '驳回失败')
  } finally {
    actionLoading.value = false
  }
}

const handleGenerateOrder = async () => {
  if (!confirm('确定要生成采购单吗？')) return

  actionLoading.value = true
  try {
    const order = await mockCreatePurchaseOrder(routeId.value, {
      title: purchaseRequest.value?.title || '采购单',
      supplier: '',
      purchaserId: userStore.state.user?.id || '',
      purchaserName: userStore.state.user?.name || '',
      orderDate: formatDate(new Date()),
      expectedDeliveryDate: purchaseRequest.value?.expectedDeliveryDate || '',
      remark: '',
    })
    alert('采购单创建成功')
    router.push(`/purchases/orders/${order.id}?type=order`)
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    actionLoading.value = false
  }
}

const handleStartPurchase = async () => {
  if (!purchaseOrder.value) return
  if (!confirm('确定要开始采购吗？')) return

  actionLoading.value = true
  try {
    await mockStartPurchase(purchaseOrder.value.id)
    await loadData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

const handleCompleteOrder = async () => {
  if (!purchaseOrder.value) return
  if (!confirm('确定要完成此采购单吗？完成后将无法再进行到货或退货操作。')) return

  actionLoading.value = true
  try {
    await mockCompletePurchaseOrder(purchaseOrder.value.id)
    await loadData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

const handleReceiveSuccess = () => {
  loadData()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <button
          class="p-2 hover:bg-white rounded-xl transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ viewType === 'order' ? '采购单详情' : '采购申请详情' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ purchaseRequest?.requestNo || purchaseOrder?.orderNo || '' }}
          </p>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              statusColorClass,
            ]"
          >
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>

      <template v-else>
        <div class="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-gray-900">
                {{ purchaseRequest?.title || purchaseOrder?.title }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ itemType === 'reagent' ? '试剂采购' : '耗材采购' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="canEdit"
                class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                @click="handleEdit"
              >
                <Edit3 class="w-4 h-4" />
                编辑
              </button>
              <button
                v-if="canDelete"
                class="px-4 py-2 border border-danger-200 text-danger-600 rounded-xl hover:bg-danger-50 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleDelete"
              >
                <Trash2 class="w-4 h-4" />
                删除
              </button>
              <button
                v-if="canSubmit"
                class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleSubmit"
              >
                <Send class="w-4 h-4" />
                提交审批
              </button>
              <button
                v-if="canApprove"
                class="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleApprove"
              >
                <ThumbsUp class="w-4 h-4" />
                通过
              </button>
              <button
                v-if="canReject"
                class="px-4 py-2 bg-danger-600 text-white rounded-xl hover:bg-danger-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleReject"
              >
                <ThumbsDown class="w-4 h-4" />
                驳回
              </button>
              <button
                v-if="canGenerateOrder"
                class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleGenerateOrder"
              >
                <ShoppingCart class="w-4 h-4" />
                生成采购单
              </button>
              <button
                v-if="canStartPurchase"
                class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleStartPurchase"
              >
                <Play class="w-4 h-4" />
                开始采购
              </button>
              <button
                v-if="canReceive"
                class="px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors flex items-center gap-2"
                @click="receiveDialogVisible = true"
              >
                <ArrowDownToLine class="w-4 h-4" />
                到货登记
              </button>
              <button
                v-if="canComplete"
                class="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                :disabled="actionLoading"
                @click="handleCompleteOrder"
              >
                <CheckSquare class="w-4 h-4" />
                完成采购
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">申请人</div>
              <div class="font-medium text-gray-900">{{ purchaseRequest?.applicantName }}</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">申请时间</div>
              <div class="font-medium text-gray-900">{{ purchaseRequest?.createdAt }}</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">期望到货</div>
              <div class="font-medium text-gray-900">{{ purchaseRequest?.expectedDeliveryDate || '-' }}</div>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">采购物品</div>
              <div class="font-medium text-gray-900">{{ items.length }} 种 / {{ totalQuantity }} 件</div>
            </div>
          </div>

          <div v-if="purchaseOrder" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-primary-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">采购单编号</div>
              <div class="font-medium text-gray-900">{{ purchaseOrder.orderNo }}</div>
            </div>
            <div class="p-4 bg-primary-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">供应商</div>
              <div class="font-medium text-gray-900">{{ purchaseOrder.supplier || '-' }}</div>
            </div>
            <div class="p-4 bg-primary-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">采购员</div>
              <div class="font-medium text-gray-900">{{ purchaseOrder.purchaserName || '-' }}</div>
            </div>
            <div class="p-4 bg-primary-50 rounded-xl">
              <div class="text-xs text-gray-500 mb-1">下单日期</div>
              <div class="font-medium text-gray-900">{{ purchaseOrder.orderDate || '-' }}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-4 bg-success-50 rounded-xl">
              <div class="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <ArrowDownToLine class="w-4 h-4 text-success-600" />
                已到货
              </div>
              <div class="text-2xl font-bold text-success-600">{{ totalReceived }}</div>
              <div class="text-xs text-gray-500 mt-1">单位: 件</div>
            </div>
            <div class="p-4 bg-danger-50 rounded-xl">
              <div class="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Undo2 class="w-4 h-4 text-danger-600" />
                已退货
              </div>
              <div class="text-2xl font-bold text-danger-600">{{ totalReturned }}</div>
              <div class="text-xs text-gray-500 mt-1">单位: 件</div>
            </div>
            <div class="p-4 bg-primary-50 rounded-xl">
              <div class="text-sm text-gray-600 mb-2">到货进度</div>
              <div class="text-2xl font-bold text-primary-600">{{ receiveProgress }}%</div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  class="bg-primary-500 h-2 rounded-full transition-all"
                  :style="{ width: `${receiveProgress}%` }"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-700">用途</h3>
            <p class="text-gray-600">{{ purchaseRequest?.purpose || '无' }}</p>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-700">申请原因</h3>
            <p class="text-gray-600">{{ purchaseRequest?.reason || '无' }}</p>
          </div>

          <div v-if="purchaseRequest?.rejectReason" class="space-y-2">
            <h3 class="text-sm font-semibold text-danger-600">驳回原因</h3>
            <p class="text-gray-600 bg-danger-50 p-3 rounded-xl">{{ purchaseRequest.rejectReason }}</p>
          </div>

          <div v-if="purchaseOrder?.remark" class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-700">采购备注</h3>
            <p class="text-gray-600">{{ purchaseOrder.remark }}</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">采购明细</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">品牌</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">采购数量</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">已到货</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">已退货</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50/50">
                  <td class="py-4 px-4">
                    <div class="font-medium text-gray-900">{{ item.itemName }}</div>
                    <div v-if="item.casNo" class="text-xs text-gray-500">CAS: {{ item.casNo }}</div>
                    <div v-if="item.category" class="text-xs text-gray-500">{{ item.category }}</div>
                  </td>
                  <td class="py-4 px-4 text-gray-600">{{ item.specification }}</td>
                  <td class="py-4 px-4 text-gray-600">{{ item.unit }}</td>
                  <td class="py-4 px-4 text-gray-600">{{ item.brand || '-' }}</td>
                  <td class="py-4 px-4 text-center text-gray-900 font-medium">{{ item.quantity }}</td>
                  <td class="py-4 px-4 text-center text-success-600 font-medium">{{ item.receivedQuantity }}</td>
                  <td class="py-4 px-4 text-center text-danger-600 font-medium">{{ item.returnedQuantity }}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center justify-center gap-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-success-500 h-2 rounded-full transition-all"
                          :style="{
                            width: `${item.quantity > 0 ? Math.max(0, Math.min(100, ((item.receivedQuantity - item.returnedQuantity) / item.quantity) * 100)) : 0}%`,
                          }"
                        />
                      </div>
                      <span class="text-xs text-gray-500">
                        {{ item.quantity > 0 ? Math.round(((item.receivedQuantity - item.returnedQuantity) / item.quantity) * 100) : 0 }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="purchaseRequest?.approvalComments && purchaseRequest.approvalComments.length > 0" class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">审批记录</h2>
          <div class="space-y-4">
            <div
              v-for="(comment, index) in purchaseRequest.approvalComments"
              :key="index"
              class="p-4 bg-gray-50 rounded-xl"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="comment.action === 'approve' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'"
                  >
                    {{ comment.action === 'approve' ? '通过' : '驳回' }}
                  </span>
                  <span class="font-medium text-gray-900">{{ comment.approverName }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ comment.createdAt }}</span>
              </div>
              <p v-if="comment.comment" class="text-sm text-gray-600">{{ comment.comment }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="rejectDialogVisible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="rejectDialogVisible = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">驳回申请</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">驳回原因 <span class="text-danger-500">*</span></label>
            <textarea
              v-model="rejectReason"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="4"
              placeholder="请输入驳回原因"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="rejectDialogVisible = false"
            >
              取消
            </button>
            <button
              class="px-6 py-2 bg-danger-600 text-white rounded-xl hover:bg-danger-700 transition-colors disabled:opacity-50"
              :disabled="actionLoading || !rejectReason.trim()"
              @click="confirmReject"
            >
              {{ actionLoading ? '提交中...' : '确认驳回' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <PurchaseReceiveDialog
      v-if="purchaseOrder"
      v-model:visible="receiveDialogVisible"
      :order-id="purchaseOrder.id"
      :items="purchaseOrder.items"
      :item-type="purchaseOrder.itemType"
      @success="handleReceiveSuccess"
    />
  </div>
</template>
