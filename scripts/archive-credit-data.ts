#!/usr/bin/env tsx
/**
 * Archive Credit System Data
 * 
 * This script archives existing credit transaction data before migrating
 * to the new tier-based subscription system. The archived data is saved
 * to JSON files for audit and historical purposes.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function archiveCreditData() {
  console.log("🗄️  Starting credit data archival...");

  // Create archive directory
  const archiveDir = join(process.cwd(), "data-archive", "credit-system");
  mkdirSync(archiveDir, { recursive: true });

  try {
    // Get all credit transactions
    const creditTransactions = await prisma.creditTransaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Found ${creditTransactions.length} credit transactions`);

    // Get users who had credit transactions (credit fields already removed)
    const usersWithTransactions = await prisma.user.findMany({
      where: {
        creditTransactions: { some: {} },
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    console.log(`👥 Found ${usersWithTransactions.length} users with credit transaction history`);

    // Get teams who had credit transactions
    const teamsWithTransactions = await prisma.team.findMany({
      where: {
        creditTransactions: { some: {} },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    console.log(`🏢 Found ${teamsWithTransactions.length} teams with credit transaction history`);

    // Archive the data
    const archiveDate = new Date().toISOString().split('T')[0];
    
    writeFileSync(
      join(archiveDir, `credit-transactions-${archiveDate}.json`),
      JSON.stringify(creditTransactions, null, 2)
    );

    writeFileSync(
      join(archiveDir, `users-with-credit-history-${archiveDate}.json`),
      JSON.stringify(usersWithTransactions, null, 2)
    );

    writeFileSync(
      join(archiveDir, `teams-with-credit-history-${archiveDate}.json`),
      JSON.stringify(teamsWithTransactions, null, 2)
    );

    // Calculate credit totals from transactions
    const totalCreditsTransacted = creditTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebitsTransacted = creditTransactions.reduce((sum, tx) => sum + (tx.amount < 0 ? Math.abs(tx.amount) : 0), 0);

    // Generate summary report
    const summary = {
      archiveDate,
      totalTransactions: creditTransactions.length,
      totalUsersWithTransactions: usersWithTransactions.length,
      totalTeamsWithTransactions: teamsWithTransactions.length,
      totalCreditsTransacted: totalCreditsTransacted,
      totalDebitsTransacted: totalDebitsTransacted,
      transactionDateRange: {
        earliest: creditTransactions[0]?.createdAt,
        latest: creditTransactions[creditTransactions.length - 1]?.createdAt,
      },
      usersWithTransactions: usersWithTransactions.slice(0, 10),
      teamsWithTransactions: teamsWithTransactions.slice(0, 10),
    };

    writeFileSync(
      join(archiveDir, `credit-system-summary-${archiveDate}.json`),
      JSON.stringify(summary, null, 2)
    );

    console.log("✅ Credit data archived successfully!");
    console.log(`📁 Archive location: ${archiveDir}`);
    console.log(`📊 Summary:`);
    console.log(`   - ${summary.totalTransactions} transactions archived`);
    console.log(`   - ${summary.totalUsersWithTransactions} users with transaction history`);
    console.log(`   - ${summary.totalTeamsWithTransactions} teams with transaction history`);
    console.log(`   - Total credits transacted: $${(summary.totalCreditsTransacted / 100).toFixed(2)}`);
    console.log(`   - Total debits transacted: $${(summary.totalDebitsTransacted / 100).toFixed(2)}`);

    return summary;

  } catch (error) {
    console.error("❌ Error archiving credit data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  archiveCreditData()
    .catch((error) => {
      console.error("Failed to archive credit data:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default archiveCreditData;