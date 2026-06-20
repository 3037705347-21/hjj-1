<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  TrendingUp,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Globe,
  CreditCard,
  Building,
  Award,
  X,
  Plus,
} from 'lucide-vue-next'
import type {
  SupplierDetail,
  SupplierQualification,
  SupplierPriceHistory,
  SupplierDeliveryRecord,
  SupplierExceptionRecord,
} from '@/types/supplier'
import {
  supplierStatusLabels,
  supplierStatusColors,
  supplierRatingLabels,
  supplierRatingColors,
  qualificationTypes,
  exceptionTypeLabels,
  exceptionStatusLabels,
  exceptionLevelLabels,
} from '@/types/supplier'
import {
  mockGetSupplierDetail,
  mockAddQualification,
  mockDeleteQualification,
} from '@/mock/suppliers'
import { formatDate } from '@/utils/date'
import { usePermission } from '@/composables/usePermission'

const route = useRoute()
const router = useRouter()
const permission = usePermission()

const loading = ref(false)
const supplier = ref<SupplierDetail | null>(null)
const activeTab = ref<'info' | 'qualifications' | 'priceHistory' | 'deliveries' | 'exceptions'>('info')

const showQualificationModal = ref(false)
const qualificationForm = reactive({
  name: '',
  type: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  expireDate: '',
  issuedDate: '',
  remark: '',
})
const qualificationLoading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const result = await mockGetSupplierDetail(id)
    if (result) {
      supplier.value = result
    } else {
      router.replace('/suppliers')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/suppliers')
}

const handleTabChange = (tab: typeof activeTab.value) => {
  activeTab.value = tab
}

