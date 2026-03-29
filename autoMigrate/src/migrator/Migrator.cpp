#include <iostream>
#include <chrono>
#include <thread>
#include <vector>
#include <string>
#include <shared_mutex>

#include "JobDetail.h"
#include "SlurmInterface.h"
#include "JobPacker.h"
#include "Migrator.h"
#include "NodeControl.h"
#include "MigratorConfig.h"

std::shared_mutex system_mutex;

int migrate() {
   
    std::vector<JobDetail> jobDetails;
    
    getJobDetails(jobDetails);

    rearrangeJobs(jobDetails);

    if (migrateDecision(jobDetails)) {
        std::cout << "[INFO] Migration needed." << std::endl;
	    migrator(jobDetails);
	
	    for(const auto& jobDetail : jobDetails) {
		std::cout << "[INFO] Job ID: " << jobDetail.jobId 
		<< ", CPUs: " << jobDetail.cpus 
                << ", SrcNode: " << jobDetail.srcNode.getNodeName() 
                << ", DestNode: " << jobDetail.destNode.getNodeName()
                << std::endl;
    		}

   } else {
        std::cout << "[INFO] Migration not needed." << std::endl;
    }

    return 0;
}

int migrate(std::atomic<bool>& running, std::condition_variable& cv, std::mutex& mtx) {
    const MigratorConfig config = loadMigratorConfig();

    //running flag can be false only when server is stopping by receiving KILL message
    // or server can't start at the beginning
    while(running){
        
        {
            std::cout << "[INFO] Migration is triggered." << std::endl;
            std::unique_lock<std::shared_mutex> lock(system_mutex);
            migrate();
            std::cout << "[INFO] Migration is ended." << std::endl;
            //delay a bit to let slurm update the job state after migration
            std::this_thread::sleep_for(std::chrono::seconds(config.postMigrationSleepSeconds));
            std::cout << "[INFO] Node Control is triggered." << std::endl;
            node_control();
            std::cout << "[INFO] Node Control is ended." << std::endl;
        }
        
        std::unique_lock<std::mutex> lk(mtx);
        cv.wait_for(lk, std::chrono::seconds(config.migrationIntervalSeconds), [&]{return !running;});
    }
    std::cout << "[WARN] Migration thread is stopping." << std::endl;
    return 0;
}
