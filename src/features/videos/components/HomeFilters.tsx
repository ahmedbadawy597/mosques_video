import { GOVERNORATES } from '@/constants/governorates'

interface HomeFiltersProps {
  search: string
  governorate: string
  onSearchChange: (value: string) => void
  onGovernorateChange: (value: string) => void
  count: number
  total: number
}

export function HomeFilters({
  search,
  governorate,
  onSearchChange,
  onGovernorateChange,
  count,
  total,
}: HomeFiltersProps) {
  const hasActiveFilters = search.trim().length > 0 || governorate !== ''

  const clearFilters = () => {
    onSearchChange('')
    onGovernorateChange('')
  }

  return (
    <section className="surface-card filters-bar" aria-label="تصفية الفيديوهات">
      <div className="filters-head">
        <div className="filters-head-copy">
          <h3>
            <i className="fa-solid fa-sliders" aria-hidden />
            تصفية النتائج
          </h3>
          <p>
            عرض <strong>{count}</strong> من أصل <strong>{total}</strong> فيديو
          </p>
        </div>

        {hasActiveFilters ? (
          <button type="button" className="filters-clear" onClick={clearFilters}>
            <i className="fa-solid fa-rotate-left" aria-hidden />
            إعادة ضبط
          </button>
        ) : null}
      </div>

      <div className="filters-row">
        <label className="filter-field filter-search">
          <span className="filter-label">بحث</span>
          <span className="search-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="اسم المسجد أو المحافظة..."
              aria-label="بحث سريع عن اسم المسجد أو المحافظة"
            />
          </span>
        </label>

        <label className="filter-field filter-gov">
          <span className="filter-label">المحافظة</span>
          <span className="select-wrap">
            <select
              value={governorate}
              onChange={(e) => onGovernorateChange(e.target.value)}
              aria-label="فلتر حسب المحافظة"
            >
              <option value="">كل المحافظات</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down" aria-hidden />
          </span>
        </label>
      </div>
    </section>
  )
}
