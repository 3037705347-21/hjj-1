<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { X, Package, CheckCircle, ArrowDownToLine, Undo2 } from 'lucide-vue-next'
import type {
  PurchaseItem,
  PurchaseReceiveFormData,
  PurchaseReturnFormData,
  PurchaseReceiveRecord,
  PurchaseReturnRecord,
} from '@/types/purchase'
import {
  mockReceivePurchaseItem,
  mockReturnPurchaseItem,
  mockGetReceiveRecords,
  mockGetReturnRecords,
} from '@/mock/purchases'
import { formatDate } from '@/utils/date'
import { storageConditions } from '@/types/reagent'

const props = defineProps<{
  visible: boolean
  orderId: string
  items: PurchaseItem[]
  itemType: 'reagent' | 'consumable'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const activeTab = ref<'receive' | 'return'>('receive')
const loading = ref(false)
const receiveRecords = ref<PurchaseReceiveRecord[]>([])
const returnRecords = ref<PurchaseReturnRecord[]>([])

const receiveForm = reactive<PurchaseReceiveFormData>({
  itemId: '',
  itemName: '',
  receivedQuantity: 0,
  unit: '',
  receivedDate: formatDate(new Date()),
  batchNumber: '',
  productionDate: '',
  expiryDate: '',
  storageLocation: '',
  remark: '',
})

const returnForm = reactive<PurchaseReturnFormData>({
  itemId: '',
  itemName: '',
  returnedQuantity: 0,
  unit: '',
  returnedDate: formatDate(new Date()),
  reason: '',
  remark: '',
})

const selectedItem = computed(() => {
  if (activeTab.value === 'receive') {
    return props.items.find(i => i.id === receiveForm.itemId)
  }
  return props.items.find(i => i.id === returnForm.itemId)
})

const maxReceiveQuantity = computed(() => {
  if (!selectedItem.value) return 0
  return selectedItem.value.quantity - selectedItem.value.receivedQuantity - selectedItem.value.returnedQuantity
})

const maxReturnQuantity = computed(() => {
  if (!selectedItem.value) return 0
  return selectedItem.value.receivedQuantity - selectedItem.value.returnedQuantity
})

const selectableItems = computed(() => {
  if (activeTab.value === 'receive') {
    return props.items.filter(i => i.receivedQuantity + i.returnedQuantity < i.quantity)
  }
  return props.items.filter(i => i.receivedQuantity > i.returnedQuantity)
})

watch(() => props.visible, async (val) => {
  if (val && props.orderId) {
    await loadRecords()
    resetForms()
  }
})

watch(() => activeTab.value, () => {
  resetForms()
})

const loadRecords = async () => {
  try {
    receiveRecords.value = await mockGetReceiveRecords(props.orderId)
    returnRecords.value = await mockGetReturnRecords(props.orderId)
  } catch (e) {
    console.error('Failed to load records', e)
  }
}

const resetForms = () => {
  receiveForm.itemId = ''
  receiveForm.itemName = ''
  receiveForm.receivedQuantity = 0
  receiveForm.unit = ''
  receiveForm.receivedDate = formatDate(new Date())
  receiveForm.batchNumber = ''
  receiveForm.productionDate = ''
  receiveForm.expiryDate = ''
  receiveForm.storageLocation = ''
  receiveForm.remark = ''

  returnForm.itemId = ''
  returnForm.itemName = ''
  returnForm.returnedQuantity = 0
  returnForm.unit = ''
  returnForm.returnedDate = formatDate(new Date())
  returnForm.reason = ''
  returnForm.remark = ''
}

const handleSelectReceiveItem = (itemId: string) => {
  const item = props.items.find(i => i.id === itemId)
  if (item) {
    receiveForm.itemId = item.id
    receiveForm.itemName = item.itemName
    receiveForm.unit = item.unit
    receiveForm.receivedQuantity = Math.min(1, maxReceiveQuantity.value)
  }
}

const handleSelectReturnItem = (itemId: string) => {
  const item = props.items.find(i => i.id === itemId)
  if (item) {
    returnForm.itemId = item.id
    returnForm.itemName = item.itemName
    returnForm.unit = item.unit
    returnForm.returnedQuantity = Math.min(1, maxReturnQuantity.value)
  }
}

const handleReceiveSubmit = async () => {
  if (!receiveForm.itemId) {
    alert('请选择采购物品')
    return
  }
  if (receiveForm.receivedQuantity <= 0) {
    alert('到货数量必须大于0')
    return
  }
  if (receiveForm.receivedQuantity > maxReceiveQuantity.value) {
    alert(`到货数量不能超过剩余未到货数量 ${maxReceiveQuantity.value} ${receiveForm.unit}`)
    return
  }
  if (props.itemType === 'reagent' && !receiveForm.batchNumber) {
    alert('请填写批次号')
    return
  }

  loading.value = true
  try {
    await mockReceivePurchaseItem(props.orderId, { ...receiveForm })
    emit('success')
    await loadRecords()
    resetForms()
  } catch (e: any) {
    alert(e.message || '登记失败')
  } finally {
    loading.value = false
  }
}

const handleReturnSubmit = async () => {
  if (!returnForm.itemId) {
    alert('请选择退货物品')
    return
  }
  if (returnForm.returnedQuantity <= 0) {
    alert('退货数量必须大于0')
    return
  }
  if (returnForm.returnedQuantity > maxReturnQuantity.value) {
    alert(`退货数量不能超过已到货数量 ${maxReturnQuantity.value} ${returnForm.unit}`)
    return
  }
  if (!returnForm.reason.trim()) {
    alert('请填写退货原因')
    return
  }

  loading.value = true
  try {
    await mockReturnPurchaseItem(props.orderId, { ...returnForm })
    emit('success')
    await loadRecords()
    resetForms()
  } catch (e: any) {
    alert(e.message || '退货失败')
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('update:visible', false)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 class="text-lg font-semibold text-gray-900">到货登记 / 退货</h3>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="flex border-b border-gray-100">
        <button
          class="flex-1 px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'receive'
            ? 'text-primary-600 border-b-2 border-primary-500'
            : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'receive'"
        >
          <div class="flex items-center justify-center gap-2">
            <ArrowDownToLine class="w-4 h-4" />
            到货登记
          </div>
        </button>
        <button
          class="flex-1 px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'return'
            ? 'text-primary-600 border-b-2 border-primary-500'
            : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'return'"
        >
          <div class="flex items-center justify-center gap-2">
            <Undo2 class="w-4 h-4" />
            退货登记
          </div>
        </button>
      </div>

      <div class="p-6 space-y-6 overflow-y-auto flex-1">
        <div v-if="activeTab === 'receive'" class="space-y-5">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">选择物品 <span class="text-danger-500">*</span></label>
            <select
              v-model="receiveForm.itemId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              @change="handleSelectReceiveItem(($event.target as HTMLSelectElement).value)"
            >
              <option value="">请选择采购物品</option>
              <option
                v-for="item in selectableItems"
                :key="item.id"
                :value="item.id"
              >
                {{ item.itemName }} ({{ item.specification }}) - 剩余 {{ item.quantity - item.receivedQuantity - item.returnedQuantity }} {{ item.unit }}
              </option>
            </select>
          </div>

          <div v-if="selectedItem" class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">到货数量 <span class="text-danger-500">*</span></label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="receiveForm.receivedQuantity"
                  type="number"
                  min="1"
                  :max="maxReceiveQuantity"
                  class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span class="text-gray-500">{{ selectedItem.unit }}</span>
              </div>
              <p class="text-xs text-gray-500">最大可到货: {{ maxReceiveQuantity }} {{ selectedItem.unit }}</p>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">到货日期 <span class="text-danger-500">*</span></label>
              <input
                v-model="receiveForm.receivedDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <template v-if="selectedItem && itemType === 'reagent'">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">批次号 <span class="text-danger-500">*</span></label>
                <input
                  v-model="receiveForm.batchNumber"
                  type="text"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="请输入批次号"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">生产日期</label>
                <input
                  v-model="receiveForm.productionDate"
                  type="date"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">有效期</label>
                <input
                  v-model="receiveForm.expiryDate"
                  type="date"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">存储位置</label>
                <select
                  v-model="receiveForm.storageLocation"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">请选择</option>
                  <option v-for="cond in storageConditions" :key="cond" :value="cond">{{ cond }}</option>
                </select>
              </div>
            </div>
          </template>

          <div v-if="selectedItem" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">备注</label>
            <textarea
              v-model="receiveForm.remark"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="2"
              placeholder="请输入备注信息"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="close"
            >
              取消
            </button>
            <button
              class="px-6 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="loading || !selectedItem"
              @click="handleReceiveSubmit"
            >
              <CheckCircle class="w-4 h-4" />
              {{ loading ? '登记中...' : '确认登记到货' }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-5">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">选择退货物品 <span class="text-danger-500">*</span></label>
            <select
              v-model="returnForm.itemId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              @change="handleSelectReturnItem(($event.target as HTMLSelectElement).value)"
            >
              <option value="">请选择退货物品</option>
              <option
                v-for="item in selectableItems"
                :key="item.id"
                :value="item.id"
              >
                {{ item.itemName }} ({{ item.specification }}) - 已到货 {{ item.receivedQuantity - item.returnedQuantity }} {{ item.unit }}
              </option>
            </select>
          </div>

          <div v-if="selectedItem" class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">退货数量 <span class="text-danger-500">*</span></label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="returnForm.returnedQuantity"
                  type="number"
                  min="1"
                  :max="maxReturnQuantity"
                  class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span class="text-gray-500">{{ selectedItem.unit }}</span>
              </div>
              <p class="text-xs text-gray-500">最大可退货: {{ maxReturnQuantity }} {{ selectedItem.unit }}</p>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">退货日期 <span class="text-danger-500">*</span></label>
              <input
                v-model="returnForm.returnedDate"
                type="date"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div v-if="selectedItem" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">退货原因 <span class="text-danger-500">*</span></label>
            <textarea
              v-model="returnForm.reason"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="3"
              placeholder="请详细说明退货原因"
            />
          </div>

          <div v-if="selectedItem" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">备注</label>
            <textarea
              v-model="returnForm.remark"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows="2"
              placeholder="请输入备注信息"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              class="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              @click="close"
            >
              取消
            </button>
            <button
              class="px-6 py-2 bg-danger-600 text-white rounded-xl hover:bg-danger-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="loading || !selectedItem"
              @click="handleReturnSubmit"
            >
              <Undo2 class="w-4 h-4" />
              {{ loading ? '登记中...' : '确认退货' }}
            </button>
          </div>
        </div>

        <div v-if="receiveRecords.length > 0 || returnRecords.length > 0" class="pt-6 border-t border-gray-200">
          <h4 class="text-sm font-semibold text-gray-700 mb-4">历史记录</h4>

          <div v-if="receiveRecords.length > 0" class="mb-6">
            <h5 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">到货记录</h5>
            <div class="space-y-2">
              <div
                v-for="record in receiveRecords"
                :key="record.id"
                class="p-3 bg-success-50 rounded-xl border border-success-100"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <ArrowDownToLine class="w-4 h-4 text-success-600" />
                    <span class="font-medium text-gray-900">{{ record.itemName }}</span>
                    <span class="text-success-600">+{{ record.receivedQuantity }} {{ record.unit }}</span>
                  </div>
                  <span class="text-xs text-gray-500">{{ record.createdAt }}</span>
                </div>
                <div v-if="record.batchNumber" class="mt-2 text-sm text-gray-600">
                  批次号: {{ record.batchNumber }}
                  <span v-if="record.expiryDate"> | 有效期: {{ record.expiryDate }}</span>
                  <span v-if="record.storageLocation"> | 存储: {{ record.storageLocation }}</span>
                </div>
                <div v-if="record.remark" class="mt-1 text-sm text-gray-500">
                  备注: {{ record.remark }}
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  登记人: {{ record.receiverName }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="returnRecords.length > 0">
            <h5 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">退货记录</h5>
            <div class="space-y-2">
              <div
                v-for="record in returnRecords"
                :key="record.id"
                class="p-3 bg-danger-50 rounded-xl border border-danger-100"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Undo2 class="w-4 h-4 text-danger-600" />
                    <span class="font-medium text-gray-900">{{ record.itemName }}</span>
                    <span class="text-danger-600">-{{ record.returnedQuantity }} {{ record.unit }}</span>
                  </div>
                  <span class="text-xs text-gray-500">{{ record.createdAt }}</span>
                </div>
                <div class="mt-2 text-sm text-gray-600">
                  原因: {{ record.reason }}
                </div>
                <div v-if="record.remark" class="mt-1 text-sm text-gray-500">
                  备注: {{ record.remark }}
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  登记人: {{ record.returnerName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
