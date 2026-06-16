import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Building2, MapPin, Activity, Search } from 'lucide-react';

interface FacilityStats {
  total_facilities: string;
  states_covered: string;
  org_types: string;
  accepts_volunteers: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}

function StatCard({ icon, label, value, sublabel, color = '#FF3621' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 text-[#0B2026]">{value}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickLink({ to, icon, title, description }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#FF3621]/40 transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-[#FF3621]/10 text-[#FF3621] group-hover:bg-[#FF3621] group-hover:text-white transition-colors">
          {icon}
        </div>
        <h3 className="font-semibold text-[#0B2026]">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export function HomePage() {
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/facilities/stats/summary')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load stats';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2026]">India Healthcare Explorer</h1>
        <p className="text-gray-500 mt-1">
          Virtue Foundation Dataset · DAIS 2026 Hackathon · Powered by Lakebase Synced Tables
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-medium">Synced tables are still initializing</p>
          <p className="text-xs text-amber-600 mt-1">
            Data will be available once the Lakebase sync completes. Check back in a few minutes.
          </p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Total Facilities"
            value={Number(stats.total_facilities).toLocaleString()}
            sublabel="Healthcare facilities"
          />
          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label="States & UTs"
            value={stats.states_covered}
            sublabel="Geographic coverage"
            color="#0B2026"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Organization Types"
            value={stats.org_types}
            sublabel="Facility categories"
            color="#16a34a"
          />
          <StatCard
            icon={<Search className="h-5 w-5" />}
            label="Accept Volunteers"
            value={Number(stats.accepts_volunteers).toLocaleString()}
            sublabel="Open to volunteers"
            color="#7c3aed"
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-[#0B2026] mb-4">Explore the Dataset</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink
            to="/facilities"
            icon={<Building2 className="h-5 w-5" />}
            title="Healthcare Facilities"
            description="Browse and search 10,000+ healthcare facilities across India. Filter by state, city, or organization type."
          />
          <QuickLink
            to="/health-indicators"
            icon={<Activity className="h-5 w-5" />}
            title="Health Indicators"
            description="Explore NFHS-5 district-level health metrics covering 706 districts — child health, nutrition, maternal care."
          />
          <QuickLink
            to="/pincodes"
            icon={<MapPin className="h-5 w-5" />}
            title="Pincode Directory"
            description="Search India's 165,000+ post office locations by pincode, state, or district name."
          />
        </div>
      </div>

      <div className="bg-[#0B2026] rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-[#FF3621]/20">
            <Activity className="h-5 w-5 text-[#FF3621]" />
          </div>
          <div>
            <h3 className="font-semibold">Powered by Lakebase Synced Tables</h3>
            <p className="text-sm text-white/70 mt-1">
              All data is continuously synced from the Unity Catalog Delta tables into Lakebase
              Postgres for sub-10ms reads. Queries run directly against a managed Postgres instance,
              delivering fast, consistent response times for the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
