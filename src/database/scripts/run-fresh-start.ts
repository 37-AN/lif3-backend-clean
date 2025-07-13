import { AppDataSource } from '../data-source';
import { seedFreshStart } from '../seeds/fresh-start.seed';

async function runFreshStartScript() {
  try {
    console.log('🚀 Initializing LIF3 Fresh Start Database Reset...');
    
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Run fresh start seeding
    await seedFreshStart(AppDataSource);
    
    console.log('🎉 LIF3 Fresh Start Complete!');
    console.log('📊 Database reset with R0 starting values');
    console.log('🎯 Ready to track progress to R1,800,000');
    
  } catch (error) {
    console.error('❌ Fresh Start Script Error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runFreshStartScript();