export interface CsvColumn<T> {
  key: keyof T | string
  label: string
  formatter?: (value: any, row: T) => string
}

export function exportToCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string = 'export.csv'
): void {
  const headers = columns.map((c) => c.label)
  const rows = data.map((row) =>
    columns.map((col) => {
      const key = col.key as keyof T
      const value = row[key]
      const cellValue = col.formatter ? col.formatter(value, row) : String(value ?? '')
      const escaped = cellValue.replace(/"/g, '""')
      return `"${escaped}"`
    })
  )

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
