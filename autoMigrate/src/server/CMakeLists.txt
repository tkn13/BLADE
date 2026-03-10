set(SERVER_SOURCES
    main.cpp
    server.cpp
    SendJob.cpp
)

set(CLIENT_SOURCES
    client.cpp
)


find_package(Threads REQUIRED)

add_executable(server ${SERVER_SOURCES})
add_executable(client ${CLIENT_SOURCES})

target_include_directories(server PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_include_directories(client PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

target_link_libraries(server 
PRIVATE 
migrator_lib
node_control_lib 
Threads::Threads)