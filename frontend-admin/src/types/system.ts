export type SystemConfigKey =
  | 'lab_name'
  | 'lab_address'
  | 'lab_contact'
  | 'auto_alert'
  | 'alert_before_days'
  | 'low_stock_threshold'
  | 'default_storage'
  | 'approval_required'
  | 'label_template'

export interface SystemConfigItem {
  id: string
  key: SystemConfigKey
  name: string
  value: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  description?: string
  options?: { label: string; value: string }[]
  group: string
  updatedAt: string
  updatedBy: string
}

export interface SystemConfigFormData {
  key: string
  value: string
}

export const configGroups = ['基础信息', '预警设置', '库存设置', '审批设置', '标签设置']

export const defaultSystemConfigs: Omit<SystemConfigItem, 'id' | 'updatedAt' | 'updatedBy'>[] = [
  {
    key: 'lab_name',
    name: '实验室名称',
    value: '生物医学实验室',
    type: 'text',
    description: '显示在系统标题和打印标签上的实验室名称',
    group: '基础信息',
  },
  {
    key: 'lab_address',
    name: '实验室地址',
    value: '北京市海淀区中关村大街1号科研楼3层',
    type: 'text',
    description: '实验室的详细物理地址',
    group: '基础信息',
  },
  {
    key: 'lab_contact',
    name: '联系电话',
    value: '010-12345678',
    type: 'text',
    description: '实验室对外联系电话',
    group: '基础信息',
  },
  {
    key: 'auto_alert',
    name: '自动预警检测',
    value: 'true',
    type: 'boolean',
    description: '开启后系统自动检测库存和效期并生成预警',
    group: '预警设置',
  },
  {
    key: 'alert_before_days',
    name: '效期预警提前天数',
    value: '30',
    type: 'number',
    description: '在试剂/耗材到期前多少天开始预警提示',
    group: '预警设置',
  },
  {
    key: 'low_stock_threshold',
    name: '低库存阈值(%)',
    value: '20',
    type: 'number',
    description: '库存占安全库存比例低于该百分比时触发低库存预警',
    group: '预警设置',
  },
  {
    key: 'default_storage',
    name: '默认存储条件',
    value: '常温',
    type: 'select',
    description: '新增试剂/耗材时默认选中的存储条件',
    options: [
      { label: '常温', value: '常温' },
      { label: '2-8°C', value: '2-8°C' },
      { label: '-20°C', value: '-20°C' },
      { label: '-80°C', value: '-80°C' },
      { label: '避光', value: '避光' },
      { label: '无菌', value: '无菌' },
    ],
    group: '库存设置',
  },
  {
    key: 'approval_required',
    name: '关键操作需审批',
    value: 'false',
    type: 'boolean',
    description: '开启后删除、批量出库等关键操作需要管理员审批',
    group: '审批设置',
  },
  {
    key: 'label_template',
    name: '标签模板',
    value: 'standard',
    type: 'select',
    description: '打印试剂/耗材标签时使用的模板样式',
    options: [
      { label: '标准模板', value: 'standard' },
      { label: '简洁模板', value: 'simple' },
      { label: '详细模板', value: 'detailed' },
      { label: '二维码模板', value: 'qr_only' },
    ],
    group: '标签设置',
  },
]
