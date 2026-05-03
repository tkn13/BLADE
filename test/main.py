import os
import random
import time
from datetime import datetime, timedelta

# Configuration
MAX_CORE = 16
TEST_DURATION_SEC = 3600  # 1 hour
REST_DURATION_SEC = 1800  # 30 minutes
STRESS_STEPS = [0.25, 0.5, 0.75, 1.0]

class StressTester:
    def __init__(self, max_cores):
        self.max_cores = max_cores
        self.available_cores = 0
        self.previous_one_core_use = 0
        self.previous_two_core_use = 0

    def get_running_jobs(self):
        """Checks SLURM for currently running jobs."""
        one_core_cmd = "squeue -n one -h | wc -l"
        two_core_cmd = "squeue -n two -h | wc -l"
        
        try:
            r1 = int(os.popen(one_core_cmd).read().strip() or 0)
            r2 = int(os.popen(two_core_cmd).read().strip() or 0)
            return r1, r2
        except Exception as e:
            print(f"Error checking queue: {e}")
            return 0, 0

    def send_load(self, cores, target_limit):
        """Sends job only if it doesn't exceed the current stress target."""
        one_core_cmd = "sudo -i -u thaksin env PATH=$PATH sendJob -j /shared/home/thaksin/mul -a \"100 1000000\" -n 1 -p 1 -t one"
        two_core_cmd = "sudo -i -u thaksin env PATH=$PATH sendJob -j /shared/home/thaksin/mul -a \"100 1000000\" -n 1 -p 2 -t two"

        r1, r2 = self.get_running_jobs()
        current_used = (r1 * 1) + (r2 * 2)
        
        if current_used + cores <= target_limit + 1:
            cmd = one_core_cmd if cores == 1 else two_core_cmd
            os.system(cmd)
            print(f"Sent {cores}-core job. Current load: {current_used + cores}/{target_limit}")
        else:
            print(f"Load full ({current_used}/{target_limit}). Skipping.")

    def run_session(self, stress_level):
        """Runs the generator for a specific stress level for a set duration."""
        target_cores = int(self.max_cores * stress_level)
        start_time = time.time()
        
        print(f"\n--- STARTING TEST: Level {stress_level} ({target_cores} Cores) ---")
        
        while time.time() - start_time < TEST_DURATION_SEC:
            # 70% chance to attempt adding load
            if random.randint(0, 9) < 7:
                cores_to_use = random.randint(1, 2)
                self.send_load(cores_to_use, target_cores)
            
            # Sleep for 2 minutes as per original logic
            time.sleep(30)

def driver():
    tester = StressTester(MAX_CORE)

    for level in STRESS_STEPS:
        # 1. Calculate Timestamps
        start_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        end_time_dt = datetime.now() + timedelta(seconds=TEST_DURATION_SEC)
        end_time_str = end_time_dt.strftime("%H:%M:%S")

        print("="*50)
        print(f"TEST START | Level: {level} | Cores: {int(MAX_CORE * level)}")
        print(f"Start Time: {start_time_str}")
        print(f"Expected End Time: {end_time_str}")
        print("="*50)

        # 2. Run the Stress Test session
        tester.run_session(level)

        # 3. Handle Rest Period
        actual_end_time = datetime.now().strftime("%H:%M:%S")
        print(f"\n[!] TEST LEVEL {level} COMPLETED AT {actual_end_time}")

        if level != STRESS_STEPS[-1]:
            rest_end_dt = datetime.now() + timedelta(seconds=REST_DURATION_SEC)
            print("-" * 30)
            print(f"RESTING | Duration: {REST_DURATION_SEC/60} mins")
            print(f"Resting until: {rest_end_dt.strftime('%H:%M:%S')}")
            print("-" * 30)

            time.sleep(REST_DURATION_SEC)
        else:
            print("\nFinal test completed. Exiting.")

if __name__ == "__main__":
    driver()
