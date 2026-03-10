
add_library(node_control_lib
    SlurmInterface.cpp
)

target_include_directories(node_control_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

add_executable(node_control_bin NodeControl.cpp)
target_link_libraries(node_control_bin PRIVATE node_control_lib)