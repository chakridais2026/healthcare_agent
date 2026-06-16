import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@databricks/appkit-ui/react';
import { Menu, HeartPulse } from 'lucide-react';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { HealthIndicatorsPage } from './pages/HealthIndicatorsPage';
import { PincodeLookupPage } from './pages/PincodeLookupPage';
import { HomePage } from './pages/HomePage';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/facilities', label: 'Facilities' },
  { to: '/health-indicators', label: 'Health Indicators' },
  { to: '/pincodes', label: 'Pincode Lookup' },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#FF3621] text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <header className="bg-[#0B2026] text-white px-4 md:px-6 py-3 flex items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-[#FF3621]" />
          <span className="font-semibold text-sm md:text-base whitespace-nowrap">
            India Healthcare Explorer
          </span>
        </div>
        <nav className="hidden md:flex gap-1 ml-4">
          <NavLinks />
        </nav>
        <div className="ml-auto md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-[#FF3621]" />
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4">
                <NavLinks onClick={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <span className="text-xs text-white/50">Virtue Foundation Dataset · DAIS 2026</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/facilities', element: <FacilitiesPage /> },
      { path: '/health-indicators', element: <HealthIndicatorsPage /> },
      { path: '/pincodes', element: <PincodeLookupPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
