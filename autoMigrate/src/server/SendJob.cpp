#include <iostream>
#include <string>
#include <vector>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>

#include "SendJob.h"
#include "Migrator.h"
#include "NodeControl.h"

void send(std::vector<std::string> input) {

    std::string command = "sudo -i -u " + input[4] +
    " env PATH=$PATH sendJob" +
    " -j " + input[0] +
    " -a \"" + input[1] + "\" "
    " -n " + input[2] +
    " -p " + input[3];

    std::cout << command << std::endl;
    system(command.c_str());

}

void send_job(int clientSocket) {
    std::vector<std::string> response_message_list = {
        "Enter Job Path: ",
        "Enter Argument of your program: ",
        "Enter number of nodes: ",
        "Enter number of processes: ",
        "exit"
    };

    std::vector<std::string> input;

    char buffer[1024];
    size_t count = 0;

    while (count < response_message_list.size()) {
        const std::string& message = response_message_list[count];
        
        ssize_t bytes_sent = send(clientSocket, message.c_str(), message.length(), 0);
        if (bytes_sent <= 0) break;

        std::memset(buffer, 0, sizeof(buffer));
        ssize_t bytes_received = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_received <= 0) {
            std::cerr << "Client disconnected or error occurred.\n";
            break;
        }

        input.push_back(buffer);

        count++;
    }
    
    std::shared_lock<std::shared_mutex> lock(system_mutex, std::try_to_lock);

    if(!lock.owns_lock()){
        std::cout << "Migration in progress. Rejecting client.\r\n\r\n" << std::endl;
        std::string errorMsg = "migrate";
        send(clientSocket, errorMsg.c_str(), errorMsg.size(), 0);
    }
    else{
        send(input);
        sleep(10);
	node_control();

    }
    close(clientSocket);
}
