import os
import random
import time
from datetime import datetime, timedelta

MAX_CORE = 16
STRESS_LEVEL = 0.25
ACTUAL_CORES = int(MAX_CORE * STRESS_LEVEL)
available_cores = ACTUAL_CORES

previous_one_core_use = 0
previous_two_core_use = 0

def send_load(cores):
    global available_cores

    one_core_cmd = "sudo -i -u thaksin sendJob -j /shared/home/thaksin/mul -a \"100 1000000\" -n 1 -p 1 -t one"
    two_core_cmd = "sudo -i -u thaksin sendJob -j /shared/home/thaksin/mul -a \"100 1000000\" -n 1 -p 2 -t two"

    if cores <= available_cores:
        if cores == 1:
            os.system(one_core_cmd)
            available_cores -= 1
        if cores == 2:
            os.system(two_core_cmd)
            available_cores -= 2

    pass

def check_load():
    global previous_one_core_use
    global previous_two_core_use
    global available_cores

    one_core_cmd = "squeue -n stress-one -t R -h | wc -l"
    two_core_cmd = "squeue -n stress-two -t R -h | wc -l"

    current_one_core_use = int(os.popen(one_core_cmd).read().strip())
    current_two_core_use = int(os.popen(two_core_cmd).read().strip())

    print(f"Current one core use: {current_one_core_use}, Current two core use: {current_two_core_use}, Available cores: {available_cores}")

    one_core_diff = current_one_core_use - previous_one_core_use
    two_core_diff = current_two_core_use - previous_two_core_use

    available_cores -= (one_core_diff * 1 + two_core_diff * 2)
    previous_one_core_use = current_one_core_use
    previous_two_core_use = current_two_core_use

def load_generator():
    global available_cores
    ##random based
    if available_cores > 0:
        ##randomly decide to send or not send load
        random_binary = random.randint(0, 9)

        if random_binary < 7:
            print("Decided to send load this time")
            cores_to_use = random.randint(1, 2)
            send_load(cores_to_use)
        else:
            print("Not sending load this time")

def main():
    while True:
        check_load()
        load_generator()
        time.sleep(120)

if __name__ == "__main__":
    main()