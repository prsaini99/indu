import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  BookOpen,
  User,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  demoRequestService,
  type DemoRequest,
  type CreateDemoRequestPayload,
} from "@/services/demoRequest.service";
import { referenceService } from "@/services/user.service";
import type { GradeLevel, Subject, Board } from "@/services/user.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const timeSlotLabels: Record<string, string> = {
  MORNING: "Morning (8 AM - 12 PM)",
  AFTERNOON: "Afternoon (12 PM - 5 PM)",
  EVENING: "Evening (5 PM - 9 PM)",
};

const DemoRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);

  // Form state
  const emptyForm: CreateDemoRequestPayload = {
    contactEmail: "",
    contactPhone: "",
    childFirstName: "",
    childLastName: "",
    childDateOfBirth: "",
    boardId: "",
    gradeId: "",
    subjectIds: [],
    preferredTimeSlot: "MORNING",
    preferredDate: "",
    alternativeDate: "",
    notes: "",
  };
  const [form, setForm] = useState<CreateDemoRequestPayload>(emptyForm);

  // Load requests
  const fetchRequests = () => {
    demoRequestService
      .listMine({ limit: 50 })
      .then((res) => setRequests(res.data))
      .catch(() => toast({ title: "Error", description: "Failed to load demo requests.", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // Load reference data
    Promise.all([
      referenceService.getGrades(),
      referenceService.getSubjects(),
      referenceService.getBoards(),
    ]).then(([g, s, b]) => {
      setGrades(g);
      setSubjects(s);
      setBoards(b);
    });
  }, []);

  // Pre-fill contact email from user
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, contactEmail: prev.contactEmail || user.email || "" }));
    }
  }, [user]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return requests;
    if (activeTab === "active") return requests.filter((r) => ["PENDING", "ASSIGNED", "CONFIRMED"].includes(r.status));
    if (activeTab === "completed") return requests.filter((r) => r.status === "COMPLETED");
    if (activeTab === "cancelled") return requests.filter((r) => r.status === "CANCELLED");
    return requests;
  }, [activeTab, requests]);

  const stats = useMemo(() => ({
    total: requests.length,
    active: requests.filter((r) => ["PENDING", "ASSIGNED", "CONFIRMED"].includes(r.status)).length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
    cancelled: requests.filter((r) => r.status === "CANCELLED").length,
  }), [requests]);

  const selectSubject = (subjectId: string) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds[0] === subjectId ? [] : [subjectId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.contactEmail || !form.childFirstName || !form.childLastName || !form.boardId || !form.gradeId || form.subjectIds.length === 0 || !form.preferredDate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateDemoRequestPayload = {
        ...form,
        contactPhone: form.contactPhone || undefined,
        childDateOfBirth: form.childDateOfBirth || undefined,
        alternativeDate: form.alternativeDate || undefined,
        notes: form.notes || undefined,
      };
      await demoRequestService.create(payload);
      toast({ title: "Demo Request Submitted", description: "Your request has been sent to our team." });
      setDialogOpen(false);
      setForm({ ...emptyForm, contactEmail: user?.email || "" });
      setLoading(true);
      fetchRequests();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to submit request.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await demoRequestService.cancel(id);
      toast({ title: "Request Cancelled", description: "Your demo request has been cancelled." });
      fetchRequests();
    } catch {
      toast({ title: "Error", description: "Failed to cancel request.", variant: "destructive" });
    }
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Demo Requests</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Request a demo class for your child. Our consultants will arrange the perfect tutor match.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(v) => {
            setDialogOpen(v);
            if (!v) setForm({ ...emptyForm, contactEmail: user?.email || "" });
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Request Demo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request a Demo Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Contact Email *</label>
                    <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 9876543210" className="mt-1" />
                  </div>
                </div>

                {/* Child info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Child First Name *</label>
                    <Input value={form.childFirstName} onChange={(e) => setForm({ ...form, childFirstName: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Child Last Name *</label>
                    <Input value={form.childLastName} onChange={(e) => setForm({ ...form, childLastName: e.target.value })} className="mt-1" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Child Date of Birth</label>
                  <Input type="date" value={form.childDateOfBirth} onChange={(e) => setForm({ ...form, childDateOfBirth: e.target.value })} className="mt-1" max={new Date().toISOString().split("T")[0]} />
                </div>

                {/* Board */}
                <div>
                  <label className="text-sm font-medium">Board *</label>
                  <Select value={form.boardId} onValueChange={(v) => setForm({ ...form, boardId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select board" /></SelectTrigger>
                    <SelectContent>
                      {boards.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade */}
                <div>
                  <label className="text-sm font-medium">Grade *</label>
                  <Select value={form.gradeId} onValueChange={(v) => setForm({ ...form, gradeId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subjects */}
                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjects.map((s) => (
                      <Badge
                        key={s.id}
                        variant={form.subjectIds.includes(s.id) ? "default" : "outline"}
                        className={`cursor-pointer ${form.subjectIds.includes(s.id) ? "bg-indigo-600 text-white" : "hover:bg-indigo-50"}`}
                        onClick={() => selectSubject(s.id)}
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Time slot */}
                <div>
                  <label className="text-sm font-medium">Preferred Time Slot *</label>
                  <Select value={form.preferredTimeSlot} onValueChange={(v) => setForm({ ...form, preferredTimeSlot: v as "MORNING" | "AFTERNOON" | "EVENING" })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">Morning (8 AM - 12 PM)</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon (12 PM - 5 PM)</SelectItem>
                      <SelectItem value="EVENING">Evening (5 PM - 9 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Preferred Date *</label>
                    <Input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1" min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alternative Date</label>
                    <Input type="date" value={form.alternativeDate} onChange={(e) => setForm({ ...form, alternativeDate: e.target.value })} className="mt-1" min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requirements or preferences..." className="mt-1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1.5 text-xs">{stats.total}</Badge></TabsTrigger>
            <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-1.5 text-xs">{stats.active}</Badge></TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((req) => (
                  <Card key={req.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-sm">
                              {req.childFirstName} {req.childLastName}
                            </h3>
                            <Badge className={`text-[10px] ${statusColors[req.status]}`} variant="secondary">
                              {req.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {req.board.name} — {req.grade.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {req.subjects.map((s) => s.name).join(", ")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeSlotLabels[req.preferredTimeSlot] || req.preferredTimeSlot}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(req.preferredDate).toLocaleDateString()}
                            </span>
                          </div>

                          {req.consultant && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Assigned to: {req.consultant.firstName} {req.consultant.lastName}
                            </p>
                          )}

                          {req.notes && (
                            <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded p-2">{req.notes}</p>
                          )}
                        </div>

                        {(req.status === "PENDING" || req.status === "ASSIGNED") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => handleCancel(req.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold">No demo requests</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Request Demo" to submit your first demo class request.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ParentDashboardLayout>
  );
};

export default DemoRequests;
