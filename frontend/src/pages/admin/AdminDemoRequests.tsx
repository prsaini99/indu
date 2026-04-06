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
import { Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { adminDemoRequestService, type DemoRequest } from "@/services/demoRequest.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const AdminDemoRequests = () => {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminDemoRequestService.list(params);
      setRequests(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demo Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            All demo requests across the platform ({total} total)
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
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Demo Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No demo requests found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Preferred Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.parent ? `${r.parent.firstName} ${r.parent.lastName}` : r.parentName}
                      </TableCell>
                      <TableCell>{r.childFirstName} {r.childLastName}</TableCell>
                      <TableCell>{r.grade?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.subjects?.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(r.preferredDate).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{r.preferredTimeSlot?.toLowerCase()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[r.status] || "bg-gray-100 text-gray-600"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.consultant ? `${r.consultant.firstName} ${r.consultant.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
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

export default AdminDemoRequests;
