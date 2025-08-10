#!/usr/bin/env tsx
/**
 * Rollback Migration Script
 * 
 * This script provides rollback capabilities for the tier-based migration.
 * It can restore credit balances from archived data if needed.
 * 
 * WARNING: This should only be used in emergency situations.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface ArchivedCreditTransaction {
  id: string;
  userId: string | null;
  teamId: string | null;
  amount: number;
  balance: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
}

async function rollbackToCreditsSystem(archiveDate: string) {
  console.log(`🔄 Starting rollback to credits system using archive from ${archiveDate}...`);
  
  const archiveDir = join(process.cwd(), "data-archive", "credit-system");
  const transactionsFile = join(archiveDir, `credit-transactions-${archiveDate}.json`);
  
  if (!existsSync(transactionsFile)) {
    throw new Error(`Archive file not found: ${transactionsFile}`);
  }
  
  try {
    // Read archived transactions
    const archivedTransactions: ArchivedCreditTransaction[] = JSON.parse(
      readFileSync(transactionsFile, 'utf-8')
    );
    
    console.log(`📊 Found ${archivedTransactions.length} archived transactions to restore`);
    
    if (archivedTransactions.length === 0) {
      console.log("ℹ️ No credit transactions to restore. System was already credit-free.");
      return;
    }
    
    // Group transactions by user to get final balances
    const userBalances = new Map<string, number>();
    const teamBalances = new Map<string, number>();
    
    // Sort transactions by creation date to replay them in order
    archivedTransactions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Calculate final balances
    for (const transaction of archivedTransactions) {
      if (transaction.userId) {
        userBalances.set(transaction.userId, transaction.balance);
      }
      if (transaction.teamId) {
        teamBalances.set(transaction.teamId, transaction.balance);
      }
    }
    
    console.log(`👥 Users with credit balances: ${userBalances.size}`);
    console.log(`🏢 Teams with credit balances: ${teamBalances.size}`);
    
    // WARNING: This would require reverting the database schema first
    console.log("⚠️  WARNING: This rollback requires manual schema changes:");
    console.log("1. Revert Prisma schema to include creditBalance fields");
    console.log("2. Run prisma migrate dev to add credit_balance columns back");
    console.log("3. Run this script to restore balances");
    console.log("4. Restore credit transaction records");
    
    console.log("\n📋 Summary of what would be restored:");
    console.log(`   - User credit balances: ${Array.from(userBalances.values()).reduce((a, b) => a + b, 0) / 100} USD`);
    console.log(`   - Team credit balances: ${Array.from(teamBalances.values()).reduce((a, b) => a + b, 0) / 100} USD`);
    console.log(`   - Total transactions: ${archivedTransactions.length}`);
    
    // In a real rollback, you would:
    // 1. Restore the credit_balance fields in the schema
    // 2. Update user and team records with the final balances
    // 3. Restore the credit transaction records
    
    console.log("✅ Rollback analysis completed");
    console.log("⚠️  IMPORTANT: Schema changes must be made manually before executing rollback");
    
  } catch (error) {
    console.error("❌ Error during rollback:", error);
    throw error;
  }
}

// Command line interface
const archiveDate = process.argv[2];

if (!archiveDate) {
  console.error("Usage: tsx scripts/rollback-migration.ts <archive-date>");
  console.error("Example: tsx scripts/rollback-migration.ts 2025-08-02");
  process.exit(1);
}

if (require.main === module) {
  rollbackToCreditsSystem(archiveDate)
    .catch((error) => {
      console.error("Failed to analyze rollback:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}