import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Building2, 
  ClipboardList, 
  CalendarDays, 
  FileText, 
  Star,
  Settings,
  ShieldAlert,
  Globe,
  Bell,
  Search,
  CheckSquare,
  BadgeCheck,
  UserCheck,
  MapPin,
  Clock,
  CreditCard,
  LogOut,
  LineChart
} from 'lucide-react';
import { cn } from '../lib/utils';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { title: 'Overview', path: '/', icon: Briefcase },
  { title: 'Clients', path: '/clients', icon: Building2 },
  { title: 'Client Requirements', path: '/requirements', icon: ClipboardList },
  { title: 'Jobs', path: '/job-desk', icon: Briefcase },
  { title: 'Candidates', path: '/candidates', icon: Users },
  { title: 'Interviews', path: '/interviews', icon: CalendarDays },
  { title: 'Offers', path: '/offers', icon: FileText },
  { title: 'Talent Pool', path: '/talent-pool', icon: Star },
];

const operationsItems = [
  { title: 'Onboarding', path: '/onboarding', icon: CheckSquare },
  { title: 'Employees', path: '/employees', icon: UserCheck },
  { title: 'Deployments', path: '/deployments', icon: MapPin },
  { title: 'Attendance', path: '/attendance', icon: Clock },
  { title: 'Billing Drafts', path: '/billing', icon: CreditCard },
  { title: 'Offboarding', path: '/offboarding', icon: LogOut },
];

const intelligenceItems = [
  { title: 'Reports & Insights', path: '/reports', icon: LineChart },
];

const websiteItems = [
  { title: 'Careers Page', path: '/careers-page', icon: Globe },
];

const adminItems = [
  { title: 'Users & Roles', path: '/users', icon: ShieldAlert },
  { title: 'Recruitment Settings', path: '/settings', icon: Settings },
];

function NavGroup({ title, items }: { title?: string; items: typeof navItems }) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors mx-2',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Recruitment Overview';
    const activeItem = [...navItems, ...operationsItems, ...intelligenceItems, ...websiteItems, ...adminItems].find(
      (item) => item.path === path || path.startsWith(item.path + '/')
    );
    return activeItem?.title || 'SPC Workforce Management';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('')
    : '??';

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Briefcase className="w-6 h-6" />
            <span className="font-bold text-lg leading-tight">
              SPC<br/><span className="text-sm font-medium text-slate-500">Workforce</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-200">
          <NavGroup title="Recruitment" items={navItems} />
          <NavGroup title="Operations" items={operationsItems} />
          <NavGroup title="Intelligence" items={intelligenceItems} />
          <NavGroup title="Website" items={websiteItems} />
          {currentUser?.role === 'Company Admin' && (
            <NavGroup title="Administration" items={adminItems} />
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search candidates, jobs..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-64 transition-all"
              />
            </div>
            
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">{currentUser?.name}</span>
                <span className="text-xs text-slate-500">{currentUser?.role}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-600 transition-colors ml-2" 
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
