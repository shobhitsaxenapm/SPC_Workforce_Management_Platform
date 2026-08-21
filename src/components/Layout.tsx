import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Building2, 
  ClipboardList, 
  CalendarDays, 
  FileText, 
  Settings,
  ShieldAlert,
  Bell,
  Search,
  CheckSquare,
  UserCheck,
  MapPin,
  Clock,
  CreditCard,
  LogOut,
  LineChart,
  ChevronDown,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import RequirementQuickViewModal from './RequirementQuickViewModal';
import ClientQuickViewModal from './ClientQuickViewModal';
import JobQuickViewModal from './JobQuickViewModal';
import CandidateQuickViewModal from './CandidateQuickViewModal';

// --- Navigation Configuration ---
type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
};

type NavModuleConfig = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  requiredRole?: 'ADMIN' | 'MANAGER' | 'RECRUITER';
};

const navigationConfig: NavModuleConfig[] = [
  {
    id: 'recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    items: [
      { title: 'Dashboard', path: '/', icon: LayoutGrid },
      { title: 'Clients', path: '/clients', icon: Building2 },
      { title: 'Client Requirements', path: '/requirements', icon: ClipboardList },
      { title: 'Jobs', path: '/job-desk', icon: Briefcase },
      { title: 'Candidates', path: '/candidates', icon: Users },
      { title: 'Interviews', path: '/interviews', icon: CalendarDays },
      { title: 'Offers', path: '/offers', icon: FileText },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Layers,
    items: [
      { title: 'Onboarding', path: '/onboarding', icon: CheckSquare },
      { title: 'Employees', path: '/employees', icon: UserCheck },
      { title: 'Deployments', path: '/deployments', icon: MapPin },
      { title: 'Attendance', path: '/attendance', icon: Clock },
      { title: 'Billing Drafts', path: '/billing', icon: CreditCard },
      { title: 'Offboarding', path: '/offboarding', icon: LogOut },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: LineChart,
    items: [
      { title: 'Reports & Insights', path: '/reports', icon: LineChart },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    requiredRole: 'ADMIN',
    items: [
      { title: 'Users & Roles', path: '/users', icon: ShieldAlert },
      { title: 'Recruitment Settings', path: '/settings', icon: Settings },
    ],
  }
];

// --- Components ---

const NavModule: React.FC<{ 
  module: NavModuleConfig; 
  currentPath: string;
  forceOpen: boolean;
}> = ({ 
  module, 
  currentPath, 
  forceOpen 
}) => {
  const [isExpanded, setIsExpanded] = useState(forceOpen);

  // Auto-expand if a child route becomes active, but don't auto-collapse if user opened it
  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  // Determine if any child is active
  const hasActiveChild = module.items.some(item => 
    item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path + '/'))
  );

  return (
    <div className="mb-2">
      <button
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={`nav-module-${module.id}`}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isExpanded ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          hasActiveChild && !isExpanded ? "bg-blue-50/50 text-blue-900" : ""
        )}
        style={{ width: 'calc(100% - 16px)' }}
      >
        <div className="flex items-center gap-3">
          <module.icon className={cn("w-5 h-5", isExpanded ? "text-blue-600" : "text-slate-500")} aria-hidden="true" />
          <span className="text-sm font-medium">{module.label}</span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200", 
            !isExpanded && "-rotate-90"
          )} 
          aria-hidden="true" 
        />
      </button>

      <div 
        id={`nav-module-${module.id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-0.5 pb-2">
          {module.items.map((item) => {
            const isActive = item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={isExpanded ? 0 : -1}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                )}
                style={{ width: 'calc(100% - 16px)' }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" aria-hidden="true"></span>
                )}
                <div className="w-5 flex justify-center ml-2">
                  <item.icon className={cn("w-4.5 h-4.5", isActive ? "text-blue-600" : "text-slate-400")} aria-hidden="true" />
                </div>
                <span className="text-sm truncate">{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Recruitment Dashboard';
    
    // Search through all modules for the active item title
    for (const mod of navigationConfig) {
      const activeItem = mod.items.find(item => item.path === path || (item.path !== '/' && path.startsWith(item.path + '/')));
      if (activeItem) return activeItem.title;
    }
    return 'SPC Workforce Management';
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
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-20 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-200/60 bg-white">
          <div className="flex items-center gap-2 text-blue-700">
            <Briefcase className="w-6 h-6" />
            <span className="font-bold text-lg leading-tight">
              SPC<br/><span className="text-sm font-medium text-slate-500">Workforce</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {navigationConfig.map((module) => {
            // Role-based filtering for entire module
            if (module.requiredRole && currentUser?.role !== module.requiredRole) {
              return null;
            }
            
            // Check if this module should be expanded based on current route
            const isRouteActive = module.items.some(item => 
              item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
            );

            return (
              <NavModule 
                key={module.id} 
                module={module} 
                currentPath={location.pathname} 
                forceOpen={isRouteActive}
              />
            );
          })}
        </nav>
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
            
            <button className="relative text-slate-500 hover:text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">{currentUser?.name}</span>
                <span className="text-xs text-slate-500">
                  {currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'MANAGER' ? 'Manager' : 'Recruiter'}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-600 transition-colors ml-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1" 
                title="Log Out"
                aria-label="Log out"
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

      <RequirementQuickViewModal />
      <ClientQuickViewModal />
      <JobQuickViewModal />
      <CandidateQuickViewModal />
    </div>
  );
}
