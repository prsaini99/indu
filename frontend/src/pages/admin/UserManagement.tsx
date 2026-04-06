import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  adminService,
  type AdminUser,
  type AdminChild,
  type PaginationMeta,
} from "@/services/admin.service";
import { referenceService } from "@/services/user.service";
import type { GradeLevel, Subject } from "@/services/user.service";

const ALL_PERMISSIONS = [
  "USER_MANAGEMENT",
  "TUTOR_MANAGEMENT",
  "COURSE_MANAGEMENT",
  "BOOKING_OVERSIGHT",
  "PAYMENT_MANAGEMENT",
  "CREDIT_MANAGEMENT",
  "TUTOR_PAYOUTS",
  "CMS_MANAGEMENT",
  "ANALYTICS_ACCESS",
  "SYSTEM_CONFIG",
] as const;

const ROLE_COLORS: Record<string, string> = {
  PARENT: "bg-orange-100 text-orange-800",
  TUTOR: "bg-purple-100 text-purple-800",
  CONSULTANT: "bg-cyan-100 text-cyan-800",
  ADMIN: "bg-blue-100 text-blue-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

interface ChildForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gradeId: string;
  subjectIds: string[];
  notes: string;
}

const emptyChildForm: ChildForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gradeId: "",
  subjectIds: [],
  notes: "",
};

