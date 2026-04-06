import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApplicationService, type Application } from "@/services/application.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const roleColors: Record<string, string> = {
  TUTOR: "bg-teal-100 text-teal-700",
  CONSULTANT: "bg-purple-100 text-purple-700",
};

const AdminApplications = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail/Review dialog
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string; role?: string } = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (roleFilter !== "all") params.role = roleFilter;
      const res = await adminApplicationService.list(params);
      setApplications(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, roleFilter]);

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedApp) return;
    setReviewing(true);
    try {
      await adminApplicationService.review(selectedApp.id, { status, reviewNote: reviewNote || undefined });
      toast({ title: `Application ${status.toLowerCase()}`, description: `${selectedApp.firstName} ${selectedApp.lastName}'s application has been ${status.toLowerCase()}.` });
      setDetailOpen(false);
      setReviewNote("");
      setSelectedApp(null);
      fetchApplications();
    } catch {
      toast({ title: "Error", description: "Failed to review application.", variant: "destructive" });
    } finally {
      setReviewing(false);
    }
  };

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setReviewNote("");
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tutor and consultant applications ({total} total)
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
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="TUTOR">Tutor</SelectItem>
            <SelectItem value="CONSULTANT">Consultant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : applications.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No applications found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.firstName} {app.lastName}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.phone}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[app.role] || "bg-gray-100 text-gray-600"}>
                          {app.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.experience} yrs</TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status] || "bg-gray-100 text-gray-600"}>
                          {app.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDetail(app)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
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

      {/* Detail / Review Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Name</span>
                  <p className="font-medium">{selectedApp.firstName} {selectedApp.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Role</span>
                  <p><Badge className={roleColors[selectedApp.role]}>{selectedApp.role}</Badge></p>
                </div>
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone</span>
                  <p className="font-medium">{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Experience</span>
                  <p className="font-medium">{selectedApp.experience} years</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p><Badge className={statusColors[selectedApp.status]}>{selectedApp.status.replace("_", " ")}</Badge></p>
                </div>
              </div>

              {selectedApp.subjects && (
                <div className="text-sm">
                  <span className="text-gray-500">Subjects</span>
                  <p className="font-medium">{selectedApp.subjects}</p>
                </div>
              )}
              {selectedApp.qualifications && (
                <div className="text-sm">
                  <span className="text-gray-500">Qualifications</span>
                  <p className="font-medium">{selectedApp.qualifications}</p>
                </div>
              )}
              {selectedApp.bio && (
                <div className="text-sm">
                  <span className="text-gray-500">About</span>
                  <p className="text-gray-700">{selectedApp.bio}</p>
                </div>
              )}

              {selectedApp.reviewNote && (
                <div className="text-sm bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">Review Note</span>
                  <p className="text-gray-700">{selectedApp.reviewNote}</p>
                </div>
              )}

              {selectedApp.status === "PENDING" && (
                <>
                  <div>
                    <Label htmlFor="reviewNote">Review Note (optional)</Label>
                    <Textarea
                      id="reviewNote"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add an internal note about this application..."
                      rows={2}
                    />
                  </div>
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleReview("REJECTED")}
                      disabled={reviewing}
                    >
                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleReview("APPROVED")}
                      disabled={reviewing}
                    >
                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplications;
