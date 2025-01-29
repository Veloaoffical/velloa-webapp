import { toast } from "sonner";

interface TaskBasicInfo {
  subject: string | null;
  description: string | null;
}

interface TaskProperties {
  status: string;
  priority: string;
}

interface TaskScheduling {
  taskType: 'one_time' | 'recurring';
  dueDate: Date | null;
  frequency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  repeatInfinite?: boolean;
}

interface Location {
  property_id: string | null;
  unit_id: string | null;
}

interface Assignees {
  assignees: string | null;
  notify_assignee: boolean;
  vendor_id: string | null;
  notify_vendor: boolean;
}

export const taskSettingsApi = {
  // Fetch task data
  fetchTaskData: async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching task:', errorData.error);
        return null;
      }

      const data = await response.json();
      console.log('Fetched task data:', data);
      
      const taskType = data.task_type || 'one_time';
      const isRecurring = taskType === 'recurring';

      return {
        role: data.role || null,
        basicInfo: {
          subject: data.subject || '',
          description: data.description || ''
        },
        taskProperties: {
          status: data.status || '',
          priority: data.priority || ''
        },
        scheduling: {
          taskType: taskType,
          dueDate: !isRecurring && data.due_date ? new Date(data.due_date) : null,
          frequency: isRecurring ? data.Recurring_frequency : undefined,
          startDate: isRecurring && data.start_date ? new Date(data.start_date) : null,
          endDate: isRecurring && data.due_date ? new Date(data.due_date) : null,
          repeatInfinite: isRecurring ? data.repeat_infinite || false : false
        },
        location: {
          property_id: data.property_id || null,
          unit_id: data.unit_id || null
        },
        assignees: {
          assignees: data.assignees,
          notify_assignee: data.notify_assignee || false,
          vendor_id: data.vendor_id || null,
          notify_vendor: data.notify_vendor || false
        }
      };
    } catch (error) {
      console.error('Unexpected error in fetchTaskData:', error);
      return null;
    }
  },

  // Fetch properties
  fetchProperties: async () => {
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  },

  // Fetch units
  fetchUnits: async (propertyId: string) => {
    try {
      const response = await fetch(`/api/property/${propertyId}/units`);
      if (!response.ok) {
        throw new Error('Failed to fetch units');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    }
  },

  // Fetch company members
  fetchCompanyMembers: async () => {
    try {
      const response = await fetch('/api/company/members');
      if (!response.ok) {
        throw new Error('Failed to fetch company members');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching company members:', error);
      return [];
    }
  },

  // Fetch vendors
  fetchVendors: async () => {
    try {
      const response = await fetch('/api/people/vendor/search', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        console.error('Authentication error - redirecting to login');
        window.location.href = '/login';
        return [];
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch vendors: ${response.status} - ${errorData.error}`);
      }
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors. Please try refreshing the page.');
      return [];
    }
  },

  // Update basic info
  updateBasicInfo: async (id: string, basicInfo: TaskBasicInfo) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: basicInfo.subject,
          description: basicInfo.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task:', errorData.error);
        toast.error('Failed to save changes');
        return false;
      }
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating task:', error);
      toast.error('Failed to save changes');
      return false;
    }
  },

  // Update properties
  updateProperties: async (id: string, properties: TaskProperties) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: properties.status,
          priority: properties.priority
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task properties:', errorData.error);
        toast.error('Failed to save changes');
        return false;
      }
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating task properties:', error);
      toast.error('Failed to save changes');
      return false;
    }
  },

  // Update scheduling
  updateScheduling: async (id: string, scheduling: TaskScheduling) => {
    try {
      const isRecurring = scheduling.taskType === 'recurring';
      
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: scheduling.taskType,
          due_date: !isRecurring && scheduling.dueDate ? scheduling.dueDate.toISOString() : null,
          Recurring_frequency: isRecurring ? scheduling.frequency : null,
          start_date: isRecurring && scheduling.startDate ? scheduling.startDate.toISOString() : null,
          repeat_infinite: isRecurring ? scheduling.repeatInfinite : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task scheduling:', errorData.error);
        toast.error('Failed to save changes');
        return false;
      }
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating task scheduling:', error);
      toast.error('Failed to save changes');
      return false;
    }
  },

  // Update location
  updateLocation: async (id: string, location: Location) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: location.property_id,
          unit_id: location.unit_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task location:', errorData.error);
        toast.error('Failed to save changes');
        return false;
      }
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating task location:', error);
      toast.error('Failed to save changes');
      return false;
    }
  },

  // Update assignees
  updateAssignees: async (id: string, assignees: Assignees) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignees: assignees.assignees,
          notify_assignee: assignees.notify_assignee,
          vendor_id: assignees.vendor_id,
          notify_vendor: assignees.notify_vendor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task assignees:', errorData.error);
        toast.error('Failed to save changes');
        return false;
      }
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating task assignees:', error);
      toast.error('Failed to save changes');
      return false;
    }
  },

  // Archive task
  archiveTask: async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'archived'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error archiving task:', errorData.error);
        toast.error('Failed to archive task');
        return false;
      }
      toast.success('Task archived successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error archiving task:', error);
      toast.error('Failed to archive task');
      return false;
    }
  }
}; 
