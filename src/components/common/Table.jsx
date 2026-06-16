import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { classNames } from '../../utils/helpers'

const Table = ({ columns, data, sortBy, sortOrder, onSort, renderRow, emptyMessage = 'No records found' }) => {
  const handleSort = (key, sortable) => {
    if (!sortable || !onSort) return
    if (sortBy === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(key, 'asc')
    }
  }

  const SortIcon = ({ colKey, sortable }) => {
    if (!sortable) return null
    if (sortBy !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-ink/25" />
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
      : <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={classNames(
                    'text-left px-4 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide whitespace-nowrap',
                    col.sortable && 'cursor-pointer hover:text-ink/90 select-none'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon colKey={col.key} sortable={col.sortable} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-12 text-ink/40 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => renderRow(row))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table