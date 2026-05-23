import time
import schedule
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | TaskFlow-Worker | %(levelname)s | %(message)s"
)
log = logging.getLogger(__name__)


def process_jobs():
    log.info("🔄  Processing background jobs...")
    time.sleep(1)
    log.info("✅  Job batch complete!")


def health_ping():
    log.info("💚  Worker is healthy and running")


schedule.every(10).seconds.do(process_jobs)
schedule.every(30).seconds.do(health_ping)

log.info("🚀  TaskFlow Worker started!")

while True:
    schedule.run_pending()
    time.sleep(1)