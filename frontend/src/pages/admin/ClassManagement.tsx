import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  BookOpen,
  FileText,
  UserPlus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  courseService,
  adminCourseService,
  type Course,
  type CourseMaterial,
  type GradeTier,
} from "@/services/course.service";
import { referenceService } from "@/services/user.service";
import type { Subject, GradeLevel } from "@/services/user.service";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ClassManagement = () => {
  const { toast } = useToast();

  // List state
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reference data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [gradeTiers, setGradeTiers] = useState<GradeTier[]>([]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subjectId: "",
    gradeId: "",
    name: "",
    description: "",
  });
  const [createSaving, setCreateSaving] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Materials dialog
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsCourse, setMaterialsCourse] = useState<Course | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    fileUrl: "",
    fileType: "pdf",
  });
  const [materialSaving, setMaterialSaving] = useState(false);

  // Grade tiers dialog
  const [tiersOpen, setTiersOpen] = useState(false);
  const [tierEditId, setTierEditId] = useState<string | null>(null);
  const [tierCreditsForm, setTierCreditsForm] = useState({ credits60Min: "", credits90Min: "", credits120Min: "" });
  const [tierSaving, setTierSaving] = useState(false);

  // Status toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminCourseService.list({
        page: currentPage,
        limit: 20,
        subjectId: filterSubject || undefined,
        gradeId: filterGrade || undefined,
        search: searchTerm.trim() || undefined,
      });
      setCourses(result.data);
      setMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load courses.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterSubject, filterGrade, searchTerm, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSubject, filterGrade]);

  // Load reference data
  useEffect(() => {
    const load = async () => {
      try {
        const [subs, grds] = await Promise.all([
          referenceService.getSubjects(),
          referenceService.getGrades(),
        ]);
        setSubjects(subs);
        setGrades(grds);
      } catch {
        // non-critical
      }
    };
    load();
  }, []);

  // ------- Toggle status -------
  const handleToggleStatus = async (course: Course) => {
    setTogglingId(course.id);
    try {
      await adminCourseService.update(course.id, { isActive: !course.isActive });
      toast({
        title: course.isActive ? "Course deactivated" : "Course activated",
        description: course.name,
      });
      fetchCourses();
    } catch {
      toast({ title: "Error", description: "Failed to update course status.", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  // Auto-generate course name
  const autoName = (subjectId: string, gradeId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    const grd = grades.find((g) => g.id === gradeId);
    if (sub && grd) return `${sub.name} — ${grd.name}`;
    return "";
  };

  // ------- Create Course -------
  const handleCreate = async () => {
    if (!createForm.subjectId || !createForm.gradeId) return;
    setCreateSaving(true);
    try {
      const name = createForm.name || autoName(createForm.subjectId, createForm.gradeId);
      await adminCourseService.create({
        subjectId: createForm.subjectId,
        gradeId: createForm.gradeId,
        name,
        description: createForm.description || undefined,
      });
      toast({ title: "Course created", description: name });
      setCreateOpen(false);
      setCreateForm({ subjectId: "", gradeId: "", name: "", description: "" });
      fetchCourses();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to create course.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCreateSaving(false);
    }
  };

  // ------- Edit Course -------
  const openEditDialog = (course: Course) => {
    setEditCourse(course);
    setEditForm({
      name: course.name,
      description: course.description || "",
      isActive: course.isActive,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editCourse) return;
    setEditSaving(true);
    try {
      await adminCourseService.update(editCourse.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        isActive: editForm.isActive,
      });
      toast({ title: "Course updated", description: editForm.name });
      setEditOpen(false);
      fetchCourses();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to update course.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  // ------- Delete Course -------
  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.name}"? This action is soft-delete.`)) return;
    try {
      await adminCourseService.delete(course.id);
      toast({ title: "Course deleted", description: course.name });
      fetchCourses();
    } catch {
      toast({ title: "Error", description: "Failed to delete course.", variant: "destructive" });
    }
  };

  // ------- Materials Dialog -------
  const openMaterialsDialog = async (course: Course) => {
    try {
      const detail = await courseService.getById(course.id);
      setMaterialsCourse(detail);
      setMaterialsOpen(true);
      setMaterialForm({ title: "", fileUrl: "", fileType: "pdf" });
    } catch {
      toast({ title: "Error", description: "Failed to load course details.", variant: "destructive" });
    }
  };

  const handleAddMaterial = async () => {
    if (!materialsCourse || !materialForm.title || !materialForm.fileUrl) return;
    setMaterialSaving(true);
    try {
      await adminCourseService.addMaterial(materialsCourse.id, {
        title: materialForm.title,
        fileUrl: materialForm.fileUrl,
        fileType: materialForm.fileType,
      });
      toast({ title: "Material added", description: materialForm.title });
      setMaterialForm({ title: "", fileUrl: "", fileType: "pdf" });
      const detail = await courseService.getById(materialsCourse.id);
      setMaterialsCourse(detail);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to add material.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setMaterialSaving(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!materialsCourse) return;
    try {
      await adminCourseService.removeMaterial(materialsCourse.id, materialId);
      toast({ title: "Material removed" });
      const detail = await courseService.getById(materialsCourse.id);
      setMaterialsCourse(detail);
    } catch {
      toast({ title: "Error", description: "Failed to remove material.", variant: "destructive" });
    }
  };

  // ------- Grade Tiers Dialog -------
  const openTiersDialog = async () => {
    try {
      const tiers = await adminCourseService.listGradeTiers();
      setGradeTiers(tiers);
      setTiersOpen(true);
      setTierEditId(null);
    } catch {
      toast({ title: "Error", description: "Failed to load grade tiers.", variant: "destructive" });
    }
  };

  const handleSaveTier = async (tierId: string) => {
    const c60 = parseInt(tierCreditsForm.credits60Min);
    const c90 = parseInt(tierCreditsForm.credits90Min);
    const c120 = parseInt(tierCreditsForm.credits120Min);
    if ([c60, c90, c120].some((v) => isNaN(v) || v < 1)) {
      toast({ title: "Invalid", description: "All credit values must be positive integers.", variant: "destructive" });
      return;
    }
    setTierSaving(true);
    try {
      await adminCourseService.updateGradeTier(tierId, {
        credits60Min: c60,
        credits90Min: c90,
        credits120Min: c120,
        creditsPerClass: c60, // keep legacy field in sync with 60-min rate
      });
      toast({ title: "Grade tier updated" });
      const tiers = await adminCourseService.listGradeTiers();
      setGradeTiers(tiers);
      setTierEditId(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to update tier.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setTierSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage courses, materials, and grade tier pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTiersDialog}>
            Grade Tiers
          </Button>
          <Button className="bg-gray-800 hover:bg-gray-900" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              All Courses {meta ? `(${meta.total})` : ""}
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-56"
                />
              </div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">All Grades</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No courses found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Credits/Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="font-medium text-gray-800">{course.name}</div>
                          {course.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {course.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">{course.subject.name}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{course.grade.name}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {(course as unknown as { creditsPerClass?: number }).creditsPerClass ?? course.grade.tier?.creditsPerClass ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={course.isActive}
                              disabled={togglingId === course.id}
                              onCheckedChange={() => handleToggleStatus(course)}
                            />
                            <Badge className={course.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {course.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(course)} title="Edit course">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openMaterialsDialog(course)} title="Materials">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(course)} title="Delete course" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= meta.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ==================== Create Course Dialog ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={createForm.subjectId} onValueChange={(v) => {
                setCreateForm({ ...createForm, subjectId: v, name: autoName(v, createForm.gradeId) });
              }}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={createForm.gradeId} onValueChange={(v) => {
                setCreateForm({ ...createForm, gradeId: v, name: autoName(createForm.subjectId, v) });
              }}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Auto-generated from Subject + Grade"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Course description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSaving || !createForm.subjectId || !createForm.gradeId}>
              {createSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Edit Course Dialog ==================== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
              />
              <Label>{editForm.isActive ? "Active" : "Inactive"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editForm.name}>
              {editSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Materials Dialog ==================== */}
      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Materials — {materialsCourse?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Existing materials */}
            <div>
              <Label className="text-sm font-medium">Current Materials</Label>
              {(!materialsCourse?.materials || materialsCourse.materials.length === 0) ? (
                <p className="text-sm text-muted-foreground mt-2">No materials uploaded yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {materialsCourse.materials.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 text-xs">{mat.fileType.toUpperCase()}</Badge>
                        <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {mat.title}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMaterial(mat.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add material */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Add Material</Label>
              <div className="space-y-2 mt-2">
                <Input
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="Title"
                />
                <Input
                  value={materialForm.fileUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                  placeholder="File URL"
                />
                <div className="flex gap-2">
                  <select
                    value={materialForm.fileType}
                    onChange={(e) => setMaterialForm({ ...materialForm, fileType: e.target.value })}
                    className="px-3 py-2 border border-input rounded-md bg-background text-sm flex-1"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="pptx">PPTX</option>
                    <option value="xlsx">XLSX</option>
                    <option value="mp4">MP4</option>
                    <option value="other">Other</option>
                  </select>
                  <Button
                    onClick={handleAddMaterial}
                    disabled={materialSaving || !materialForm.title || !materialForm.fileUrl}
                  >
                    {materialSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Grade Tiers Dialog ==================== */}
      <Dialog open={tiersOpen} onOpenChange={setTiersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Tier Pricing</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Set credits per session for each grade tier and duration.
          </p>
          <div className="space-y-3 py-2">
            {gradeTiers.map((tier) => (
              <div key={tier.id} className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">Grades {tier.minGrade}–{tier.maxGrade}</p>
                  </div>
                  {tierEditId === tier.id ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleSaveTier(tier.id)} disabled={tierSaving}>
                        {tierSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setTierEditId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTierEditId(tier.id);
                        setTierCreditsForm({
                          credits60Min: String(tier.credits60Min || tier.creditsPerClass),
                          credits90Min: String(tier.credits90Min || tier.creditsPerClass),
                          credits120Min: String(tier.credits120Min || tier.creditsPerClass),
                        });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {tierEditId === tier.id ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">60 min</p>
                      <Input
                        type="number"
                        min={1}
                        value={tierCreditsForm.credits60Min}
                        onChange={(e) => setTierCreditsForm({ ...tierCreditsForm, credits60Min: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">90 min</p>
                      <Input
                        type="number"
                        min={1}
                        value={tierCreditsForm.credits90Min}
                        onChange={(e) => setTierCreditsForm({ ...tierCreditsForm, credits90Min: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">120 min</p>
                      <Input
                        type="number"
                        min={1}
                        value={tierCreditsForm.credits120Min}
                        onChange={(e) => setTierCreditsForm({ ...tierCreditsForm, credits120Min: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">60m: {tier.credits60Min || tier.creditsPerClass}</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">90m: {tier.credits90Min || tier.creditsPerClass}</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">120m: {tier.credits120Min || tier.creditsPerClass}</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