const openQualificationModal = () => {
  Object.assign(qualificationForm, {
    name: '',
    type: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    expireDate: '',
    issuedDate: '',
    remark: '',
  })
  showQualificationModal.value = true
}

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    qualificationForm.fileName = file.name
    qualificationForm.fileSize = file.size
    qualificationForm.fileUrl = URL.createObjectURL(file)
    if (!qualificationForm.name) {
      qualificationForm.name = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

const handleAddQualification = async () => {
  if (!qualificationForm.name.trim()) {
    alert('请输入资质名称')
    return
  }
  if (!qualificationForm.type) {
    alert('请选择资质类型')
    return
  }
  if (!qualificationForm.fileName) {
    alert('请上传资质文件')
    return
  }

  qualificationLoading.value = true
  try {
    if (supplier.value) {
      const newQual = await mockAddQualification(supplier.value.id, {
        name: qualificationForm.name,
        type: qualificationForm.type,
        fileUrl: qualificationForm.fileUrl,
        fileName: qualificationForm.fileName,
        fileSize: qualificationForm.fileSize,
        expireDate: qualificationForm.expireDate || undefined,
        issuedDate: qualificationForm.issuedDate || undefined,
        remark: qualificationForm.remark || undefined,
      })
      supplier.value.qualifications.unshift(newQual)
      showQualificationModal.value = false
    }
  } catch (e: any) {
    alert(e.message || '添加失败')
  } finally {
    qualificationLoading.value = false
  }
}

const handleDeleteQualification = async (id: string) => {
  if (!confirm('确定要删除该资质附件吗？')) {
    return
  }
  try {
    await mockDeleteQualification(id)
    if (supplier.value) {
      supplier.value.qualifications = supplier.value.qualifications.filter(q => q.id !== id)
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const isQualificationExpiringSoon = (expireDate?: string) => {
  if (!expireDate) return false
  const expire = new Date(expireDate)
  const now = new Date()
  const diffDays = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays > 0
}

const isQualificationExpired = (expireDate?: string) => {
  if (!expireDate) return false
  return new Date(expireDate) < new Date()
}

const statsCards = computed(() => {
  if (!supplier.value) return []
  return [
    {
      label: '累计订单',
      value: supplier.value.totalOrders + ' 单',
      icon: Package,
      color: 'primary',
    },
    {
      label: '累计金额',
      value: '¥' + (supplier.value.totalAmount / 10000).toFixed(1) + '万',
      icon: DollarSign,
      color: 'success',
    },
    {
      label: '准时到货率',
      value: supplier.value.onTimeDeliveryRate + '%',
      icon: TrendingUp,
      color: supplier.value.onTimeDeliveryRate >= 95 ? 'success' : supplier.value.onTimeDeliveryRate >= 85 ? 'warning' : 'danger',
    },
    {
      label: '质量合格率',
      value: supplier.value.qualityPassRate + '%',
      icon: CheckCircle,
      color: supplier.value.qualityPassRate >= 98 ? 'success' : supplier.value.qualityPassRate >= 90 ? 'warning' : 'danger',
    },
  ]
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ supplier?.name }}
            </h1>
            <span
              v-if="supplier?.shortName"
              class="text-sm text-gray-400"
            >
              ({{ supplier.shortName }})
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="supplier ? supplierStatusColors[supplier.status] : ''"
            >
              {{ supplier ? supplierStatusLabels[supplier.status] : '' }}
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-0.5"
              :class="supplier ? supplierRatingColors[supplier.rating] : ''"
            >
              <Star class="w-3 h-3" />
              {{ supplier?.rating }}级 {{ supplier ? supplierRatingLabels[supplier.rating] : '' }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="permission.canEditSupplier"
          class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit2 class="w-4 h-4" />
          编辑
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="(stat, index) in statsCards"
        :key="index"
        class="bg-white rounded-xl shadow-card p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
          </div>
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="{
              'bg-primary-50': stat.color === 'primary',
              'bg-success-50': stat.color === 'success',
              'bg-warning-50': stat.color === 'warning',
              'bg-danger-50': stat.color === 'danger',
            }"
          >
            <component
              :is="stat.icon"
              class="w-6 h-6"
              :class="{
                'text-primary-600': stat.color === 'primary',
                'text-success-600': stat.color === 'success',
                'text-warning-600': stat.color === 'warning',
                'text-danger-600': stat.color === 'danger',
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-card overflow-hidden">
      <div class="flex items-center gap-1 px-2 border-b border-gray-100">
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'info'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('info')"
        >
          <span class="flex items-center gap-2">
            <Building2 class="w-4 h-4" />
            基本信息
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'qualifications'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('qualifications')"
        >
          <span class="flex items-center gap-2">
            <Award class="w-4 h-4" />
            资质证照
            <span
              v-if="supplier?.qualifications?.length"
              class="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500"
            >
              {{ supplier.qualifications.length }}
            </span>
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'priceHistory'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('priceHistory')"
        >
          <span class="flex items-center gap-2">
            <DollarSign class="w-4 h-4" />
            历史报价
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'deliveries'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('deliveries')"
        >
          <span class="flex items-center gap-2">
            <Package class="w-4 h-4" />
            供货记录
          </span>
        </button>
        <button
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === 'exceptions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
          @click="handleTabChange('exceptions')"
        >
          <span class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            异常记录
            <span
              v-if="supplier?.exceptionRecords?.filter(e => e.status !== 'resolved' && e.status !== 'closed').length"
              class="px-1.5 py-0.5 text-xs rounded-full bg-danger-100 text-danger-600"
            >
              {{ supplier.exceptionRecords.filter(e => e.status !== 'resolved' && e.status !== 'closed').length }}
            </span>
          </span>
        </button>
      </div>

      <div class="p-6">
        <div v-if="loading" class="p-16 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>

        <div v-else-if="activeTab === 'info'" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone class="w-4 h-4 text-gray-400" />
                联系信息
              </h3>
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">联系人</span>
                  <span class="text-sm text-gray-900 font-medium">{{ supplier?.contactPerson }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">联系电话</span>
                  <span class="text-sm text-gray-900">{{ supplier?.contactPhone }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">邮箱</span>
                  <span class="text-sm text-gray-900">{{ supplier?.contactEmail || '-' }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">公司网站</span>
                  <span class="text-sm text-gray-900 flex items-center gap-1">
                    <Globe v-if="supplier?.website" class="w-3.5 h-3.5 text-gray-400" />
                    {{ supplier?.website || '-' }}
                  </span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">地址</span>
                  <span class="text-sm text-gray-900 flex items-start gap-1">
                    <MapPin class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    {{ supplier?.address }}
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building class="w-4 h-4 text-gray-400" />
                业务信息
              </h3>
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">主营品类</span>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="cat in supplier?.mainCategories"
                      :key="cat"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                    >
                      {{ cat }}
                    </span>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">账期</span>
                  <span class="text-sm text-gray-900">{{ supplier?.paymentTerms }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">成立日期</span>
                  <span class="text-sm text-gray-900">{{ supplier?.establishedDate || '-' }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-sm text-gray-500 w-20 flex-shrink-0">注册资本</span>
                  <span class="text-sm text-gray-900">{{ supplier?.registeredCapital || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-gray-400" />
              财务信息
            </h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <span class="text-xs text-gray-500">税号</span>
                  <p class="text-sm text-gray-900 mt-1">{{ supplier?.taxNumber || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">营业执照号</span>
                  <p class="text-sm text-gray-900 mt-1">{{ supplier?.businessLicense || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">开户银行</span>
                  <p class="text-sm text-gray-900 mt-1">{{ supplier?.bankName || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">银行账号</span>
                  <p class="text-sm text-gray-900 mt-1">{{ supplier?.bankAccount || '-' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText class="w-4 h-4 text-gray-400" />
              备注信息
            </h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-600">{{ supplier?.remark || '暂无备注信息' }}</p>
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              创建于 {{ supplier ? formatDate(supplier.createdAt, 'YYYY-MM-DD HH:mm') : '' }}
            </span>
            <span class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              更新于 {{ supplier ? formatDate(supplier.updatedAt, 'YYYY-MM-DD HH:mm') : '' }}
            </span>
          </div>
        </div>

        <div v-else-if="activeTab === 'qualifications'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">
              共 {{ supplier?.qualifications?.length || 0 }} 个资质证照
            </p>
            <button
              v-if="permission.canManageSupplierQualification"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              @click="openQualificationModal"
            >
              <Plus class="w-4 h-4" />
              添加资质
            </button>
          </div>

          <div
            v-if="!supplier?.qualifications?.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Award class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无资质证照</p>
          </div>

          <div v-else class="grid grid-cols-2 gap-4">
            <div
              v-for="qual in supplier.qualifications"
              :key="qual.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
              :class="{
                'border-danger-200 bg-danger-50/30': isQualificationExpired(qual.expireDate),
                'border-warning-200 bg-warning-50/30': isQualificationExpiringSoon(qual.expireDate) && !isQualificationExpired(qual.expireDate),
              }"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FileText class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900">{{ qual.name }}</h4>
                    <span class="text-xs text-gray-500">{{ qual.type }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="下载"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button
                    v-if="permission.canManageSupplierQualification"
                    class="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                    title="删除"
                    @click="handleDeleteQualification(qual.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="mt-3 space-y-1.5 text-xs text-gray-500">
                <div class="flex items-center gap-2">
                  <span>文件名：{{ qual.fileName }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span v-if="qual.issuedDate">签发日期：{{ qual.issuedDate }}</span>
                  <span v-if="qual.expireDate" class="flex items-center gap-1">
                    有效期至：{{ qual.expireDate }}
                    <XCircle v-if="isQualificationExpired(qual.expireDate)" class="w-3 h-3 text-danger-500" />
                    <AlertTriangle v-else-if="isQualificationExpiringSoon(qual.expireDate)" class="w-3 h-3 text-warning-500" />
                  </span>
                </div>
                <div v-if="qual.remark" class="text-gray-400">
                  备注：{{ qual.remark }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'priceHistory'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ supplier?.priceHistory?.length || 0 }} 条历史报价记录
          </p>

          <div
            v-if="!supplier?.priceHistory?.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <DollarSign class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无历史报价记录</p>
          </div>

          <div v-else class="overflow-x-auto -mx-6">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报价日期</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in supplier.priceHistory"
                  :key="item.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ item.itemName }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ item.specification }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ item.unit }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-primary-600">¥{{ item.unitPrice.toFixed(2) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.quoteDate }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ item.validFrom || '-' }} ~ {{ item.validTo || '长期' }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="item.itemType === 'reagent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    >
                      {{ item.itemType === 'reagent' ? '试剂' : '耗材' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'deliveries'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ supplier?.deliveryRecords?.length || 0 }} 条供货记录
          </p>

          <div
            v-if="!supplier?.deliveryRecords?.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无供货记录</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="record in supplier.deliveryRecords"
              :key="record.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="font-medium text-gray-900">{{ record.orderNo }}</span>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1"
                    :class="record.isOnTime ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'"
                  >
                    <CheckCircle v-if="record.isOnTime" class="w-3 h-3" />
                    <AlertTriangle v-else class="w-3 h-3" />
                    {{ record.isOnTime ? '准时到货' : '延迟 ' + record.delayDays + ' 天' }}
                  </span>
                </div>
                <span class="text-xs text-gray-400">
                  到货日期：{{ record.actualDate }}
                </span>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div class="flex items-center gap-4">
                  <span>预计到货：{{ record.expectedDate }}</span>
                  <span v-if="record.remark">备注：{{ record.remark }}</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span
                    v-for="item in record.items"
                    :key="item.itemId"
                    class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600"
                  >
                    {{ item.itemName }} × {{ item.receivedQuantity }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'exceptions'" class="space-y-4">
          <p class="text-sm text-gray-500">
            共 {{ supplier?.exceptionRecords?.length || 0 }} 条异常记录
          </p>

          <div
            v-if="!supplier?.exceptionRecords?.length"
            class="p-12 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckCircle class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-gray-400">暂无异常记录，表现良好</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="exception in supplier.exceptionRecords"
              :key="exception.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="{
                      'bg-danger-50': exception.level === 'high',
                      'bg-warning-50': exception.level === 'medium',
                      'bg-info-50': exception.level === 'low',
                    }"
                  >
                    <AlertTriangle
                      class="w-4 h-4"
                      :class="{
                        'text-danger-600': exception.level === 'high',
                        'text-warning-600': exception.level === 'medium',
                        'text-info-600': exception.level === 'low',
                      }"
                    />
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900">{{ exception.title }}</h4>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-danger-100 text-danger-700': exception.status === 'pending',
                          'bg-warning-100 text-warning-700': exception.status === 'processing',
                          'bg-success-100 text-success-700': exception.status === 'resolved',
                          'bg-gray-100 text-gray-600': exception.status === 'closed',
                        }"
                      >
                        {{ exceptionStatusLabels[exception.status] }}
                      </span>
                      <span class="text-xs text-gray-400">{{ exceptionTypeLabels[exception.type] }}</span>
                      <span
                        class="text-xs"
                        :class="{
                          'text-danger-500': exception.level === 'high',
                          'text-warning-500': exception.level === 'medium',
                          'text-info-500': exception.level === 'low',
                        }"
                      >
                        {{ exceptionLevelLabels[exception.level] }}级
                      </span>
                    </div>
                  </div>
                </div>
                <span class="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(exception.createdAt, 'YYYY-MM-DD') }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ exception.description }}</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <div v-if="exception.orderNo">
                  关联订单：{{ exception.orderNo }}
                </div>
                <div v-if="exception.handlerName">
                  处理人：{{ exception.handlerName }}
                </div>
              </div>
              <div v-if="exception.resolution" class="mt-3 pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">处理结果：</span>
                <span class="text-sm text-gray-700">{{ exception.resolution }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showQualificationModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="showQualificationModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">添加资质证照</h3>
          <button
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            @click="showQualificationModal = false"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                资质名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="qualificationForm.name"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="请输入资质名称"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                资质类型 <span class="text-red-500">*</span>
              </label>
              <select
                v-model="qualificationForm.type"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
              >
                <option value="">请选择资质类型</option>
                <option v-for="type in qualificationTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                资质文件 <span class="text-red-500">*</span>
              </label>
              <div
                class="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary-300 transition-colors cursor-pointer"
                @click="($refs.fileInput as HTMLInputElement)?.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  @change="handleFileUpload"
                >
                <Upload class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p v-if="!qualificationForm.fileName" class="text-sm text-gray-500">
                  点击或拖拽文件到此处上传
                </p>
                <p v-else class="text-sm text-gray-700">
                  {{ qualificationForm.fileName }}
                  <span class="text-gray-400">({{ formatFileSize(qualificationForm.fileSize) }})</span>
                </p>
                <p class="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  签发日期
                </label>
                <input
                  v-model="qualificationForm.issuedDate"
                  type="date"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  有效期至
                </label>
                <input
                  v-model="qualificationForm.expireDate"
                  type="date"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                备注
              </label>
              <textarea
                v-model="qualificationForm.remark"
                rows="2"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="请输入备注信息"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            class="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            @click="showQualificationModal = false"
          >
            取消
          </button>
          <button
            :disabled="qualificationLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
            @click="handleAddQualification"
          >
            <span
              v-if="qualificationLoading"
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
