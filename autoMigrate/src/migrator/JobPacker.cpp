#include "Node.h"
#include "NodeList.h"
#include "JobDetail.h"
#include "BladeConst.h"
#include "JobPacker.h"
#include <string>
#include <vector>
#include <set>
#include <cstdlib>
#include <iostream>

void rearrangeJobs(std::vector<JobDetail>& jobDetails) {
    NodeList& nodeList = NodeList::getInstance();
    const std::vector<Node>& nodes = nodeList.getNodes();
    std::vector<int> nodecapacities;

    // Initialize node capacities
    for (const auto& node : nodes) {
        nodecapacities.push_back(node.getCpus());
    }

    for (auto& job : jobDetails) {
        for (size_t i = 0; i < nodes.size(); ++i) {
            if (job.cpus <= nodecapacities[i]) {
                job.destNode = nodes[i];
                nodecapacities[i] -= job.cpus;
                break;
            }
        }
    }
}

bool migrateDecision(const std::vector<JobDetail>& jobDetails) {
    std::set<std::string> srcSet;
    std::set<std::string> destSet;

    for (const auto& job : jobDetails) {
        srcSet.insert(job.srcNode.getNodeName());
        destSet.insert(job.destNode.getNodeName());
    }

    return destSet.size() < srcSet.size();
}

void migrator(const std::vector<JobDetail>& jobDetails) {
    for (const auto& job : jobDetails) {
        if (job.srcNode.getNodeName() != job.destNode.getNodeName()) {
            std::string command = "sudo -i -u " + job.user + " " + MIGRATE_CMD_LOCATION + " " + job.jobId + " " + job.destNode.getNodeName();
            std::cout << "Executing command: " << command << std::endl;
            system(command.c_str());
        }
    }
}