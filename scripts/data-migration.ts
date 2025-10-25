#!/usr/bin/env tsx

/**
 * Data Migration Script for Kennel Management System
 * Handles data migration, backup, and restoration
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
}

interface BackupResult {
  success: boolean;
  filePath: string;
  size: number;
  duration: number;
}

interface RestoreResult {
  success: boolean;
  recordsRestored: number;
  errors: string[];
  duration: number;
}

class DataMigrator {
  private db: PrismaClient;
  
  constructor() {
    this.db = prisma;
  }
  
  async migrateUsers(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('👥 Migrating users...');
      
      // Get all users from the database
      const users = await this.db.user.findMany();
      recordsProcessed = users.length;
      
      // Perform any necessary data transformations
      for (const user of users) {
        try {
          // Example: Update user data format
          await this.db.user.update({
            where: { id: user.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update user ${user.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Users migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async migratePets(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('🐕 Migrating pets...');
      
      // Get all pets from the database
      const pets = await this.db.pet.findMany();
      recordsProcessed = pets.length;
      
      // Perform any necessary data transformations
      for (const pet of pets) {
        try {
          // Example: Update pet data format
          await this.db.pet.update({
            where: { id: pet.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update pet ${pet.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Pets migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async migrateBookings(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('📅 Migrating bookings...');
      
      // Get all bookings from the database
      const bookings = await this.db.booking.findMany();
      recordsProcessed = bookings.length;
      
      // Perform any necessary data transformations
      for (const booking of bookings) {
        try {
          // Example: Update booking data format
          await this.db.booking.update({
            where: { id: booking.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update booking ${booking.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Bookings migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async migrateKennels(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('🏠 Migrating kennels...');
      
      // Get all kennels from the database
      const kennels = await this.db.kennel.findMany();
      recordsProcessed = kennels.length;
      
      // Perform any necessary data transformations
      for (const kennel of kennels) {
        try {
          // Example: Update kennel data format
          await this.db.kennel.update({
            where: { id: kennel.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update kennel ${kennel.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Kennels migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async migrateCareLogs(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('📝 Migrating care logs...');
      
      // Get all care logs from the database
      const careLogs = await this.db.careLog.findMany();
      recordsProcessed = careLogs.length;
      
      // Perform any necessary data transformations
      for (const careLog of careLogs) {
        try {
          // Example: Update care log data format
          await this.db.careLog.update({
            where: { id: careLog.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update care log ${careLog.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Care logs migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async migratePayments(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    
    try {
      console.log('💳 Migrating payments...');
      
      // Get all payments from the database
      const payments = await this.db.payment.findMany();
      recordsProcessed = payments.length;
      
      // Perform any necessary data transformations
      for (const payment of payments) {
        try {
          // Example: Update payment data format
          await this.db.payment.update({
            where: { id: payment.id },
            data: {
              // Add any necessary data transformations here
              // Note: updatedAt is automatically managed by Prisma
            }
          });
        } catch (error) {
          errors.push(`Failed to update payment ${payment.id}: ${error}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      
      console.log(`✅ Payments migration completed: ${recordsProcessed} records, ${errors.length} errors`);
      
      return { success, recordsProcessed, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Migration failed: ${error}`);
      return { success: false, recordsProcessed, errors, duration };
    }
  }
  
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      console.log('💾 Creating database backup...');
      
      // Create backup directory if it doesn't exist
      const backupDir = join(process.cwd(), 'backups');
      if (!existsSync(backupDir)) {
        execSync(`mkdir -p ${backupDir}`);
      }
      
      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = join(backupDir, `backup-${timestamp}.sql`);
      
      // Create database backup using pg_dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }
      
      // Extract database connection details
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;
      
      // Set PGPASSWORD environment variable for pg_dump
      process.env.PGPASSWORD = password;
      
      // Run pg_dump command
      const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`;
      execSync(pgDumpCommand, { stdio: 'inherit' });
      
      // Get backup file size
      const stats = require('fs').statSync(backupFile);
      const size = stats.size;
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Database backup created: ${backupFile} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      
      return { success: true, filePath: backupFile, size, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Backup failed: ${error}`);
      return { success: false, filePath: '', size: 0, duration };
    }
  }
  
  async restoreBackup(backupFile: string): Promise<RestoreResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsRestored = 0;
    
    try {
      console.log(`🔄 Restoring database from backup: ${backupFile}`);
      
      if (!existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }
      
      // Get database connection details
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }
      
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;
      
      // Set PGPASSWORD environment variable for psql
      process.env.PGPASSWORD = password;
      
      // Run psql command to restore backup
      const psqlCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupFile}`;
      execSync(psqlCommand, { stdio: 'inherit' });
      
      // Count restored records (this is a simplified approach)
      const backupContent = readFileSync(backupFile, 'utf8');
      recordsRestored = (backupContent.match(/INSERT INTO/g) || []).length;
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Database restored: ${recordsRestored} records restored`);
      
      return { success: true, recordsRestored, errors, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Restore failed: ${error}`);
      console.error(`❌ Restore failed: ${error}`);
      return { success: false, recordsRestored, errors, duration };
    }
  }
  
  async runFullMigration(): Promise<void> {
    console.log('🚀 Starting full data migration...\n');
    
    const results = {
      users: await this.migrateUsers(),
      pets: await this.migratePets(),
      bookings: await this.migrateBookings(),
      kennels: await this.migrateKennels(),
      careLogs: await this.migrateCareLogs(),
      payments: await this.migratePayments()
    };
    
    // Generate migration report
    const report = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalRecords: Object.values(results).reduce((sum, result) => sum + result.recordsProcessed, 0),
        totalErrors: Object.values(results).reduce((sum, result) => sum + result.errors.length, 0),
        success: Object.values(results).every(result => result.success)
      }
    };
    
    // Save report to file
    const reportPath = join(process.cwd(), 'docs', 'migration-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Migration Summary:');
    console.log(`Total records processed: ${report.summary.totalRecords}`);
    console.log(`Total errors: ${report.summary.totalErrors}`);
    console.log(`Migration success: ${report.summary.success ? '✅' : '❌'}`);
    console.log(`Report saved to: ${reportPath}`);
  }
  
  async close(): Promise<void> {
    await this.db.$disconnect();
  }
}

async function main() {
  const migrator = new DataMigrator();
  
  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'migrate':
        await migrator.runFullMigration();
        break;
        
      case 'backup':
        const backupResult = await migrator.createBackup();
        if (backupResult.success) {
          console.log(`✅ Backup created successfully: ${backupResult.filePath}`);
        } else {
          console.error('❌ Backup failed');
          process.exit(1);
        }
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        
        const restoreResult = await migrator.restoreBackup(backupFile);
        if (restoreResult.success) {
          console.log(`✅ Restore completed successfully: ${restoreResult.recordsRestored} records`);
        } else {
          console.error('❌ Restore failed');
          process.exit(1);
        }
        break;
        
      default:
        console.log('Usage: tsx scripts/data-migration.ts [migrate|backup|restore] [backup-file]');
        console.log('  migrate  - Run full data migration');
        console.log('  backup   - Create database backup');
        console.log('  restore  - Restore from backup file');
        break;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
