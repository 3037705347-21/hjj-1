export type LabelEntityType = 'reagent' | 'batch' | 'consumable'

export interface LabelData {
  entityType: LabelEntityType
  entityId: string
  code: string
  name: string
  batchNumber?: string
  specification: string
  expiryDate?: string
  location?: string
  manufacturer?: string
  unit?: string
  quantity?: number
  storageCondition?: string
}

export interface PrintConfig {
  labelSize: '40x30' | '60x40' | '80x50'
  codeType: 'barcode' | 'qrcode'
  copies: number
}
