import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  FileSignature, 
  StickyNote, 
  AlarmClockMinus,
  AlarmClock,
  AlarmClockCheck,
  Users,
  CheckSquare
} from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
}

interface TaskOverviewProps {
  taskDetails: Task;
}

export function TaskOverview({ taskDetails }: TaskOverviewProps) {
  const formatStatus = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'complete':
        return 'Complete';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Set';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <AlarmClockMinus className="h-6 w-6 mb-2 text-muted-foreground" />;
      case 'in_progress':
        return <AlarmClock className="h-6 w-6 mb-2 text-muted-foreground" />;
      case 'complete':
        return <AlarmClockCheck className="h-6 w-6 mb-2 text-muted-foreground" />;
      default:
        return <AlarmClockMinus className="h-6 w-6 mb-2 text-muted-foreground" />;
    }
  };

  const getSubtasksIcon = () => {
    return <CheckSquare className="h-6 w-6 mb-2 text-muted-foreground" />;
  };

  const formatAssigneesNames = (assignee: { profile: { first_name: string; last_name: string; }; } | null | undefined) => {
    if (!assignee) return 'Not Assigned';
    return `${assignee.profile.first_name} ${assignee.profile.last_name}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Button className="w-full gap-2">
              <FileSignature className="w-4 h-4" />
              Update Status
            </Button>
            <Button className="w-full gap-2">
              <StickyNote className="w-4 h-4" />
              Add Note
            </Button>
            <Button className="w-full gap-2">
              <ClipboardList className="w-4 h-4" />
              Add Subtask
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {getStatusIcon(taskDetails.status)}
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{formatStatus(taskDetails.status)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {getSubtasksIcon()}
            <p className="text-sm text-muted-foreground">Subtasks</p>
            <p className="font-medium">0 Complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Users className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Assignee</p>
            <p className="font-medium">{formatAssigneesNames(taskDetails.assignee)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <FileSignature className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">
              {taskDetails.due_date ? format(new Date(taskDetails.due_date), 'MMM d, yyyy') : 'Not Set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Description */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {taskDetails.description || 'No description provided'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 