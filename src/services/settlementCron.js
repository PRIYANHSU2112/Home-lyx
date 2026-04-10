const cron = require("node-cron");
const settlementService = require("../services/settlementService");

let cronJob = null;

/**
 * Start the settlement cron job
 * Runs daily at 2 AM UTC by default
 * Configuration: "0 2 * * *" (daily at 2 AM)
 */
const startSettlementCron = (schedule = "0 2 * * *") => {
  try {
    if (cronJob) {
      console.log("Settlement cron job already running");
      return;
    }

    cronJob = cron.schedule(schedule, async () => {
      console.log(`[${new Date().toISOString()}] Running settlement batch job...`);

      try {
        const result = await settlementService.completePendingSettlements();

        console.log(`[${new Date().toISOString()}] Settlement job completed:`, {
          settledCount: result.settledCount,
          totalAmount: result.totalAmount,
          message: result.message,
        });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Settlement job error:`, error.message);
      }
    });

    console.log(`Settlement cron job started with schedule: ${schedule}`);
    console.log("Settlement will run daily at: 2 AM UTC");
  } catch (error) {
    console.error("Failed to start settlement cron job:", error);
  }
};

/**
 * Stop the settlement cron job
 */
const stopSettlementCron = () => {
  try {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
      console.log("Settlement cron job stopped");
    }
  } catch (error) {
    console.error("Failed to stop settlement cron job:", error);
  }
};

module.exports = {
  startSettlementCron,
  stopSettlementCron,
};
