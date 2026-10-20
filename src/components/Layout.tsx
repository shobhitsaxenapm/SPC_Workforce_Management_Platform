import React, { useState, useEffect, useRef } from 'react';
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
  LayoutGrid, 
  Menu, 
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import ProjectQuickViewModal from './ProjectQuickViewModal';
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
  isComingSoon?: boolean;
  defaultOpen?: boolean;
};

const navigationConfig: NavModuleConfig[] = [
  {
    id: 'recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    defaultOpen: true,
    items: [
      { title: 'Clients', path: '/clients', icon: Building2 },
      // { title: 'Projects', path: '/projects', icon: ClipboardList }, // Temporarily disabled
      { title: 'Jobs', path: '/job-desk', icon: Briefcase },
      { title: 'Candidates', path: '/candidates', icon: Users },
      { title: 'Interviews', path: '/interviews', icon: CalendarDays },
      { title: 'Offers', path: '/offers', icon: FileText },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: LineChart,
    defaultOpen: true,
    items: [
      { title: 'Dashboard', path: '/', icon: LayoutGrid },
    ],
  },
  {
    id: 'operations',
    label: 'Operation - WFM',
    icon: Layers,
    isComingSoon: true,
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
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    isComingSoon: true,
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
  const [isExpanded, setIsExpanded] = useState((forceOpen || !!module.defaultOpen) && !module.isComingSoon);

  // Auto-expand if a child route becomes active, but don't auto-collapse if user opened it
  useEffect(() => {
    if (forceOpen && !module.isComingSoon) {
      setIsExpanded(true);
    }
  }, [forceOpen, module.isComingSoon]);

  const toggleExpand = () => {
    if (module.isComingSoon) return;
    setIsExpanded(!isExpanded);
  };
  
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
        disabled={module.isComingSoon}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          module.isComingSoon
            ? "text-slate-400 cursor-not-allowed hover:bg-slate-50/50"
            : isExpanded ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          hasActiveChild && !isExpanded ? "bg-blue-50/50 text-blue-900" : ""
        )}
        style={{ width: 'calc(100% - 16px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <module.icon className={cn("w-5 h-5 shrink-0", module.isComingSoon ? "text-slate-400" : isExpanded ? "text-blue-600" : "text-slate-500")} aria-hidden="true" />
          <span className="text-sm font-medium truncate">{module.label}</span>
        </div>
        {module.isComingSoon ? (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
            Coming Soon
          </span>
        ) : (
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", 
              !isExpanded && "-rotate-90"
            )} 
            aria-hidden="true" 
          />
        )}
      </button>

      {!module.isComingSoon && (
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
    )}
  </div>
);
}

