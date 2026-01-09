'use client'

import { X, Filter } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
}

interface AdvancedFiltersProps {
  filters: {
    status?: string
    cargo?: string
    dataInicio?: string
    dataFim?: string
    [key: string]: any
  }
  onFilterChange: (filters: any) => void
  onClear: () => void
  statusOptions?: FilterOption[]
  cargoOptions?: FilterOption[]
  showStatus?: boolean
  showCargo?: boolean
  showDateRange?: boolean
  children?: React.ReactNode
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  onClear,
  statusOptions = [],
  cargoOptions = [],
  showStatus = true,
  showCargo = true,
  showDateRange = true,
  children,
}: AdvancedFiltersProps) {
  const hasActiveFilters =
    filters.status ||
    filters.cargo ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.statusPagamento ||
    filters.valorMin ||
    filters.valorMax

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="text-primary-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <X size={16} />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {showStatus && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCargo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            <select
              value={filters.cargo || ''}
              onChange={(e) => onFilterChange({ ...filters, cargo: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {cargoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDateRange && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, dataInicio: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, dataFim: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {statusOptions.find((o) => o.value === filters.status)?.label}
              <button
                onClick={() => onFilterChange({ ...filters, status: undefined })}
                className="ml-2 hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.cargo && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Cargo: {cargoOptions.find((o) => o.value === filters.cargo)?.label}
              <button
                onClick={() => onFilterChange({ ...filters, cargo: undefined })}
                className="ml-2 hover:text-green-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.dataInicio && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              De: {new Date(filters.dataInicio).toLocaleDateString('pt-BR')}
              <button
                onClick={() => onFilterChange({ ...filters, dataInicio: undefined })}
                className="ml-2 hover:text-purple-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.dataFim && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Até: {new Date(filters.dataFim).toLocaleDateString('pt-BR')}
              <button
                onClick={() => onFilterChange({ ...filters, dataFim: undefined })}
                className="ml-2 hover:text-purple-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
