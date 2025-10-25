import { useState } from 'react';
import Layout from '@/components/Layout';
import TimesheetGrid from '@/components/TimesheetGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Timesheet = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  return (
    <Layout userRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Timesheet</h1>
            <p className="text-muted-foreground mt-1">Track your time across projects and tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-4">
              Week of {currentWeek.toLocaleDateString()}
            </span>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timesheet Grid */}
        <TimesheetGrid />

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Week Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add any notes or comments about this week's time entries..."
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Timesheet;
