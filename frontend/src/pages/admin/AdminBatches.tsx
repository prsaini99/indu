import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Play, XCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { adminBatchService, type Batch } from "@/services/batch.service";
import { adminTutorService } from "@/services/tutor.service";
import { referenceService } from "@/services/user.service";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  FULL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AdminBatches = () => {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number } | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [tutors, setTutors] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", subjectId: "", tutorId: "", gradeId: "",
    duration: "60", minStudents: "1", maxStudents: "6", creditsPerSession: "",
    scheduleDays: [] as number[], scheduleTime: "16:00",
  });

  // Detail dialog
  const [selected, setSelected] = useState<Batch | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminBatchService.list({ page, limit: 20, status: statusFilter || undefined });
      setBatches(result.data);
      setMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load batches.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const openCreateDialog = async () => {
    try {
      const [s, g, t] = await Promise.all([
        referenceService.getSubjects(),
        referenceService.getGrades(),
        adminTutorService.listTutors({ limit: 100 }),
      ]);
      setSubjects(s);
      setGrades(g);
      setTutors(t.data.map((tutor: any) => ({ id: tutor.id, firstName: tutor.firstName, lastName: tutor.lastName })));
      setForm({ name: "", description: "", subjectId: "", tutorId: "", gradeId: "", duration: "60", minStudents: "1", maxStudents: "6", creditsPerSession: "", scheduleDays: [], scheduleTime: "16:00" });
      setCreateOpen(true);
    } catch {
      toast({ title: "Error", description: "Failed to load form data.", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.subjectId || !form.tutorId || !form.gradeId || !form.creditsPerSession || form.scheduleDays.length === 0) {
      toast({ title: "Validation", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await adminBatchService.create({
        name: form.name,
        description: form.description || undefined,
        subjectId: form.subjectId,
        tutorId: form.tutorId,
        gradeId: form.gradeId,
        schedule: form.scheduleDays.map((d) => ({ dayOfWeek: d, startTime: form.scheduleTime })),
        duration: parseInt(form.duration),
        minStudents: parseInt(form.minStudents),
        maxStudents: parseInt(form.maxStudents),
        creditsPerSession: parseInt(form.creditsPerSession),
      });
      toast({ title: "Batch created" });
      setCreateOpen(false);
      fetchBatches();
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      const msg = details?.length
        ? details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
        : err?.response?.data?.error?.message || "Failed to create batch.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await adminBatchService.start(id);
      toast({ title: "Batch started" });
      fetchBatches();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to start.", variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await adminBatchService.cancel(id);
      toast({ title: "Batch cancelled" });
      fetchBatches();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to cancel.", variant: "destructive" });
    }
  };

  const handleRemoveStudent = async (batchId: string, studentId: string) => {
    try {
      await adminBatchService.removeStudent(batchId, studentId);
      toast({ title: "Student removed" });
      if (selected) {
        const updated = await adminBatchService.getById(batchId);
        setSelected(updated);
      }
      fetchBatches();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed.", variant: "destructive" });
    }
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day) ? f.scheduleDays.filter((d) => d !== day) : [...f.scheduleDays, day],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Batch / Group Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage small group classes</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> Create Batch</Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {["", "OPEN", "FULL", "ACTIVE", "COMPLETED", "CANCELLED"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={statusFilter === s ? "bg-gray-800 hover:bg-gray-900" : ""}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No batches found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => adminBatchService.getById(b.id).then(setSelected)}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.subject?.name}</TableCell>
                    <TableCell>{b.grade?.name}</TableCell>
                    <TableCell>{b.tutor?.firstName} {b.tutor?.lastName}</TableCell>
                    <TableCell>{b._count?.students || 0}/{b.maxStudents}</TableCell>
                    <TableCell>{b.creditsPerSession}/session</TableCell>
                    <TableCell><Badge className={statusColors[b.status] || ""}>{b.status}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {["OPEN", "FULL"].includes(b.status) && (
                          <Button variant="ghost" size="sm" onClick={() => handleStart(b.id)} title="Start">
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Cancel"><XCircle className="h-4 w-4 text-red-500" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this batch?</AlertDialogTitle>
                                <AlertDialogDescription>All future sessions will be cancelled and credits refunded to students.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancel(b.id)} className="bg-red-600 hover:bg-red-700">Cancel Batch</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Subject:</span> {selected.subject?.name}</div>
                  <div><span className="text-muted-foreground">Grade:</span> {selected.grade?.name}</div>
                  <div><span className="text-muted-foreground">Tutor:</span> {selected.tutor?.firstName} {selected.tutor?.lastName}</div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[selected.status] || ""}>{selected.status}</Badge></div>
                  <div><span className="text-muted-foreground">Duration:</span> {selected.duration}m</div>
                  <div><span className="text-muted-foreground">Credits:</span> {selected.creditsPerSession}/session</div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Schedule:</span>
                    <div className="mt-1">
                      {(selected.schedule || []).sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s, i) => {
                        const [h, m] = s.startTime.split(':').map(Number);
                        const endMin = h * 60 + m + selected.duration;
                        const endH = Math.floor(endMin / 60) % 24;
                        const endM = endMin % 60;
                        const fmt = (hr: number, mn: number) => {
                          const ampm = hr >= 12 ? 'PM' : 'AM';
                          const h12 = hr % 12 || 12;
                          return mn === 0 ? `${h12} ${ampm}` : `${h12}:${String(mn).padStart(2,'0')} ${ampm}`;
                        };
                        return <div key={i}>{DAY_LABELS[s.dayOfWeek]} {fmt(h, m)} - {fmt(endH, endM)}</div>;
                      })}
                    </div>
                  </div>
                </div>

                {/* Zoom link */}
                {selected.zoomLink && (
                  <div className="bg-blue-50 rounded p-3 text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground text-xs">Zoom Link</span>
                      <a href={selected.zoomLink} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">{selected.zoomLink}</a>
                    </div>
                    {selected.zoomPassword && (
                      <div>
                        <span className="text-muted-foreground text-xs">Password</span>
                        <span className="block bg-gray-100 px-2 py-0.5 rounded font-mono select-all text-sm w-fit">{selected.zoomPassword}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {["OPEN", "FULL"].includes(selected.status) && (
                    <Button size="sm" onClick={() => { handleStart(selected.id); setSelected(null); }}>
                      <Play className="h-3 w-3 mr-1" /> Start Batch
                    </Button>
                  )}
                  {!["CANCELLED", "COMPLETED"].includes(selected.status) && (
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => { handleCancel(selected.id); setSelected(null); }}>
                      <XCircle className="h-3 w-3 mr-1" /> Cancel Batch
                    </Button>
                  )}
                </div>

                {/* Students */}
                <div>
                  <p className="text-sm font-medium mb-2">Students ({selected.students?.length || 0})</p>
                  {selected.students && selected.students.length > 0 ? selected.students.map((bs) => (
                    <div key={bs.student.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{bs.student.firstName} {bs.student.lastName}</span>
                        <span className="text-xs text-muted-foreground ml-2">{bs.parent.user?.email}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {bs.student.firstName}?</AlertDialogTitle>
                            <AlertDialogDescription>This student will be removed from the batch.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveStudent(selected.id, bs.student.id)} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground py-2">No students enrolled yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Group Class</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 10 Mathematics - Batch A" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade *</Label>
                <Select value={form.gradeId} onValueChange={(v) => setForm({ ...form, gradeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tutor *</Label>
              <Select value={form.tutorId} onValueChange={(v) => setForm({ ...form, tutorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select tutor" /></SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule Days *</Label>
              <div className="grid grid-cols-7 gap-1 mt-1">
                {DAY_LABELS.map((label, i) => (
                  <Button key={i} type="button" size="sm" variant={form.scheduleDays.includes(i) ? "default" : "outline"}
                    className={`text-xs px-1 ${form.scheduleDays.includes(i) ? "bg-indigo-600" : ""}`}
                    onClick={() => toggleDay(i)}>{label}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Time</Label><Input type="time" value={form.scheduleTime} onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })} /></div>
              <div>
                <Label>Duration</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Credits/Session *</Label><Input type="number" min={1} value={form.creditsPerSession} onChange={(e) => setForm({ ...form, creditsPerSession: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Students</Label><Input type="number" min={2} max={10} value={form.minStudents} onChange={(e) => setForm({ ...form, minStudents: e.target.value })} /></div>
              <div><Label>Max Students</Label><Input type="number" min={2} max={10} value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBatches;
