import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Plus,
  ShoppingCart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  walletService,
  creditPackageService,
  type WalletBalance,
  type CreditTransaction,
  type CreditPackage,
} from "@/services/wallet.service";
import { paymentService } from "@/services/payment.service";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const Credits = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Balance
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Transactions
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [txMeta, setTxMeta] = useState<PaginationMeta | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState("");
  const [txLoading, setTxLoading] = useState(true);

  // Packages
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const result = await walletService.getBalance();
      setBalance(result);
    } catch {
      toast({ title: "Error", description: "Failed to load balance.", variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  }, [toast]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const result = await walletService.getTransactions({
        page: txPage,
        limit: 15,
        type: txFilter || undefined,
      });
      setTransactions(result.data);
      setTxMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load transactions.", variant: "destructive" });
    } finally {
      setTxLoading(false);
    }
  }, [txPage, txFilter, toast]);

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    try {
      const result = await creditPackageService.listActive();
      setPackages(result);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchPackages();
  }, [fetchBalance, fetchPackages]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Stripe redirect query params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast({
        title: "Payment Processing",
        description: "Your payment is being verified. Credits will be added shortly.",
      });
      // Refresh balance after delays to catch webhook processing
      setTimeout(() => { fetchBalance(); fetchTransactions(); }, 3000);
      setTimeout(() => { fetchBalance(); fetchTransactions(); }, 8000);
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "No credits were added.",
        variant: "destructive",
      });
      setSearchParams({}, { replace: true });
    }
  }, []); // Run once on mount

  useEffect(() => {
    setTxPage(1);
  }, [txFilter]);

  const getTransactionIcon = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "PURCHASE":
      case "ADMIN_ADJUSTMENT":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "DEDUCTION":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
  };

  const getTransactionColor = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "PURCHASE":
      case "ADMIN_ADJUSTMENT":
        return "text-green-600";
      case "DEDUCTION":
        return "text-red-600";
    }
  };

  const getTransactionLabel = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "DEDUCTION":
        return "Deduction";
      case "ADMIN_ADJUSTMENT":
        return "Adjustment";
    }
  };

  const getTransactionSign = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "PURCHASE":
      case "ADMIN_ADJUSTMENT":
        return "+";
      case "DEDUCTION":
        return "-";
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchaseLoading(true);
    try {
      setIsPurchaseOpen(false);
      const { checkoutUrl } = await paymentService.createCheckout(pkg.id);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setPurchaseLoading(false);
    }
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Credits</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View your credit balance and transaction history.
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsPurchaseOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Purchase Credits
          </Button>
        </div>

        {/* Balance + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
            <CardContent className="p-5">
              {balanceLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-100">Credit Balance</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <Coins className="h-5 w-5" />
                        <span className="text-3xl font-bold">{balance?.balance ?? 0}</span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1">credits available</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Coins className="h-6 w-6" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-4 bg-white text-indigo-700 hover:bg-indigo-50"
                    onClick={() => setIsPurchaseOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Purchase Credits
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Purchased */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Purchased</p>
              <div className="flex items-baseline gap-1 mt-1">
                <Coins className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {balance?.totalPurchased ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time purchases</p>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Used</p>
              <div className="flex items-baseline gap-1 mt-1">
                <Coins className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {balance?.totalDeducted ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Credits spent on classes</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="px-3 py-1.5 border border-input rounded-md bg-background text-sm"
              >
                <option value="">All Types</option>
                <option value="PURCHASE">Purchases</option>
                <option value="DEDUCTION">Deductions</option>
                <option value="ADMIN_ADJUSTMENT">Adjustments</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="grid grid-cols-12 gap-4 px-3 py-3 items-center hover:bg-gray-50 rounded-lg"
                    >
                      <div className="col-span-1">{getTransactionIcon(txn.type)}</div>
                      <div className="col-span-5">
                        <p className="text-sm font-medium">{txn.description || "—"}</p>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2">
                        <Badge
                          className={
                            txn.type === "PURCHASE"
                              ? "bg-green-100 text-green-800"
                              : txn.type === "DEDUCTION"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {getTransactionLabel(txn.type)}
                        </Badge>
                      </div>
                      <div className={`col-span-2 text-sm font-semibold text-right ${getTransactionColor(txn.type)}`}>
                        {getTransactionSign(txn.type)}{txn.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {txMeta && txMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {txMeta.page} of {txMeta.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={txPage >= txMeta.totalPages} onClick={() => setTxPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Purchase Dialog */}
        <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Purchase Credits</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Select a credit pack. Credits are used to book classes.
            </p>
            {packages.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No credit packages available.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {packages
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((pack, index) => (
                    <button
                      key={pack.id}
                      onClick={() => handlePurchase(pack)}
                      disabled={purchaseLoading}
                      className={`relative text-left p-4 rounded-lg border-2 transition-all hover:border-indigo-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        index === 1 ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                      }`}
                    >
                      {index === 1 && (
                        <Badge className="absolute -top-2 right-2 bg-indigo-600 text-xs">
                          Popular
                        </Badge>
                      )}
                      <p className="text-xs font-medium text-muted-foreground">{pack.name}</p>
                      <p className="text-xl font-bold mt-1">{pack.credits}</p>
                      <p className="text-xs text-muted-foreground">credits</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">AED</span>
                        <span className="font-semibold">
                          {(pack.priceInFils / 100).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ParentDashboardLayout>
  );
};

export default Credits;
