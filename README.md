# BLADE: Beowulf Cluster Load Automation Dynamic nodE

**BLADE** is a power-aware High-Performance Computing (HPC) management system developed as a virtualized Beowulf cluster. It addresses high energy costs and idle power overhead in traditional HPC environments by intelligently managing compute resources based on workload demand.

## 🚀 Key Features

- **Dynamic Node Management**: Automatically powers compute nodes on or off using a "Load Auto-Scale" mechanism based on queue demand.
- **Live Process Migration (LPM)**: Leverages **DMTCP** (Distributed Multithreaded Checkpointing) to perform transparent checkpoint/restart operations, allowing jobs to move between physical hosts without progress loss.
- **Efficient Job Consolidation**: Implements a variation of the **First Fit Decreasing (FFD)** Bin-Packing algorithm to pack active processes onto the minimum number of nodes.
- **Real-time Monitoring**: A full-stack dashboard for tracking node metrics (CPU, Memory, Power) and job status.

## 📊 Performance Results

- **Energy Savings**: Reduced power consumption by up to **142.73 watts** by deactivating idle nodes.
- **Increased Efficiency**: Improved resource utilization by up to **44.32%** during low-workload scenarios.
- **Low Overhead**: LPM operations (Checkpoint to Restart) typically complete in approximately **1 second**.

## 🏗️ System Architecture

The project is composed of several integrated components:

- **Scheduler**: [Slurm](https://slurm.schedmd.com/) for job queue management.
- **Core Agent (`autoMigrate/`)**: C++ service responsible for migration logic and node control.
- **System Manager (`system/`)**: Manages job state and coordinates between Slurm and the migration engine.
- **Backend API (`backend/`)**: FastAPI-based service that queries metrics from InfluxDB and provides data to the dashboard.
- **Frontend Dashboard (`frontend/`)**: React-based web interface for real-time cluster visualization.
- **Monitoring Pipeline**: Uses Telegraf and InfluxDB for metric collection and storage.

## 📁 Directory Structure

```text
.
├── autoMigrate/      # C++ Migrator Agent and Node Control logic
├── backend/          # FastAPI Backend (Python)
├── frontend/         # React/Vite/Tailwind Dashboard (TypeScript)
├── system/           # CLI Utilities for job submission and migration
├── test/             # Evaluation and benchmarking scripts
```

## 🛠️ Getting Started

### Prerequisites

- Slurm Workload Manager
- DMTCP (Distributed Multithreaded Checkpointing)
- InfluxDB & Telegraf (for monitoring)
- Node.js & npm (for frontend)
- Python 3.9+ (for backend)
- C++ Compiler (GCC/Clang) & CMake

### Installation

1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    python main.py
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
3.  **AutoMigrate (Agent)**:
    ```bash
    cd autoMigrate
    mkdir build && cd build
    cmake ..
    make
    ```

### Usage

To submit a job to the BLADE system:
```bash
./script/sendJob -j <job_path> -a <arguments> -n <nodes> -p <processes>
```

To manually trigger a migration:
```bash
./script/migrate <jobId> <destinationNode>
```

## 🎓 Acknowledgments

Developed as a senior project at the Department of Computer Science, KMITL, using idle hardware to create a sustainable and efficient HPC solution.
