import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeeklyTimesheet } from '@/types/timesheet';
import { Check, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
  timesheet: WeeklyTimesheet;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const ApprovalCard = ({ timesheet, onApprove, onReject }: ApprovalCardProps) => {
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
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{timesheet.employeeName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Week: {new Date(timesheet.weekStartDate).toLocaleDateString()} - {new Date(timesheet.weekEndDate).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusColor(timesheet.status) as any}>
            {timesheet.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Hours</span>
            <span className="text-2xl font-bold text-primary">{timesheet.totalHours}</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Projects</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(timesheet.entries.map(e => e.projectId))).map(projectId => (
                <Badge key={projectId} variant="outline" className="text-xs">
                  Project {projectId}
                </Badge>
              ))}
            </div>
          </div>

          {timesheet.status === 'submitted' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {}}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-success hover:bg-success/10"
                onClick={() => onApprove?.(timesheet.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onReject?.(timesheet.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalCard;
