import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp, Award } from 'lucide-react';

const Team = () => {
  const teamMembers = [
    { id: '1', name: 'John Doe', role: 'Senior Developer', hoursThisWeek: 38, status: 'active' },
    { id: '2', name: 'Jane Smith', role: 'UX Designer', hoursThisWeek: 40, status: 'active' },
    { id: '3', name: 'Mike Johnson', role: 'Project Manager', hoursThisWeek: 35, status: 'active' },
    { id: '4', name: 'Sarah Williams', role: 'Developer', hoursThisWeek: 42, status: 'active' },
    { id: '5', name: 'Tom Brown', role: 'QA Engineer', hoursThisWeek: 32, status: 'on-leave' },
  ];

  return (
    <Layout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">Monitor team productivity and time tracking</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Team Members"
            value="24"
            icon={Users}
            trend={{ value: '+2 this month', positive: true }}
          />
          <StatsCard
            title="Total Hours This Week"
            value="856"
            icon={Clock}
            subtitle="Across all projects"
          />
          <StatsCard
            title="Average Hours/Person"
            value="35.7"
            icon={TrendingUp}
            trend={{ value: '+3.2 from last week', positive: true }}
          />
          <StatsCard
            title="Top Performer"
            value="Jane S."
            icon={Award}
            subtitle="42h this week"
          />
        </div>

        {/* Team Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-center p-4 font-medium">Hours This Week</th>
                    <th className="text-center p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{member.role}</td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-lg">{member.hoursThisWeek}h</span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Team;
