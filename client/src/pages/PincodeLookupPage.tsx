import { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Info } from 'lucide-react';

interface PincodeRow {
  pincode: string;
  officename: string;
  officetype: string;
  delivery: string;
  district: string;
  statename: string;
  circlename: string;
  regionname: string;
  divisionname: string;
  latitude: string;
  longitude: string;
}

interface PincodeResponse {
  total: number;
  rows: PincodeRow[];
}

export function PincodeLookupPage() {
  const [data, setData] = useState<PincodeResponse | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pincode, setPincode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [district, setDistrict] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [debouncedPincode, setDebouncedPincode] = useState('');
  const [debouncedDistrict, setDebouncedDistrict] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPincode(pincode), 400);
    return () => clearTimeout(t);
  }, [pincode]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDistrict(district), 400);
    return () => clearTimeout(t);
  }, [district]);

  useEffect(() => {
    fetch('/api/pincodes/states')
      .then((r) => r.json())
      .then((s) => setStates(Array.isArray(s) ? s : []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    if (!debouncedPincode && !selectedState && !debouncedDistrict) {
      setData(null);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (debouncedPincode) params.set('pincode', debouncedPincode);
    if (selectedState) params.set('state', selectedState);
    if (debouncedDistrict) params.set('district', debouncedDistrict);
    params.set('limit', '100');

    fetch(`/api/pincodes?${params}`)
      .then((r) => r.json())
      .then((d: PincodeResponse & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [debouncedPincode, selectedState, debouncedDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0B2026]">Pincode Directory</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Search India&apos;s 165,000+ post office locations
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pincode (e.g. 110001)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] w-44"
            maxLength={6}
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="District name..."
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621]"
          />
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] min-w-[180px]"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {!hasSearched && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Enter a pincode, district name, or select a state to search the directory.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white rounded border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-medium">Data unavailable</p>
          <p className="text-xs text-amber-600 mt-1">Synced table may still be initializing. {error}</p>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="text-sm text-gray-500">
            {data.total.toLocaleString()} offices found
            {data.total > 100 && ' · Showing first 100 results — narrow your search for more specific results'}
          </div>

          {data.rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No post offices match your search</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#0B2026]">
                      {['Pincode', 'Office Name', 'Type', 'Delivery', 'District', 'State', 'Division'].map((col) => (
                        <th key={col} className="px-3 py-2.5 text-left text-xs font-medium text-white/80 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rows.map((row, i) => (
                      <tr
                        key={`${row.pincode}-${row.officename}-${i}`}
                        className="hover:bg-[#F9F7F4] transition-colors"
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-[#FF3621]">
                          {row.pincode}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#0B2026] whitespace-nowrap">
                          {row.officename}
                        </td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                            row.officetype === 'H.O' ? 'bg-[#FF3621]/10 text-[#FF3621]' :
                            row.officetype === 'S.O' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {row.officetype || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                            row.delivery === 'Delivery' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {row.delivery || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.district || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.statename || '—'}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.divisionname || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
