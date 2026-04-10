const cron = require("node-cron");
const db = require("../db");

const AUTO_EXIT_SCHEDULE = "*/5 * * * *";
const AUTO_EXIT_AFTER_HOURS = 3;

async function closeExpiredVisits() {
  const [result] = await db.promise().query(
    `UPDATE library_logs
     SET exit_time = NOW()
     WHERE exit_time IS NULL
       AND entry_time IS NOT NULL
       AND entry_time <= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [AUTO_EXIT_AFTER_HOURS]
  );

  if (result.affectedRows > 0) {
    console.log(`🕒 Auto-exit closed ${result.affectedRows} visit(s).`);
  }
}

function startAutoExitJob() {
  cron.schedule(AUTO_EXIT_SCHEDULE, async () => {
    try {
      await closeExpiredVisits();
    } catch (error) {
      console.log("❌ Auto-exit job failed:", error.message || error);
    }
  });

  console.log("🕒 Auto-exit job scheduled every 5 minutes.");
}

module.exports = {
  startAutoExitJob
};
