import { useEffect, useState, useCallback } from 'react';
import { Building2, MapPin, Phone, Globe, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Facility {
  row_id: string;
  unique_id: string;
  name: string;
  organization_type: string;
  address_city: string;
  address_stateorregion: string;
  address_country: string;
  email: string;
  officialwebsite: string;
  officialphone: string;
  capacity: string;
  numberdoctors: string;
  specialties: string;
  description: string;
  latitude: string;
  longitude: string;
  yearestablished: string;
}

interface FacilitiesResponse {
  total: number;
  rows: Facility[];
}

const PAGE_SIZE = 24;

function FacilityCard({ facility }: { facility: Facility }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#0B2026] text-sm leading-tight truncate" title={facility.name ?? ''}>
            {facility.name || 'Unnamed Facility'}
          </h3>
          {facility.organization_type && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF3621]/10 text-[#FF3621]">
              {facility.organization_type}
            </span>
          )}
        </div>
        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500 shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {[facility.address_city, facility.address_stateorregion].filter(Boolean).join(', ') || 'Location unknown'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {facility.capacity && (
          <span className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
            Capacity: {facility.capacity}
          </span>
        )}
        {facility.numberdoctors && (
          <span className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
            {facility.numberdoctors} doctors
          </span>
        )}
        {facility.yearestablished && (
          <span className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
            Est. {facility.yearestablished}
          </span>
        )}
      </div>

      {facility.description && (
        <div>
          <p className={`text-xs text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>
            {facility.description}
          </p>
          {facility.description.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#FF3621] hover:underline mt-0.5"
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-auto pt-1 border-t border-gray-100">
        {facility.officialphone && (
          <a
            href={`tel:${facility.officialphone}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#FF3621]"
          >
            <Phone className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{facility.officialphone}</span>
          </a>
        )}
        {facility.officialwebsite && (
          <a
            href={facility.officialwebsite.startsWith('http') ? facility.officialwebsite : `https://${facility.officialwebsite}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#FF3621]"
          >
            <Globe className="h-3 w-3" />
            Website
          </a>
        )}
      </div>
    </div>
  );
}

export function FacilitiesPage() {
  const [data, setData] = useState<FacilitiesResponse | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    Promise.all([
      fetch('/api/facilities/states').then((r) => r.json()),
      fetch('/api/facilities/types').then((r) => r.json()),
    ])
      .then(([s, t]) => {
        setStates(Array.isArray(s) ? s : []);
        setOrgTypes(Array.isArray(t) ? t : []);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedState) params.set('state', selectedState);
    if (selectedType) params.set('type', selectedType);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    fetch(`/api/facilities?${params}`)
      .then((r) => r.json())
      .then((d: FacilitiesResponse & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load facilities');
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedState, selectedType, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedState, selectedType]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0B2026]">Healthcare Facilities</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Browse and search facilities from the Virtue Foundation dataset
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621]"
          />
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] min-w-[160px]"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] min-w-[160px]"
        >
          <option value="">All Types</option>
          {orgTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {data.total.toLocaleString()} facilit{data.total === 1 ? 'y' : 'ies'} found
          </span>
          {totalPages > 1 && (
            <span>
              Page {page + 1} of {totalPages}
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-medium">Data unavailable</p>
          <p className="text-xs text-amber-600 mt-1">
            The synced table may still be initializing. {error}
          </p>
        </div>
      )}

      {!loading && data && data.rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No facilities match your filters</p>
        </div>
      )}

      {!loading && data && data.rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.rows.map((f) => (
            <FacilityCard key={f.row_id ?? f.unique_id} facility={f} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#FF3621] hover:text-[#FF3621] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-500 px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#FF3621] hover:text-[#FF3621] transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
