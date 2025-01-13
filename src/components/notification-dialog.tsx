import { BellOff, X, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications?: {
    id: string
    title: string
    message: string
    timestamp: string
  }[]
}

export function NotificationDialog({
  open,
  onOpenChange,
  notifications = [],
}: NotificationDialogProps) {
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
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] text-muted-foreground">
                <BellOff className="h-12 w-12 mb-4" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col space-y-1 border-b pb-4 last:border-0"
                  >
                    <h4 className="text-sm font-semibold">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {notification.timestamp}
                    </span>
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