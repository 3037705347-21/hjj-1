<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X, Printer, Barcode as BarcodeIcon, QrCode, Copy, Check } from 'lucide-vue-next'
import type { LabelData, PrintConfig, LabelEntityType } from '@/types/label'
import { generateQRCodeDataURL, generateBarcodeDataURL, buildLabelCode } from '@/utils/label'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  visible: boolean
  labelData: LabelData | null
  defaultCodeType?: 'barcode' | 'qrcode'
  defaultLabelSize?: PrintConfig['labelSize']
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const config = ref<PrintConfig>({
  labelSize: props.defaultLabelSize || '60x40',
  codeType: props.defaultCodeType || 'qrcode',
  copies: 1,
})

const qrcodeDataUrl = ref('')
const barcodeDataUrl = ref('')
const fullCode = ref('')
const copied = ref(false)

const labelSizeMap: Record<PrintConfig['labelSize'], { width: number; height: number; label: string }> = {
  '40x30': { width: 400, height: 300, label: '40mm × 30mm' },
  '60x40': { width: 600, height: 400, label: '60mm × 40mm' },
  '80x50': { width: 800, height: 500, label: '80mm × 50mm' },
}

const labelDimensions = computed(() => labelSizeMap[config.value.labelSize])

const formattedExpiry = computed(() => {
  if (!props.labelData?.expiryDate) return '-'
  try {
    return formatDate(props.labelData.expiryDate)
  } catch {
    return props.labelData.expiryDate
  }
})

const entityTypeLabel = computed((): string => {
  if (!props.labelData) return ''
  const map: Record<LabelEntityType, string> = {
    reagent: '试剂',
    batch: '批次',
    consumable: '耗材',
  }
  return map[props.labelData.entityType]
})

const generateCodes = async () => {
  if (!props.labelData) return
  fullCode.value = buildLabelCode(props.labelData.entityType, props.labelData.entityId)
  const qrSize = config.value.labelSize === '80x50' ? 180 : config.value.labelSize === '60x40' ? 140 : 100
  qrcodeDataUrl.value = await generateQRCodeDataURL(fullCode.value, qrSize)
  const bcWidth = config.value.labelSize === '80x50' ? 480 : config.value.labelSize === '60x40' ? 360 : 240
  const bcHeight = config.value.labelSize === '80x50' ? 90 : 70
  barcodeDataUrl.value = generateBarcodeDataURL(fullCode.value, bcWidth, bcHeight)
}

