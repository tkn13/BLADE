#include <iostream>
#include <unistd.h>
#include <vector>
#include <string>
#include <shared_mutex>

#include "JobDetail.h"
#include "SlurmInterface.h"
#include "JobPacker.h"
#include "Migrator.h"
#include "NodeControl.h"

std::shared_mutex system_mutex;

int migrate() {
   
    std::vector<JobDetail> jobDetails;
    
    getJobDetails(jobDetails);

    rearrangeJobs(jobDetails);

    if (migrateDecision(jobDetails)) {
        
	    migrator(jobDetails);
	
	    for(const auto& jobDetail : jobDetails) {
		std::cout << "Job ID: " << jobDetail.jobId 
		<< ", CPUs: " << jobDetail.cpus 
                << ", SrcNode: " << jobDetail.srcNode.getNodeName() 
                << ", DestNode: " << jobDetail.destNode.getNodeName()
                << std::endl;
    		}

   } else {
        //std::cout << "No migration needed." << std::endl;
    }

    return 0;
}

int migrate(std::atomic<bool>& running, std::condition_variable& cv, std::mutex& mtx) {
    //running flag can be false only when server is stopping by receiving KILL message
    // or server can't start at the beginning
    while(running){
        
        {
            std::cout << "Migration is in progresss..." << std::endl;
            std::unique_lock<std::shared_mutex> lock(system_mutex);
            migrate();
            std::cout << "Migration done!" << std::endl;
            sleep(10);
	    node_control();
        }
        
        std::unique_lock<std::mutex> lk(mtx);
        cv.wait_for(lk, std::chrono::seconds(60), [&]{return !running;});
    }
    std::cout << "Migrator stopping..." << std::endl;
    return 0;
}
