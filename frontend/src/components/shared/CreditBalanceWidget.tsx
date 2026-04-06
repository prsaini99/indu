
import { IndianRupee, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CreditTransaction } from "@/types/platform";

interface CreditBalanceWidgetProps {
  balance: number;
  recentTransactions?: CreditTransaction[];
  onPurchaseCredits?: () => void;
  onViewHistory?: () => void;
  variant?: "compact" | "detailed";
}

const CreditBalanceWidget = ({
  balance,
  recentTransactions = [],
  onPurchaseCredits,
  onViewHistory,
  variant = "compact",
}: CreditBalanceWidgetProps) => {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-IN").format(amount);
  };

  const getTransactionIcon = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />;
      case "spend":
        return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
      case "refund":
        return <RefreshCcw className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const getTransactionColor = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "text-green-600";
      case "spend":
        return "text-red-600";
      case "refund":
        return "text-blue-600";
    }
  };

  if (variant === "compact") {
    return (
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100">Credit Balance</p>
              <div className="flex items-baseline gap-1 mt-1">
                <IndianRupee className="h-5 w-5" />
                <span className="text-3xl font-bold">{formatBalance(balance)}</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          {onPurchaseCredits && (
            <Button
              size="sm"
              className="w-full mt-4 bg-white text-indigo-700 hover:bg-indigo-50"
              onClick={onPurchaseCredits}
            >
              <Plus className="h-4 w-4 mr-1" />
              Purchase Credits
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant with transaction history
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Credits</CardTitle>
          {onViewHistory && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onViewHistory}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              Full History
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Balance display */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-lg p-4 mb-4">
          <p className="text-sm text-indigo-100">Available Balance</p>
          <div className="flex items-baseline gap-1 mt-1">
            <IndianRupee className="h-5 w-5" />
            <span className="text-3xl font-bold">{formatBalance(balance)}</span>
          </div>
          {onPurchaseCredits && (
            <Button
              size="sm"
              className="mt-3 bg-white text-indigo-700 hover:bg-indigo-50"
              onClick={onPurchaseCredits}
            >
              <Plus className="h-4 w-4 mr-1" />
              Purchase Credits
            </Button>
          )}
        </div>

        {/* Recent transactions */}
        {recentTransactions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Recent Transactions</p>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(txn.type)}
                    <div>
                      <p className="text-sm">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${getTransactionColor(txn.type)}`}>
                    {txn.amount > 0 ? "+" : ""}
                    {formatBalance(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditBalanceWidget;
