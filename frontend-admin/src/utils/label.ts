import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import type { LabelData, LabelEntityType } from '@/types/label'

export function buildLabelCode(entityType: LabelEntityType, entityId: string): string {
  const prefix = entityType === 'reagent' ? 'RGT' : entityType === 'batch' ? 'BCH' : 'CON'
  return `${prefix}-${entityId}`
}

export function parseLabelCode(rawCode: string): { entityType: LabelEntityType | null; entityId: string; code: string } {
  const code = rawCode.trim()
  if (code.startsWith('RGT-')) {
    return { entityType: 'reagent', entityId: code.slice(4), code }
  }
  if (code.startsWith('BCH-')) {
    return { entityType: 'batch', entityId: code.slice(4), code }
  }
  if (code.startsWith('CON-')) {
    return { entityType: 'consumable', entityId: code.slice(4), code }
  }
  return { entityType: null, entityId: code, code }
}

export async function generateQRCodeDataURL(text: string, size: number = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch {
    return ''
  }
}

export function generateBarcodeDataURL(text: string, width: number = 400, height: number = 80): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  try {
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: height - 20,
      displayValue: true,
      fontSize: 14,
      margin: 5,
    })
    return canvas.toDataURL('image/png')
  } catch {
    return ''
  }
}

export function getEntityDetailRoute(entityType: LabelEntityType, entityId: string): { name: string; params?: Record<string, string> } {
  switch (entityType) {
    case 'reagent':
      return { name: 'reagents' }
    case 'batch':
      return { name: 'batches' }
    case 'consumable':
      return { name: 'consumable-detail', params: { id: entityId } }
  }
}

export async function scanCodeFromCamera(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = '请扫描或输入条码/二维码...'
    input.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;max-width:400px;padding:16px;border:2px solid #2563eb;border-radius:12px;font-size:16px;z-index:99999;box-shadow:0 20px 60px rgba(0,0,0,0.3);'
    
    const backdrop = document.createElement('div')
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;'
    
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '取消'
    closeBtn.style.cssText = 'position:fixed;top:calc(50% + 60px);left:50%;transform:translateX(-50%);padding:10px 24px;background:#f3f4f6;border-radius:8px;z-index:99999;cursor:pointer;'
    
    const confirmBtn = document.createElement('button')
    confirmBtn.textContent = '确认'
    confirmBtn.style.cssText = 'position:fixed;top:calc(50% + 60px);left:calc(50% + 90px);padding:10px 24px;background:#2563eb;color:white;border-radius:8px;z-index:99999;cursor:pointer;'
    
    const cleanup = () => {
      document.body.removeChild(input)
      document.body.removeChild(backdrop)
      document.body.removeChild(closeBtn)
      document.body.removeChild(confirmBtn)
    }
    
    closeBtn.onclick = () => {
      cleanup()
      resolve(null)
    }
    
    confirmBtn.onclick = () => {
      const val = input.value
      cleanup()
      resolve(val || null)
    }
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = (e.target as HTMLInputElement).value
        cleanup()
        resolve(val || null)
      }
      if (e.key === 'Escape') {
        cleanup()
        resolve(null)
      }
    })
    
    document.body.appendChild(backdrop)
    document.body.appendChild(input)
    document.body.appendChild(closeBtn)
    document.body.appendChild(confirmBtn)
    
    setTimeout(() => {
      input.focus()
    }, 100)
  })
}
