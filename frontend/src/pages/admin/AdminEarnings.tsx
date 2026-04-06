import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  adminEarningService,
  AdminEarningSummary,
  TutorEarning,
  PayoutRecord,
} from "@/services/earning.service";

const formatInr = (paise: number) => {
  const inr = paise / 100;
  return `₹${inr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AdminEarnings = () => {
  const { toast } = useToast();

  // Summary
  const [summary, setSummary] = useState<AdminEarningSummary | null>(null);

  // Earnings tab
  const [earnings, setEarnings] = useState<(TutorEarning & { tutorName: string; tutorId: string })[]>([]);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotalPages, setEarningsTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  // Payouts tab
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Payout dialog
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);
  const [payoutForm, setPayoutForm] = useState({ paidVia: "", referenceNo: "", notes: "" });
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await adminEarningService.getSummary();
      setSummary(data);
    } catch {
      // silent
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    setLoadingEarnings(true);
    try {
      const res = await adminEarningService.list({
        page: earningsPage,
        limit: 20,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setEarnings(res.data);
      setEarningsTotalPages(res.meta.totalPages);
    } catch {
      toast({ title: "Error", description: "Failed to load earnings", variant: "destructive" });
    } finally {
      setLoadingEarnings(false);
    }
  }, [earningsPage, statusFilter]);

  const fetchPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await adminEarningService.listPayouts({ page: payoutsPage, limit: 20 });
      setPayouts(res.data);
      setPayoutsTotalPages(res.meta.totalPages);
    } catch {
      toast({ title: "Error", description: "Failed to load payouts", variant: "destructive" });
    } finally {
      setLoadingPayouts(false);
    }
  }, [payoutsPage]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleExportCsv = async () => {
    try {
      const blob = await adminEarningService.exportCsv({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tutor-earnings.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to export CSV", variant: "destructive" });
    }
  };

  const toggleEarningSelection = (id: string) => {
    setSelectedEarnings((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleCreatePayout = async () => {
    if (selectedEarnings.length === 0) return;

    // All selected earnings must belong to the same tutor
    const selectedItems = earnings.filter((e) => selectedEarnings.includes(e.id));
    const tutorIds = [...new Set(selectedItems.map((e) => e.tutorId))];
    if (tutorIds.length > 1) {
      toast({ title: "Error", description: "All selected earnings must belong to the same tutor", variant: "destructive" });
      return;
    }

    setSubmittingPayout(true);
    try {
      const result = await adminEarningService.createPayout({
        tutorId: tutorIds[0],
        earningIds: selectedEarnings,
        paidVia: payoutForm.paidVia || undefined,
        referenceNo: payoutForm.referenceNo || undefined,
        notes: payoutForm.notes || undefined,
      });
      toast({ title: "Payout Recorded", description: `${result.earningsMarkedPaid} earnings marked as paid — ${formatInr(result.totalAmountInPaise)}` });
      setPayoutDialogOpen(false);
      setSelectedEarnings([]);
      setPayoutForm({ paidVia: "", referenceNo: "", notes: "" });
      fetchSummary();
      fetchEarnings();
      fetchPayouts();
    } catch {
      toast({ title: "Error", description: "Failed to record payout", variant: "destructive" });
    } finally {
      setSubmittingPayout(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tutor Earnings & Payouts</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage tutor earnings and record payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Platform Earnings</h3>
                <h2 className="text-2xl font-bold mt-1">{summary ? formatInr(summary.totalEarnedInPaise) : "..."}</h2>
                <p className="text-xs text-gray-500 mt-1">{summary?.totalRecords ?? 0} records</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Unpaid</h3>
                <h2 className="text-2xl font-bold mt-1 text-amber-600">{summary ? formatInr(summary.unpaidInPaise) : "..."}</h2>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Paid</h3>
                <h2 className="text-2xl font-bold mt-1 text-green-600">{summary ? formatInr(summary.paidInPaise) : "..."}</h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">This Month</h3>
                <h2 className="text-2xl font-bold mt-1">{summary ? formatInr(summary.thisMonthEarnedInPaise) : "..."}</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Earnings / Payouts */}
      <Tabs defaultValue="earnings">
        <TabsList className="mb-4">
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <Card >
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800">All Earnings</h3>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setEarningsPage(1); }}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <Download className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  {selectedEarnings.length > 0 && (
                    <Button size="sm" onClick={() => setPayoutDialogOpen(true)}>
                      Record Payout ({selectedEarnings.length})
                    </Button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead >Tutor</TableHead>
                      <TableHead >Subject</TableHead>
                      <TableHead >Student</TableHead>
                      <TableHead >Class Date</TableHead>
                      <TableHead >Amount</TableHead>
                      <TableHead >Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingEarnings ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : earnings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">No earnings found</TableCell>
                      </TableRow>
                    ) : (
                      earnings.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            {e.status === "UNPAID" && (
                              <input
                                type="checkbox"
                                checked={selectedEarnings.includes(e.id)}
                                onChange={() => toggleEarningSelection(e.id)}
                                className="rounded border-gray-300"
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{e.tutorName}</TableCell>
                          <TableCell>{e.subject}</TableCell>
                          <TableCell>{e.studentName}</TableCell>
                          <TableCell>{new Date(e.classDate).toLocaleDateString()}</TableCell>
                          <TableCell>{formatInr(e.amountInPaise)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                e.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {earningsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {earningsPage} of {earningsTotalPages}</p>
                  <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={earningsPage <= 1} onClick={() => setEarningsPage(earningsPage - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={earningsPage >= earningsTotalPages} onClick={() => setEarningsPage(earningsPage + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card >
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payout History</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead >Tutor</TableHead>
                      <TableHead >Amount</TableHead>
                      <TableHead >Earnings</TableHead>
                      <TableHead >Paid Via</TableHead>
                      <TableHead >Reference</TableHead>
                      <TableHead >Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayouts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : payouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">No payouts recorded yet</TableCell>
                      </TableRow>
                    ) : (
                      payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.tutorName}</TableCell>
                          <TableCell>{formatInr(p.totalAmountInPaise)}</TableCell>
                          <TableCell>{p.earningsCount} classes</TableCell>
                          <TableCell>{p.paidVia || "—"}</TableCell>
                          <TableCell>{p.referenceNo || "—"}</TableCell>
                          <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {payoutsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {payoutsPage} of {payoutsTotalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={payoutsPage <= 1} onClick={() => setPayoutsPage(payoutsPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={payoutsPage >= payoutsTotalPages} onClick={() => setPayoutsPage(payoutsPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              {selectedEarnings.length} earning(s) selected — Total: {formatInr(
                earnings.filter((e) => selectedEarnings.includes(e.id)).reduce((s, e) => s + e.amountInPaise, 0)
              )}
            </p>
            <div>
              <Label>Payment Method</Label>
              <Input
                placeholder="e.g. Bank Transfer, Cash"
                value={payoutForm.paidVia}
                onChange={(e) => setPayoutForm({ ...payoutForm, paidVia: e.target.value })}
              />
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input
                placeholder="e.g. TXN-2026-0401-001"
                value={payoutForm.referenceNo}
                onChange={(e) => setPayoutForm({ ...payoutForm, referenceNo: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes"
                value={payoutForm.notes}
                onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePayout} disabled={submittingPayout}>
              {submittingPayout && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEarnings;
