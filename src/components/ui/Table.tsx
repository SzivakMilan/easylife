import type { CSSProperties, ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  title?: string
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function Table<T>({ title, columns, rows, rowKey, onRowClick }: TableProps<T>) {
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `1.6fr repeat(${columns.length - 1}, auto)`,
  }

  return (
    <div>
      {title && <h3 className="mb-3 text-center text-[15px] font-semibold text-white">{title}</h3>}
      <div className="grid gap-x-3 text-[13px] [font-variant-numeric:tabular-nums]" style={gridStyle}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={`pb-2 text-white/40 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
          >
            {col.header}
          </div>
        ))}
        {rows.map((row) => (
          <RowCells key={rowKey(row)} row={row} columns={columns} onClick={onRowClick ? () => onRowClick(row) : undefined} />
        ))}
      </div>
    </div>
  )
}

function RowCells<T>({
  row,
  columns,
  onClick,
}: {
  row: T
  columns: TableColumn<T>[]
  onClick?: () => void
}) {
  return (
    <div style={{ display: 'contents' }} onClick={onClick}>
      {columns.map((col) => (
        <div
          key={col.key}
          className={`border-t border-white/10 py-2.5 ${col.align === 'right' ? 'text-right' : 'text-left'} ${
            onClick ? 'cursor-pointer active:bg-white/5' : ''
          }`}
        >
          {col.render(row)}
        </div>
      ))}
    </div>
  )
}
