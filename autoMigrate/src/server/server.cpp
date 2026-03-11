#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <vector>
#include <thread>
#include <shared_mutex>

#include "include/config.h"
#include "server.h"
#include "Migrator.h"
#include "SendJob.h"

static int local_server_socket = -1;
bool  server_running = true;



void handleClient(int clientSocket) {

    std::string buffer(1024, 0);
    ssize_t bytesRead = recv(clientSocket, &buffer[0], buffer.size(), 0);
    if (bytesRead > 0) {
        buffer.resize(bytesRead);
        std::cout << "Received message: " << buffer << std::endl;

        if (buffer == "TEST") {
            std::cout << "Received TEST command." << std::endl;
        }
        else if (buffer == "stask") {
            send_job(clientSocket);
        }
        else {
            std::cout << "Received " << buffer << ", command not recognized." << std::endl;
        }
    } else {
        std::cerr << "Failed to read message from client" << std::endl;
    }

    close(clientSocket);
}

void stopServer(){
    if(local_server_socket != -1){
        shutdown(local_server_socket, SHUT_RDWR);
        server_running = false;
    }
}

int startServer() {

    local_server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (local_server_socket == -1) {
        std::cerr << "Failed to create socket" << std::endl;
        return -1;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(WEB_CONFIG::PORT);

    if (bind(local_server_socket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == -1) {
        std::cerr << "Failed to bind socket" << std::endl;
        close(local_server_socket);
        return -1;
    }

    if (listen(local_server_socket, 5) == -1) {
        std::cerr << "Failed to listen on socket" << std::endl;
        close(local_server_socket);
        return -1;
    }

    while(server_running) {
        int clientSocket = accept(local_server_socket, nullptr, nullptr);
        
        if (clientSocket == -1) {
            if (!server_running) {
                break;
            }
            std::cerr << "Failed to accept client connection" << std::endl;
            continue;
        }

        std::thread(handleClient, clientSocket).detach();
    }

    std::cout << "Server shutting down." << std::endl;
    close(local_server_socket);
    std::cout << "Server shut down complete." << std::endl;
    return 0;
}
