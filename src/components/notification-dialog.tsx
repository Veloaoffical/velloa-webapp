import { BellOff, X, Bell, ClipboardList, MessageSquare, AlertCircle, MailCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { createClient } from '@/utils/supabase/client'

interface Notification {
  id: string
  created_at: string
  type: string
  message: string
  read: boolean
  subject_id: string
}

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationDialog({
  open,
  onOpenChange,
}: NotificationDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase
        .from("notification")
        .update({ read: true })
        .eq("id", notificationId)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session) throw new Error('Unauthorized')

      const { data, error: notificationsError } = await supabase
        .from("notification")
        .select(`
          id,
          created_at,
          type,
          message,
          read,
          subject_id
        `)
        .eq("recipient_id", session.user.id)
        .order("created_at", { ascending: false })

      if (notificationsError) throw notificationsError
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] outline-none border-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <DialogTitle>Notifications</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[360px]">
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] text-muted-foreground">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] text-muted-foreground">
                <BellOff className="h-12 w-12 mb-4" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-[#1C1C1C] p-2 rounded-lg">
                        {notification.type === 'task' && <ClipboardList className="h-4 w-4 text-emerald-500" />}
                        {notification.type === 'work_order' && <MessageSquare className="h-4 w-4 text-emerald-500" />}
                        {notification.type === 'tenant_task' && <AlertCircle className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">
                          {notification.type}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(notification.created_at), "PPp")}
                      </span>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <MailCheck className="h-4 w-4 text-emerald-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 