const handleClose = () => {
  emit('close')
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('请允许弹出窗口以进行打印')
    return
  }

  const copiesHtml = Array.from({ length: config.value.copies }, () => {
    const style = `width:${labelDimensions.value.width}px;height:${labelDimensions.value.height}px;border:1px dashed #ccc;page-break-after:always;padding:${config.value.labelSize === '40x30' ? '8px' : '12px'};box-sizing:border-box;font-family:Arial,"Microsoft YaHei",sans-serif;display:flex;flex-direction:column;`
    const imgHtml = config.value.codeType === 'qrcode'
      ? `<div style="display:flex;justify-content:center;align-items:center;flex:1;"><img src="${qrcodeDataUrl.value}" style="max-width:${config.value.labelSize === '80x50' ? '45%' : '55%'};max-height:100%;object-fit:contain;" /></div>`
      : `<div style="display:flex;justify-content:center;align-items:center;flex:0 0 auto;"><img src="${barcodeDataUrl.value}" style="max-width:100%;height:auto;" /></div>`
    const infoCols = config.value.labelSize === '40x30' ? 1 : 2
    const infoFlexBasis = infoCols === 1 ? '100%' : '50%'
    const infoFontSize = config.value.labelSize === '40x30' ? '9px' : config.value.labelSize === '60x40' ? '11px' : '13px'
    const titleFontSize = config.value.labelSize === '40x30' ? '12px' : config.value.labelSize === '60x40' ? '16px' : '20px'
    const labelFontSize = config.value.labelSize === '40x30' ? '8px' : config.value.labelSize === '60x40' ? '10px' : '11px'

    const infoItems = [
      { label: '编号', value: props.labelData?.code || '-' },
      { label: '规格', value: props.labelData?.specification || '-' },
      { label: '批次', value: props.labelData?.batchNumber || '-' },
      { label: '效期', value: formattedExpiry.value },
      { label: '库位', value: props.labelData?.location || '-' },
      { label: '厂家', value: props.labelData?.manufacturer || '-' },
    ]

    return `
      <div style="${style}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
          <div style="font-size:${labelFontSize};color:#666;">${entityTypeLabel.value}标签</div>
          <div style="font-size:${labelFontSize};color:#999;">${formatDate(new Date())}</div>
        </div>
        <div style="font-size:${titleFontSize};font-weight:bold;color:#111;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${props.labelData?.name || '-'}
        </div>
        <div style="flex:1;display:flex;gap:${config.value.labelSize === '40x30' ? '4px' : '8px'};min-height:0;">
          ${imgHtml}
          <div style="flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;gap:${config.value.labelSize === '40x30' ? '2px' : '4px'};min-width:0;overflow:hidden;">
            ${infoItems.map(item => `
              <div style="flex:0 0 ${infoFlexBasis};box-sizing:border-box;min-width:0;">
                <div style="font-size:${labelFontSize};color:#888;">${item.label}</div>
                <div style="font-size:${infoFontSize};color:#222;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }).join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>标签打印</title>
      <style>
        @media print {
          body { margin: 0; }
          div:last-child { page-break-after: auto; }
        }
        @page { margin: 4mm; }
      </style>
    </head>
    <body>
      ${copiesHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 300);
        };
      <\/script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

const copyCode = async () => {
  if (!fullCode.value) return
  try {
    await navigator.clipboard.writeText(fullCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    alert('复制失败')
  }
}

watch(
  () => [props.visible, props.labelData, config.value.codeType, config.value.labelSize],
  () => {
    if (props.visible && props.labelData) {
      generateCodes()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.visible && props.labelData) {
    generateCodes()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="handleClose"
      />
      <div
        class="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 class="text-lg font-bold text-gray-900">标签打印预览</h3>
            <p class="text-xs text-gray-500 mt-0.5">配置标签样式并打印</p>
          </div>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            @click="handleClose"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="labelData" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
              <div class="bg-gray-50 rounded-xl p-6 flex items-center justify-center min-h-[300px] border-2 border-dashed border-gray-200">
                <div
                  class="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
                  :style="{ width: labelDimensions.width * 0.8 + 'px', height: labelDimensions.height * 0.8 + 'px', padding: config.labelSize === '40x30' ? '8px' : '14px' }"
                >
                  <div class="flex flex-col h-full">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] text-gray-500 font-medium">{{ entityTypeLabel }}标签</span>
                      <span class="text-[10px] text-gray-400">{{ formatDate(new Date()) }}</span>
                    </div>
                    <div class="text-sm font-bold text-gray-900 truncate mb-2">
                      {{ labelData.name }}
                    </div>
                    <div class="flex-1 flex gap-3 min-h-0 overflow-hidden">
                      <div class="flex items-center justify-center flex-shrink-0">
                        <img
                          v-if="config.codeType === 'qrcode' && qrcodeDataUrl"
                          :src="qrcodeDataUrl"
                          alt="QR Code"
                          class="object-contain"
                          :style="{ maxWidth: config.labelSize === '40x30' ? '80px' : '110px', maxHeight: '100%' }"
                        />
                        <img
                          v-else-if="config.codeType === 'barcode' && barcodeDataUrl"
                          :src="barcodeDataUrl"
                          alt="Barcode"
                          class="object-contain"
                          :style="{ width: config.labelSize === '40x30' ? '140px' : '200px', height: 'auto' }"
                        />
                      </div>
                      <div class="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 content-start min-w-0">
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">编号</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ labelData.code || '-' }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">规格</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ labelData.specification || '-' }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">批次</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ labelData.batchNumber || '-' }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">效期</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ formattedExpiry }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">库位</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ labelData.location || '-' }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-gray-500 leading-tight">厂家</div>
                          <div class="text-xs font-semibold text-gray-800 truncate">{{ labelData.manufacturer || '-' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] text-primary-600 font-medium">标签编码</div>
                  <div class="text-sm font-mono font-bold text-primary-900 truncate">{{ fullCode }}</div>
                </div>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md border border-primary-200 hover:border-primary-400 transition-colors text-xs font-medium text-primary-700"
                  @click="copyCode"
                >
                  <Check v-if="copied" class="w-3.5 h-3.5 text-success-600" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2">标签尺寸</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="(dim, size) in labelSizeMap"
                    :key="size"
                    class="px-2 py-3 rounded-lg border-2 text-center transition-all"
                    :class="config.labelSize === size
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'"
                    @click="config.labelSize = size as PrintConfig['labelSize']"
                  >
                    <div class="text-xs font-bold">{{ dim.label.split(' ')[0] }}</div>
                    <div class="text-[10px] text-gray-500 mt-0.5">小标签</div>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2">码类型</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all"
                    :class="config.codeType === 'barcode'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'"
                    @click="config.codeType = 'barcode'"
                  >
                    <BarcodeIcon class="w-5 h-5" />
                    <span class="text-sm font-medium">条码</span>
                  </button>
                  <button
                    class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all"
                    :class="config.codeType === 'qrcode'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'"
                    @click="config.codeType = 'qrcode'"
                  >
                    <QrCode class="w-5 h-5" />
                    <span class="text-sm font-medium">二维码</span>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-800 mb-2">打印份数</label>
                <div class="flex items-center gap-3">
                  <button
                    class="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-lg font-bold text-gray-600"
                    :disabled="config.copies <= 1"
                    @click="config.copies = Math.max(1, config.copies - 1)"
                  >
                    −
                  </button>
                  <input
                    v-model.number="config.copies"
                    type="number"
                    min="1"
                    max="100"
                    class="flex-1 h-10 text-center rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm font-semibold"
                  />
                  <button
                    class="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-lg font-bold text-gray-600"
                    :disabled="config.copies >= 100"
                    @click="config.copies = Math.min(100, config.copies + 1)"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="pt-3 border-t border-gray-100 space-y-2">
                <button
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors"
                  @click="handlePrint"
                >
                  <Printer class="w-4 h-4" />
                  打印 {{ config.copies }} 份标签
                </button>
                <button
                  class="w-full px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
                  @click="handleClose"
                >
                  取消
                </button>
              </div>
            </div>
          </div>

          <div
            v-else
            class="py-16 text-center text-gray-500"
          >
            暂无标签数据
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