const UserManagement = () => {
  const { toast } = useToast();

  // List state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "TUTOR" as "TUTOR" | "CONSULTANT" | "ADMIN",
    permissions: [] as string[],
  });

  // Permissions dialog
  const [permOpen, setPermOpen] = useState(false);
  const [permUser, setPermUser] = useState<AdminUser | null>(null);
  const [permList, setPermList] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  // Children management dialog
  const [childrenOpen, setChildrenOpen] = useState(false);
  const [childrenParent, setChildrenParent] = useState<AdminUser | null>(null);
  const [parentProfileId, setParentProfileId] = useState<string | null>(null);
  const [children, setChildren] = useState<AdminChild[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childFormOpen, setChildFormOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState<ChildForm>(emptyChildForm);
  const [childSaving, setChildSaving] = useState(false);

  // Reference data for child forms
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refLoaded, setRefLoaded] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };
      if (selectedRole !== "all") params.role = selectedRole;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const result = await adminService.listUsers(params as never);
      setUsers(result.data);
      setMeta(result.meta);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedRole, searchTerm, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  // Load reference data on first child dialog open
  const loadRefData = async () => {
    if (refLoaded) return;
    try {
      const [g, s] = await Promise.all([
        referenceService.getGrades(),
        referenceService.getSubjects(),
      ]);
      setGrades(g);
      setSubjects(s);
      setRefLoaded(true);
    } catch {
      // non-critical
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      await adminService.updateUserStatus(user.id, !user.isActive);
      toast({
        title: user.isActive ? "User deactivated" : "User activated",
        description: `${user.firstName} ${user.lastName} (${user.email})`,
      });
      fetchUsers();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete "${user.firstName} ${user.lastName}"? This action is soft-delete.`)) return;
    try {
      await adminService.deleteUser(user.id);
      toast({ title: "User deleted", description: `${user.firstName} ${user.lastName}` });
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      };
      if (newUser.phone) payload.phone = newUser.phone;
      if (newUser.role === "ADMIN" && newUser.permissions.length > 0) {
        payload.permissions = newUser.permissions;
      }
      await adminService.createUser(payload as never);
      toast({
        title: "User created",
        description: `Invite sent to ${newUser.email}. Check backend console for temp password.`,
      });
      setCreateOpen(false);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "TUTOR",
        permissions: [],
      });
      fetchUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to create user.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const openPermissions = async (user: AdminUser) => {
    setPermUser(user);
    setPermOpen(true);
    try {
      const result = await adminService.getUserPermissions(user.id);
      setPermList(result.permissions);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load permissions.",
        variant: "destructive",
      });
      setPermOpen(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!permUser) return;
    setPermSaving(true);
    try {
      await adminService.setPermissions(permUser.id, permList);
      toast({
        title: "Permissions updated",
        description: `Permissions saved for ${permUser.firstName} ${permUser.lastName}.`,
      });
      setPermOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save permissions.",
        variant: "destructive",
      });
    } finally {
      setPermSaving(false);
    }
  };

  const togglePermission = (perm: string) => {
    setPermList((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // ==========================================
  // Children Management
  // ==========================================
  const openChildrenDialog = async (user: AdminUser) => {
    setChildrenParent(user);
    setChildrenOpen(true);
    setChildrenLoading(true);
    loadRefData();

    try {
      // First get the user details to find parentProfileId
      const fullUser = await adminService.getUserById(user.id);
      const profileId = fullUser.parentProfile?.id;
      if (!profileId) {
        toast({ title: "Error", description: "Parent profile not found.", variant: "destructive" });
        setChildrenOpen(false);
        return;
      }
      setParentProfileId(profileId);
      const kids = await adminService.getChildren(profileId);
      setChildren(kids);
    } catch {
      toast({ title: "Error", description: "Failed to load children.", variant: "destructive" });
    } finally {
      setChildrenLoading(false);
    }
  };

  const refreshChildren = async () => {
    if (!parentProfileId) return;
    try {
      const kids = await adminService.getChildren(parentProfileId);
      setChildren(kids);
    } catch {
      // silent
    }
  };

  const openAddChild = () => {
    setEditingChildId(null);
    setChildForm(emptyChildForm);
    setChildFormOpen(true);
  };

  const openEditChild = (child: AdminChild) => {
    setEditingChildId(child.id);
    setChildForm({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.split("T")[0] : "",
      gradeId: child.grade.id,
      subjectIds: child.subjects.map((s) => s.id),
      notes: child.notes || "",
    });
    setChildFormOpen(true);
  };

  const handleSaveChild = async () => {
    if (!parentProfileId || !childForm.firstName || !childForm.gradeId) {
      toast({ title: "Missing fields", description: "First name and grade are required.", variant: "destructive" });
      return;
    }

    setChildSaving(true);
    try {
      if (editingChildId) {
        await adminService.updateChild(parentProfileId, editingChildId, {
          firstName: childForm.firstName,
          lastName: childForm.lastName,
          dateOfBirth: childForm.dateOfBirth || undefined,
          gradeId: childForm.gradeId,
          subjectIds: childForm.subjectIds,
          notes: childForm.notes || undefined,
        });
        toast({ title: "Child updated", description: `${childForm.firstName}'s profile updated.` });
      } else {
        await adminService.createChild(parentProfileId, {
          firstName: childForm.firstName,
          lastName: childForm.lastName || childrenParent?.lastName || "",
          dateOfBirth: childForm.dateOfBirth || undefined,
          gradeId: childForm.gradeId,
          subjectIds: childForm.subjectIds.length > 0 ? childForm.subjectIds : undefined,
          notes: childForm.notes || undefined,
        });
        toast({ title: "Child added", description: `${childForm.firstName} has been added.` });
      }
      setChildFormOpen(false);
      setChildForm(emptyChildForm);
      setEditingChildId(null);
      refreshChildren();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to save child.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setChildSaving(false);
    }
  };

  const handleDeleteChild = async (child: AdminChild) => {
    if (!parentProfileId) return;
    try {
      await adminService.deleteChild(parentProfileId, child.id);
      toast({ title: "Child removed", description: `${child.firstName}'s profile has been removed.` });
      refreshChildren();
    } catch {
      toast({ title: "Error", description: "Failed to remove child.", variant: "destructive" });
    }
  };

  const toggleChildSubject = (subjectId: string) => {
    setChildForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage platform users — tutors, consultants, admins, and parents
          </p>
        </div>
        <Button
          className="bg-gray-800 hover:bg-gray-900"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>
              All Users {meta ? `(${meta.total})` : ""}
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="TUTOR">Tutor</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {(user.firstName?.[0] || "")}{(user.lastName?.[0] || "")}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              ROLE_COLORS[user.role] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role !== "SUPER_ADMIN" ? (
                              <Switch
                                checked={user.isActive}
                                disabled={togglingId === user.id}
                                onCheckedChange={() => handleToggleStatus(user)}
                              />
                            ) : null}
                            <Badge
                              className={
                                user.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isEmailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {user.isEmailVerified ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.role !== "SUPER_ADMIN" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete user"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {user.role === "ADMIN" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPermissions(user)}
                                title="Manage Permissions"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                            {user.role === "PARENT" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openChildrenDialog(user)}
                                title="Manage Children"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            )}
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= meta.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(val) =>
                  setNewUser({
                    ...newUser,
                    role: val as "TUTOR" | "CONSULTANT" | "ADMIN",
                    permissions: [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTOR">Tutor</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === "ADMIN" && (
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center space-x-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={newUser.permissions.includes(perm)}
                        onCheckedChange={(checked) => {
                          setNewUser((prev) => ({
                            ...prev,
                            permissions: checked
                              ? [...prev.permissions, perm]
                              : prev.permissions.filter((p) => p !== perm),
                          }));
                        }}
                      />
                      <span>{perm.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                creating ||
                !newUser.email ||
                !newUser.firstName ||
                !newUser.lastName
              }
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions — {permUser?.firstName} {permUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {ALL_PERMISSIONS.map((perm) => (
              <label
                key={perm}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <Checkbox
                  checked={permList.includes(perm)}
                  onCheckedChange={() => togglePermission(perm)}
                />
                <span className="text-sm">{perm.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={permSaving}>
              {permSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Children Management Dialog */}
      <Dialog open={childrenOpen} onOpenChange={(v) => {
        setChildrenOpen(v);
        if (!v) {
          setChildFormOpen(false);
          setEditingChildId(null);
          setChildForm(emptyChildForm);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Children — {childrenParent?.firstName} {childrenParent?.lastName}
            </DialogTitle>
          </DialogHeader>

          {childrenLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Child Button */}
              {!childFormOpen && (
                <Button size="sm" onClick={openAddChild}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Child
                </Button>
              )}

              {/* Add/Edit Child Form */}
              {childFormOpen && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">
                      {editingChildId ? "Edit Child" : "Add New Child"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">First Name *</Label>
                        <Input
                          value={childForm.firstName}
                          onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input
                          value={childForm.lastName}
                          onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Date of Birth</Label>
                      <Input
                        type="date"
                        value={childForm.dateOfBirth}
                        onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value })}
                        className="mt-1 h-9"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Grade *</Label>
                      <Select
                        value={childForm.gradeId}
                        onValueChange={(v) => setChildForm({ ...childForm, gradeId: v })}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Subjects</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {subjects.map((s) => (
                          <Badge
                            key={s.id}
                            variant={childForm.subjectIds.includes(s.id) ? "default" : "outline"}
                            className={`cursor-pointer text-xs ${
                              childForm.subjectIds.includes(s.id)
                                ? "bg-gray-800 text-white"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => toggleChildSubject(s.id)}
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input
                        value={childForm.notes}
                        onChange={(e) => setChildForm({ ...childForm, notes: e.target.value })}
                        placeholder="Special requirements..."
                        className="mt-1 h-9"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSaveChild} disabled={childSaving}>
                        {childSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        {editingChildId ? "Save Changes" : "Add Child"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setChildFormOpen(false);
                          setEditingChildId(null);
                          setChildForm(emptyChildForm);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Children List */}
              {children.length > 0 ? (
                <div className="space-y-2">
                  {children.map((child) => (
                    <Card key={child.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {child.firstName} {child.lastName}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {child.grade.name}
                              {child.dateOfBirth && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(child.dateOfBirth).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            {child.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {child.subjects.map((s) => (
                                  <Badge key={s.id} variant="secondary" className="text-[10px]">
                                    {s.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {child.notes && (
                              <p className="text-xs text-muted-foreground mt-1 bg-gray-50 rounded px-2 py-1">
                                {child.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditChild(child)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteChild(child)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No children registered for this parent yet.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
