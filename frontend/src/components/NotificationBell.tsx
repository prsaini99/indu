import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationService, type Notification } from "@/services/notification.service";

const typeIcons: Record<string, string> = {
  ENROLLMENT_CREATED: "📚",
  SESSION_REMINDER: "⏰",
  PAYMENT_CONFIRMED: "💳",
  BATCH_JOINED: "👥",
  PAYOUT_RECORDED: "💰",
};

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll unread count every 60s
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silent — polling shouldn't show errors
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Fetch notifications when dropdown opens
  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      try {
        const result = await notificationService.getMyNotifications({ limit: 8 });
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 h-auto p-0" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-indigo-50/50" : ""}`}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              >
                <span className="text-lg mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
