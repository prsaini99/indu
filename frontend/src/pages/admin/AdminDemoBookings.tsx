import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { displayTime } from "@/lib/utils";
import { adminDemoBookingService, type DemoBooking } from "@/services/demoBooking.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};

const AdminDemoBookings = () => {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminDemoBookingService.list(params);
      setBookings(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demo Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            All scheduled demo sessions ({total} total)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4" /> Demo Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No demo bookings found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent / Child</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Meeting Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {b.demoRequest?.parentName || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b.student ? `${b.student.firstName} ${b.student.lastName}` :
                              b.demoRequest ? `${b.demoRequest.childFirstName} ${b.demoRequest.childLastName}` : "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{b.subject?.name || "—"}</TableCell>
                      <TableCell>{b.tutor ? `${b.tutor.firstName} ${b.tutor.lastName}` : "—"}</TableCell>
                      <TableCell>{b.consultant ? `${b.consultant.firstName} ${b.consultant.lastName}` : "—"}</TableCell>
                      <TableCell>{new Date(b.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">
                        {displayTime(b.scheduledStart, b.tutor?.user?.timezone || "Asia/Kolkata")} – {displayTime(b.scheduledEnd, b.tutor?.user?.timezone || "Asia/Kolkata")}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[b.status] || "bg-gray-100 text-gray-600"}>
                          {b.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {b.meetingLink ? (
                          <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-sm">
                            Join
                          </a>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDemoBookings;