export default function Layout() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stretchable & Collapsible & Movable sidebar states
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('spc_sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : 260;
      return isNaN(parsed) ? 260 : Math.min(Math.max(parsed, 200), 500);
    } catch {
      return 260;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(() => {
    try {
      return (localStorage.getItem('spc_sidebar_position') as 'left' | 'right') || 'left';
    } catch {
      return 'left';
    }
  });

  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const sidebarPositionRef = useRef(sidebarPosition);
  sidebarPositionRef.current = sidebarPosition;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed(prev => {
          const next = !prev;
          try {
            localStorage.setItem('spc_sidebar_collapsed', String(next));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('spc_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const togglePosition = () => {
    setSidebarPosition(prev => {
      const next = prev === 'left' ? 'right' : 'left';
      try {
        localStorage.setItem('spc_sidebar_position', next);
      } catch {}
      return next;
    });
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;
      let newWidth: number;
      if (sidebarPositionRef.current === 'left') {
        newWidth = event.clientX;
      } else {
        newWidth = window.innerWidth - event.clientX;
      }

      if (newWidth < 140) {
        setIsCollapsed(true);
        try {
          localStorage.setItem('spc_sidebar_collapsed', 'true');
        } catch {}
      } else {
        setIsCollapsed(false);
        try {
          localStorage.setItem('spc_sidebar_collapsed', 'false');
        } catch {}
        const clampedWidth = Math.min(Math.max(newWidth, 200), 500);
        setSidebarWidth(clampedWidth);
        try {
          localStorage.setItem('spc_sidebar_width', clampedWidth.toString());
        } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    
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
    <div className="min-h-screen bg-[#F6F8FB] flex relative">
      {/* Transparent drag protection overlay */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 cursor-col-resize select-none"
          style={{ cursor: 'col-resize' }}
        />
      )}

      {/* Edge Tab button when collapsed on desktop for instant 1-click reveal */}
      {isCollapsed && isDesktop && (
        <button
          onClick={toggleCollapse}
          className={cn(
            "fixed top-20 z-40 bg-white border border-slate-200 shadow-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-500 py-2.5 px-1.5 transition-all flex items-center justify-center group outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            sidebarPosition === 'left' ? "left-0 rounded-r-lg border-l-0" : "right-0 rounded-l-lg border-r-0"
          )}
          title="Expand sidebar (Ctrl+B)"
          aria-label="Expand sidebar"
        >
          {sidebarPosition === 'left' ? (
            <ChevronsRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronsLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{
          width: isDesktop ? `${sidebarWidth}px` : undefined,
        }}
        className={cn(
          "bg-white flex flex-col fixed inset-y-0 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)]",
          !isDesktop && "w-64",
          sidebarPosition === 'left' 
            ? "left-0 border-r border-slate-200" 
            : "right-0 border-l border-slate-200",
          isDragging ? "transition-none select-none" : "transition-transform duration-300 ease-in-out",
          // Mobile state
          isMobileMenuOpen 
            ? "translate-x-0" 
            : (sidebarPosition === 'left' ? "-translate-x-full" : "translate-x-full"),
          // Desktop collapsed state
          "md:translate-x-0",
          isCollapsed && (sidebarPosition === 'left' ? "md:-translate-x-full" : "md:translate-x-full")
        )}
      >
        {/* Resize handle (Stretchable / Resizable bar) */}
        {isDesktop && (
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute top-0 w-3.5 h-full cursor-col-resize flex items-center justify-center group z-40 select-none hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors",
              sidebarPosition === 'left' ? "-right-2" : "-left-2"
            )}
            title="Drag to stretch/shrink sidebar width (Double-click to reset)"
            onDoubleClick={() => {
              setSidebarWidth(260);
              try {
                localStorage.setItem('spc_sidebar_width', '260');
              } catch {}
            }}
          >
            <div className={cn(
              "w-1 h-8 rounded-full bg-slate-300 group-hover:bg-blue-500 group-hover:h-20 transition-all duration-150",
              isDragging && "bg-blue-600 h-full w-1.5"
            )} />
          </div>
        )}

        <div className="h-16 flex items-center justify-between px-4 md:px-5 border-b border-slate-200/60 bg-white">
          <div className="flex items-center gap-2.5 text-blue-700 min-w-0">
            <Briefcase className="w-6 h-6 shrink-0" />
            <span className="font-bold text-lg leading-tight truncate">
              SPC<br/><span className="text-sm font-medium text-slate-500">Workforce</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Move position toggle button (Dock Left vs Dock Right) */}
            <button
              onClick={togglePosition}
              className="hidden md:inline-flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={sidebarPosition === 'left' ? "Move sidebar to right" : "Move sidebar to left"}
              aria-label="Move sidebar position"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* Collapse toggle button */}
            <button
              onClick={toggleCollapse}
              className="hidden md:inline-flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              {sidebarPosition === 'left' ? (
                <PanelLeftClose className="w-4.5 h-4.5" />
              ) : (
                <PanelRightClose className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Mobile close button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
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
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0",
          isDragging ? "transition-none" : "transition-[margin] duration-300 ease-in-out"
        )}
        style={{
          marginLeft: isDesktop && sidebarPosition === 'left' && !isCollapsed ? `${sidebarWidth}px` : '0px',
          marginRight: isDesktop && sidebarPosition === 'right' && !isCollapsed ? `${sidebarWidth}px` : '0px',
        }}
      >
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop toggle button if sidebar is on left */}
            {sidebarPosition === 'left' && (
              <button
                onClick={toggleCollapse}
                className={cn(
                  "hidden md:inline-flex items-center gap-2 p-2 -ml-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isCollapsed 
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs px-2.5 py-1.5" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
                title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-4.5 h-4.5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">Sidebar</span>
                  </>
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>
            )}

            <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Desktop toggle button if sidebar is on right */}
            {sidebarPosition === 'right' && (
              <button
                onClick={toggleCollapse}
                className={cn(
                  "hidden md:inline-flex items-center gap-2 p-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isCollapsed 
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs px-2.5 py-1.5" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
                title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <>
                    <span className="text-xs font-semibold text-blue-700">Sidebar</span>
                    <PanelRightOpen className="w-4.5 h-4.5 text-blue-600" />
                  </>
                ) : (
                  <PanelRightClose className="w-5 h-5" />
                )}
              </button>
            )}

            <div className="relative hidden md:block">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search candidates, jobs..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-64 transition-all"
              />
            </div>
            
            <button className="md:hidden relative text-slate-500 hover:text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1">
              <Search className="w-5 h-5" />
            </button>

            <button className="relative text-slate-500 hover:text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium text-slate-700">{currentUser?.name}</span>
                <span className="text-xs text-slate-500">
                  {currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'MANAGER' ? 'Manager' : 'Recruiter'}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-600 transition-colors md:ml-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1" 
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ProjectQuickViewModal />
      <ClientQuickViewModal />
      <JobQuickViewModal />
      <CandidateQuickViewModal />
    </div>
  );
}
