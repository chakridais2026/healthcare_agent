import { useEffect, useState, useCallback } from 'react';
import { Activity, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface DistrictRow {
  district_name: string;
  state_ut: string;
  institutional_birth_5y_pct: string;
  child_stunted_pct: string;
  child_wasted_pct: string;
  child_underweight_pct: string;
  women_anaemic_pct: string;
  child_anaemic_pct: string;
  anc_4_visits_pct: string;
  improved_sanitation_pct: string;
  electricity_pct: string;
  women_literate_pct: string;
  modern_contraceptive_pct: string;
  households_surveyed: string;
}

type SortKey = keyof DistrictRow;

function pct(val: string | null | undefined): string {
  if (val === null || val === undefined || val === '' || val === '*') return '—';
  const clean = String(val).replace(/[()]/g, '').trim();
  const n = parseFloat(clean);
  if (isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function pctColor(val: string | null | undefined, reverse = false): string {
  if (val === null || val === undefined || val === '' || val === '*') return '';
  const clean = String(val).replace(/[()]/g, '').trim();
  const n = parseFloat(clean);
  if (isNaN(n)) return '';
  const good = reverse ? n < 25 : n > 75;
  const bad = reverse ? n > 50 : n < 40;
  if (good) return 'text-green-700 font-medium';
  if (bad) return 'text-red-600 font-medium';
  return 'text-amber-700';
}

const COLUMNS: { key: SortKey; label: string; reverse?: boolean }[] = [
  { key: 'district_name', label: 'District' },
  { key: 'state_ut', label: 'State/UT' },
  { key: 'institutional_birth_5y_pct', label: 'Inst. Birth %' },
  { key: 'child_stunted_pct', label: 'Child Stunted', reverse: true },
  { key: 'child_wasted_pct', label: 'Child Wasted', reverse: true },
  { key: 'child_underweight_pct', label: 'Child Underweight', reverse: true },
  { key: 'women_anaemic_pct', label: 'Women Anaemic', reverse: true },
  { key: 'child_anaemic_pct', label: 'Child Anaemic', reverse: true },
  { key: 'anc_4_visits_pct', label: '≥4 ANC Visits' },
  { key: 'improved_sanitation_pct', label: 'Sanitation' },
  { key: 'electricity_pct', label: 'Electricity' },
  { key: 'women_literate_pct', label: 'Women Literate' },
];

export function HealthIndicatorsPage() {
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('state_ut');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch('/api/health-indicators/states')
      .then((r) => r.json())
      .then((s) => setStates(Array.isArray(s) ? s : []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedState) params.set('state', selectedState);
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetch(`/api/health-indicators?${params}`)
      .then((r) => r.json())
      .then((d: { rows: DistrictRow[]; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setRows(d.rows || []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [selectedState, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const an = parseFloat(String(av).replace(/[()]/g, ''));
    const bn = parseFloat(String(bv).replace(/[()]/g, ''));
    const cmp = isNaN(an) || isNaN(bn) ? String(av).localeCompare(String(bv)) : an - bn;
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0B2026]">NFHS-5 Health Indicators</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          District-level health survey data from 706 districts across India
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621]"
          />
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] min-w-[180px]"
        >
          <option value="">All States & UTs</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="text-xs text-gray-400 flex items-center gap-4">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-600" /> Good (&gt;75%)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Needs attention (&lt;40%)</span>
        <span className="text-gray-300">· Values in ( ) have limited sample size</span>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-medium">Data unavailable</p>
          <p className="text-xs text-amber-600 mt-1">Synced table may still be initializing. {error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white rounded border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No districts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#0B2026]">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-3 py-2.5 text-left text-xs font-medium text-white/80 cursor-pointer hover:text-white whitespace-nowrap select-none"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key ? (
                            sortAsc ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronUp className="h-3 w-3 opacity-20" />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((row) => (
                    <tr
                      key={`${row.state_ut}-${row.district_name}`}
                      className="hover:bg-[#F9F7F4] transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-[#0B2026] whitespace-nowrap">
                        {row.district_name ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {row.state_ut ?? '—'}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.institutional_birth_5y_pct)}`}>
                        {pct(row.institutional_birth_5y_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.child_stunted_pct, true)}`}>
                        {pct(row.child_stunted_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.child_wasted_pct, true)}`}>
                        {pct(row.child_wasted_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.child_underweight_pct, true)}`}>
                        {pct(row.child_underweight_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.women_anaemic_pct, true)}`}>
                        {pct(row.women_anaemic_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.child_anaemic_pct, true)}`}>
                        {pct(row.child_anaemic_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.anc_4_visits_pct)}`}>
                        {pct(row.anc_4_visits_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.improved_sanitation_pct)}`}>
                        {pct(row.improved_sanitation_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.electricity_pct)}`}>
                        {pct(row.electricity_pct)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pctColor(row.women_literate_pct)}`}>
                        {pct(row.women_literate_pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {sorted.length} districts · Click column headers to sort
        </p>
      )}
    </div>
  );
}
