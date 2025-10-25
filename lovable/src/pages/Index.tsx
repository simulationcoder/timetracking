import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, AlertCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import { UserRole } from '@/types/timesheet';
import { mockTimeEntries, mockProjects } from '@/data/mockData';

const Index = () => {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'submitted':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Layout userRole={userRole}>
      <div className="space-y-8">
        {/* Role Selector - Demo purposes */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Demo Mode</h2>
                <p className="text-sm text-muted-foreground">Switch between user roles to explore different views</p>
              </div>
              <Select value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee View</SelectItem>
                  <SelectItem value="manager">Manager View</SelectItem>
                  <SelectItem value="admin">Admin View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Hours This Week"
            value="32.5"
            icon={Clock}
            trend={{ value: '+5.2 from last week', positive: true }}
          />
          <StatsCard
            title="Approved Entries"
            value="12"
            icon={CheckCircle}
            subtitle="This month"
          />
          <StatsCard
            title="Pending Approval"
            value={userRole === 'manager' || userRole === 'admin' ? '8' : '3'}
            icon={AlertCircle}
            subtitle="Requires action"
          />
          {(userRole === 'manager' || userRole === 'admin') && (
            <StatsCard
              title="Team Members"
              value="24"
              icon={Users}
              trend={{ value: '+2 this month', positive: true }}
            />
          )}
          {userRole === 'employee' && (
            <StatsCard
              title="Projects Active"
              value="5"
              icon={TrendingUp}
              subtitle="Currently assigned"
            />
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userRole === 'employee' && (
                <>
                  <Button className="w-full justify-start" onClick={() => navigate('/timesheet')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Enter Today's Time
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Weekly Timesheet
                  </Button>
                </>
              )}
              {(userRole === 'manager' || userRole === 'admin') && (
                <>
                  <Button className="w-full justify-start" onClick={() => navigate('/approvals')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Review Pending Timesheets
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Team Reports
                  </Button>
                </>
              )}
              {userRole === 'admin' && (
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/team')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Analytics
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeEntries.slice(0, 4).map((entry) => {
                  const project = mockProjects.find(p => p.id === entry.projectId);
                  return (
                    <div key={entry.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project?.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.taskDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{entry.hours}h</span>
                        <Badge variant={getStatusColor(entry.status) as any} className="text-xs">
                          {entry.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
