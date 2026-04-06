import prisma from '../../config/database';

/**
 * Compute a parent's current credit balance from the transaction ledger.
 * PURCHASE and ADMIN_ADJUSTMENT add credits; DEDUCTION removes.
 */
export async function computeBalance(parentId: string): Promise<number> {
  const transactions = await prisma.creditTransaction.findMany({
    where: { parentId },
    select: { type: true, amount: true },
  });
  let balance = 0;
  for (const tx of transactions) {
    if (tx.type === 'DEDUCTION') {
      balance -= tx.amount;
    } else {
      balance += tx.amount;
    }
  }
  return balance;
}
