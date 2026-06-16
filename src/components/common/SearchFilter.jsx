import { Search, X, SlidersHorizontal } from 'lucide-react'

const SearchFilter = ({ filters, values, onChange, onClear }) => {
  const hasActiveFilters = Object.values(values).some((v) => v)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3 text-ink/50">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filters.map((filter) => (
          <div key={filter.key} className="relative">
            {filter.type === 'select' ? (
              <select
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="">{filter.placeholder}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <>
                <Search className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={filter.placeholder}
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="input-field pl-9"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchFilter