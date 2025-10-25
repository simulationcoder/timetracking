import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, LayoutDashboard, Users, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/timesheet';

interface LayoutProps {
  children: ReactNode;
  userRole: UserRole;
}

const Layout = ({ children, userRole }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
    { name: 'Timesheet', href: '/timesheet', icon: Clock, roles: ['employee'] },
    { name: 'Approvals', href: '/approvals', icon: FileText, roles: ['manager', 'admin'] },
    { name: 'Team', href: '/team', icon: Users, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['employee', 'manager', 'admin'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TimeTrack Pro</h1>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Portal</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
