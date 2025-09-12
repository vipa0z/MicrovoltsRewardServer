# MVO Rewards Server User Manual

## Introduction

This document serves as a user manual and reference for the MVO Rewards Server. This server provides a backend for various in-game reward systems for Microvolts, including a spinning wheel, an event shop, daily playtime rewards, and an achievement system.

## Detailed Documentation

*   **[Server Configuration](./configuration.md)**
    *   Learn about environment variables, database setup (`--populate`), and creating an admin user (`--create-admin`).

*   **[API Reference](./api-reference/README.md)**
    *   Detailed guides for every API endpoint. 

*   **[Memory Caching](./memory-caching.md)**
    *   Details about how the server handles in-memory caching.

*   **[Config Loading](./config-loading.md)**
    *   Details about how the server processes and validates configuration files.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Microvolts_win_galore
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Usage

To start the server, run the following command:

```bash
node server.js
```

### Command-Line Arguments

The server supports the following command-line arguments:

*   `--populate`: Runs database migrations and updates before starting the server.
*   `--create-admin <username> <password>`: Creates an initial admin user.
*   `--help` or `-h`: Displays the help menu.

See the [Server Configuration](./configuration.md) guide for more details.

## Scripts

### `util/scripts/generateAchievementData.js`

This script generates the `data/configs/achievements_data.json` file. This file contains the definitions for all level-up and weapon-kill achievements. To regenerate this file, run:

```bash
node util/scripts/generateAchievementData.js
```
