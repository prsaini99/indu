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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Package,
  Wallet,
  Trash2,
  ArrowUpDown,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  adminWalletService,
  type CreditPackage,
  type AdminWalletEntry,
} from "@/services/wallet.service";
import {
  adminPaymentService,
  type AdminPayment,
} from "@/services/payment.service";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Tab = "packages" | "wallets" | "payments";

const PaymentManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("payments");

  // ------- Credit Packages -------
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // Create/Edit package dialog
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    credits: "",
    priceAed: "",
    isActive: true,
  });
  const [packageSaving, setPackageSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ------- Wallets -------
  const [wallets, setWallets] = useState<AdminWalletEntry[]>([]);
  const [walletMeta, setWalletMeta] = useState<PaginationMeta | null>(null);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const [walletPage, setWalletPage] = useState(1);

  // ------- Payments -------
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentMeta, setPaymentMeta] = useState<PaginationMeta | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState("");

  // Adjust credits dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustWallet, setAdjustWallet] = useState<AdminWalletEntry | null>(null);
  const [adjustForm, setAdjustForm] = useState({ amount: "", description: "" });
  const [adjustSaving, setAdjustSaving] = useState(false);

  // ------- Fetch Packages -------
  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const result = await adminWalletService.listAllPackages();
      setPackages(result);
    } catch {
      toast({ title: "Error", description: "Failed to load credit packages.", variant: "destructive" });
    } finally {
      setPackagesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // ------- Fetch Wallets -------
  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const result = await adminWalletService.listAllWallets({
        page: walletPage,
        limit: 20,
        search: walletSearch.trim() || undefined,
      });
      setWallets(result.data);
      setWalletMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load wallets.", variant: "destructive" });
    } finally {
      setWalletsLoading(false);
    }
  }, [walletPage, walletSearch, toast]);

  useEffect(() => {
    if (activeTab === "wallets") fetchWallets();
  }, [activeTab, fetchWallets]);

  useEffect(() => {
    setWalletPage(1);
  }, [walletSearch]);

  // ------- Fetch Payments -------
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const result = await adminPaymentService.listPayments({
        page: paymentPage,
        limit: 20,
        status: paymentFilter || undefined,
      });
      setPayments(result.data);
      setPaymentMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load payments.", variant: "destructive" });
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentPage, paymentFilter, toast]);

  useEffect(() => {
    if (activeTab === "payments") fetchPayments();
  }, [activeTab, fetchPayments]);

  useEffect(() => {
    setPaymentPage(1);
  }, [paymentFilter]);

  // ------- Package CRUD -------
  const openCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({ name: "", credits: "", priceAed: "", isActive: true });
    setPackageDialogOpen(true);
  };

  const openEditPackage = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      credits: String(pkg.credits),
      priceAed: String(pkg.priceInFils / 100),
      isActive: pkg.isActive,
    });
    setPackageDialogOpen(true);
  };

  const handleSavePackage = async () => {
    const credits = parseInt(packageForm.credits);
    const priceAed = parseFloat(packageForm.priceAed);

    if (!packageForm.name || isNaN(credits) || credits < 1 || isNaN(priceAed) || priceAed <= 0) {
      toast({ title: "Validation Error", description: "Please fill all fields with valid values.", variant: "destructive" });
      return;
    }

    const priceInFils = Math.round(priceAed * 100);
    setPackageSaving(true);

    try {
      if (editingPackage) {
        await adminWalletService.updatePackage(editingPackage.id, {
          name: packageForm.name,
          credits,
          priceInFils,
          isActive: packageForm.isActive,
        });
        toast({ title: "Package updated", description: packageForm.name });
      } else {
        await adminWalletService.createPackage({
          name: packageForm.name,
          credits,
          priceInFils,
        });
        toast({ title: "Package created", description: packageForm.name });
      }
      setPackageDialogOpen(false);
      fetchPackages();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to save package.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setPackageSaving(false);
    }
  };

  const handleToggleStatus = async (pkg: CreditPackage) => {
    setTogglingId(pkg.id);
    try {
      await adminWalletService.updatePackage(pkg.id, { isActive: !pkg.isActive });
      toast({
        title: pkg.isActive ? "Package deactivated" : "Package activated",
        description: pkg.name,
      });
      fetchPackages();
    } catch {
      toast({ title: "Error", description: "Failed to update package status.", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePackage = async (pkg: CreditPackage) => {
    if (!confirm(`Delete "${pkg.name}"? This action is soft-delete.`)) return;
    try {
      await adminWalletService.deletePackage(pkg.id);
      toast({ title: "Package deleted", description: pkg.name });
      fetchPackages();
    } catch {
      toast({ title: "Error", description: "Failed to delete package.", variant: "destructive" });
    }
  };

  // ------- Adjust Credits -------
  const openAdjustDialog = (wallet: AdminWalletEntry) => {
    setAdjustWallet(wallet);
    setAdjustForm({ amount: "", description: "" });
    setAdjustOpen(true);
  };

  const handleAdjustCredits = async () => {
    if (!adjustWallet) return;
    const amount = parseInt(adjustForm.amount);
    if (isNaN(amount) || amount === 0) {
      toast({ title: "Invalid amount", description: "Amount must be a non-zero integer.", variant: "destructive" });
      return;
    }
    if (!adjustForm.description.trim()) {
      toast({ title: "Description required", description: "Please provide a reason for the adjustment.", variant: "destructive" });
      return;
    }
    setAdjustSaving(true);
    try {
      await adminWalletService.adjustCredits(adjustWallet.id, {
        amount,
        description: adjustForm.description.trim(),
      });
      toast({
        title: "Credits adjusted",
        description: `${amount > 0 ? "+" : ""}${amount} credits for ${adjustWallet.firstName} ${adjustWallet.lastName}`,
      });
      setAdjustOpen(false);
      fetchWallets();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to adjust credits.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAdjustSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Credit & Wallet Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage credit packages and parent wallet balances
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "payments" ? "default" : "outline"}
          onClick={() => setActiveTab("payments")}
          className={activeTab === "payments" ? "bg-gray-800 hover:bg-gray-900" : ""}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Payments
        </Button>
        <Button
          variant={activeTab === "wallets" ? "default" : "outline"}
          onClick={() => setActiveTab("wallets")}
          className={activeTab === "wallets" ? "bg-gray-800 hover:bg-gray-900" : ""}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Parent Wallets
        </Button>
        <Button
          variant={activeTab === "packages" ? "default" : "outline"}
          onClick={() => setActiveTab("packages")}
          className={activeTab === "packages" ? "bg-gray-800 hover:bg-gray-900" : ""}
        >
          <Package className="h-4 w-4 mr-2" />
          Credit Packages
        </Button>
      </div>

      {/* ==================== CREDIT PACKAGES TAB ==================== */}
      {activeTab === "packages" && (
        <Card>
          <div className="p-6 pb-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              All Packages ({packages.length})
            </h2>
            <Button size="sm" onClick={openCreatePackage}>
              <Plus className="h-4 w-4 mr-2" />
              New Package
            </Button>
          </div>
          <CardContent className="pt-4">
            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No credit packages yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Price (AED)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages
                      .sort((a, b) => a.priceInFils - b.priceInFils)
                      .map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium text-gray-800">{pkg.name}</TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {pkg.credits} credits
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            AED {(pkg.priceInFils / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pkg.isActive}
                                disabled={togglingId === pkg.id}
                                onCheckedChange={() => handleToggleStatus(pkg)}
                              />
                              <Badge className={pkg.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {pkg.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditPackage(pkg)} title="Edit package">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePackage(pkg)}
                                title="Delete package"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== WALLETS TAB ==================== */}
      {activeTab === "wallets" && (
        <Card>
          <div className="p-6 pb-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Parent Wallets {walletMeta ? `(${walletMeta.total})` : ""}
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <CardContent className="pt-4">
            {walletsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No parent wallets found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parent</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Credit Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell className="font-medium text-gray-800">
                            {wallet.firstName} {wallet.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {wallet.email}
                          </TableCell>
                          <TableCell>
                            <Badge className={wallet.balance > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {wallet.balance} credits
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustDialog(wallet)}
                            >
                              <ArrowUpDown className="h-4 w-4 mr-1" />
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {walletMeta && walletMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {walletMeta.page} of {walletMeta.totalPages} ({walletMeta.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={walletPage <= 1} onClick={() => setWalletPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={walletPage >= walletMeta.totalPages} onClick={() => setWalletPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== PAYMENTS TAB ==================== */}
      {activeTab === "payments" && (
        <Card>
          <div className="p-6 pb-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Payment History {paymentMeta ? `(${paymentMeta.total})` : ""}
            </h2>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-md bg-background text-sm"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <CardContent className="pt-4">
            {paymentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No payments found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parent</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium text-gray-800">
                            {payment.parentName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.parentEmail}
                          </TableCell>
                          <TableCell>{payment.packageName}</TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {payment.credits}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            AED {(payment.amountInFils / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payment.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : payment.status === "EXPIRED"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {paymentMeta && paymentMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {paymentMeta.page} of {paymentMeta.totalPages} ({paymentMeta.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={paymentPage <= 1} onClick={() => setPaymentPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={paymentPage >= paymentMeta.totalPages} onClick={() => setPaymentPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== Package Create/Edit Dialog ==================== */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Edit Package" : "Create Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                placeholder="e.g. Standard Pack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  min={1}
                  value={packageForm.credits}
                  onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (AED)</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={packageForm.priceAed}
                  onChange={(e) => setPackageForm({ ...packageForm, priceAed: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePackage} disabled={packageSaving}>
              {packageSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : editingPackage ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Adjust Credits Dialog ==================== */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adjust Credits — {adjustWallet?.firstName} {adjustWallet?.lastName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Current balance: <strong>{adjustWallet?.balance ?? 0} credits</strong>
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                placeholder="Positive to add, negative to deduct"
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add credits, negative to deduct.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={adjustForm.description}
                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                placeholder="e.g. Refund for cancelled class"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustCredits} disabled={adjustSaving || !adjustForm.amount || !adjustForm.description}>
              {adjustSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
