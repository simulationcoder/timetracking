import { useState } from 'react';
import Layout from '@/components/Layout';
import ApprovalCard from '@/components/ApprovalCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { mockWeeklyTimesheets } from '@/data/mockData';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

const Approvals = () => {
  const [timesheets, setTimesheets] = useState(mockWeeklyTimesheets);
  const [filter, setFilter] = useState('all');

  const handleApprove = (id: string) => {
    setTimesheets(prev =>
      prev.map(ts => (ts.id === id ? { ...ts, status: 'approved' as const } : ts))
    );
    toast.success('Timesheet approved successfully');
  };

  const handleReject = (id: string) => {
    setTimesheets(prev =>
      prev.map(ts => (ts.id === id ? { ...ts, status: 'rejected' as const } : ts))
    );
    toast.error('Timesheet rejected');
  };

  const filteredTimesheets = timesheets.filter(ts => {
    if (filter === 'all') return true;
    return ts.status === filter;
  });

  return (
    <Layout userRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Timesheet Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and approve team member timesheets</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  className="pl-10"
                />
              </div>
              <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="submitted">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTimesheets.map(timesheet => (
            <ApprovalCard
              key={timesheet.id}
              timesheet={timesheet}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>

        {filteredTimesheets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No timesheets found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Approvals;
