import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  CreditCard,
  Users,
  Clock,
  DollarSign,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationService, type Notification } from "@/services/notification.service";

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  ENROLLMENT_CREATED: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100", label: "Enrollment" },
  SESSION_REMINDER: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100", label: "Reminder" },
  PAYMENT_CONFIRMED: { icon: CreditCard, color: "text-green-600", bg: "bg-green-100", label: "Payment" },
  BATCH_JOINED: { icon: Users, color: "text-purple-600", bg: "bg-purple-100", label: "Batch" },
  PAYOUT_RECORDED: { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100", label: "Payout" },
};

const AdminNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationService.getMyNotifications({ page, limit: 20 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch {
      toast({ title: "Error", description: "Failed to load notifications.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const filtered = useMemo(() => {
    let items = notifications;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    if (filterType) {
      items = items.filter((n) => n.type === filterType);
    }
    return items;
  }, [notifications, search, filterType]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast({ title: "Error", description: "Failed to mark as read.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({ title: "Done", description: "All notifications marked as read." });
    } catch {
      toast({ title: "Error", description: "Failed to mark all as read.", variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const n of notifications) byType[n.type] = (byType[n.type] || 0) + 1;
    return byType;
  }, [notifications]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">System notifications and alerts</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className={`cursor-pointer transition-all ${!filterType ? "ring-2 ring-indigo-500" : "hover:shadow-md"}`} onClick={() => setFilterType("")}>
          <CardContent className="p-4 text-center">
            <Bell className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filterType === "ENROLLMENT_CREATED" ? "ring-2 ring-blue-500" : "hover:shadow-md"}`} onClick={() => setFilterType(filterType === "ENROLLMENT_CREATED" ? "" : "ENROLLMENT_CREATED")}>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.ENROLLMENT_CREATED || 0}</p>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filterType === "PAYMENT_CONFIRMED" ? "ring-2 ring-green-500" : "hover:shadow-md"}`} onClick={() => setFilterType(filterType === "PAYMENT_CONFIRMED" ? "" : "PAYMENT_CONFIRMED")}>
          <CardContent className="p-4 text-center">
            <CreditCard className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.PAYMENT_CONFIRMED || 0}</p>
            <p className="text-xs text-muted-foreground">Payments</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filterType === "SESSION_REMINDER" ? "ring-2 ring-amber-500" : "hover:shadow-md"}`} onClick={() => setFilterType(filterType === "SESSION_REMINDER" ? "" : "SESSION_REMINDER")}>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.SESSION_REMINDER || 0}</p>
            <p className="text-xs text-muted-foreground">Reminders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search || filterType ? "No notifications match your filters." : "No notifications yet."}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((n) => {
                const config = typeConfig[n.type] || { icon: Bell, color: "text-gray-600", bg: "bg-gray-100", label: n.type };
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? "bg-indigo-50/50" : ""}`}
                    onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  >
                    <div className={`p-2 rounded-full ${config.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                        <Badge className={`text-[10px] ${config.bg} ${config.color}`}>{config.label}</Badge>
                        {!n.isRead && <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                        {n.emailSent && (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Email sent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
