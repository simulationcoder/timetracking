import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockProjects } from '@/data/mockData';
import { Plus, Save, Send } from 'lucide-react';

interface DayEntry {
  hours: number;
  projectId: string;
  task: string;
}

const TimesheetGrid = () => {
  const weekDays = ['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24', 'Fri 25', 'Sat 26', 'Sun 27'];
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});

  const getTotalForDay = (day: string) => {
    return Object.entries(entries)
      .filter(([key]) => key.startsWith(day))
      .reduce((sum, [, entry]) => sum + (entry.hours || 0), 0);
  };

  const getTotalHours = () => {
    return Object.values(entries).reduce((sum, entry) => sum + (entry.hours || 0), 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Weekly Timesheet</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">October 21-27, 2025</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-sm">Project</th>
                <th className="text-left p-3 font-medium text-sm">Task</th>
                {weekDays.map(day => (
                  <th key={day} className="text-center p-3 font-medium text-sm w-24">
                    {day}
                  </th>
                ))}
                <th className="text-center p-3 font-medium text-sm w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map(rowIndex => (
                <tr key={rowIndex} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.code} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Input placeholder="Task description" className="w-full" />
                  </td>
                  {weekDays.map(day => (
                    <td key={day} className="p-3">
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="0"
                        className="w-20 text-center"
                      />
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="text-center font-semibold">0.0</div>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td colSpan={2} className="p-3">Daily Total</td>
                {weekDays.map(day => (
                  <td key={day} className="p-3 text-center">
                    {getTotalForDay(day).toFixed(1)}
                  </td>
                ))}
                <td className="p-3 text-center text-primary">
                  {getTotalHours().toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {weekDays.map(day => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Task description" />
                <Input type="number" min="0" max="24" step="0.5" placeholder="Hours" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Hours This Week</p>
            <p className="text-2xl font-bold text-primary">{getTotalHours().toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetGrid;
