
## Overview

The script menu handles various in-game reward mechanisms and administrative tasks.

```text

    |  \/  | \ \ / /  / _ \  
    | |\/| |  \ V /  | (_) | 
    |_|__|_|  _\_/_   \___/  
    _|"""""|_| """"|_|"""""| 
    `-0-0-'  `-0-0-'  `-0-0-` 
    
Rewards Server v 0.5
──────────────────────────────────────────────────────────────
[+] MVO Scripts Menu
```

## Usage

To run the server or execute specific scripts, use the `node server.js` command followed by the desired options.

```bash
node server.js [--populate] [--create-admin <username> <password>] [--help]
```

### Options

*   `--populate`: Run DB migrations/updates before starting.
*   `--create-admin <username> <password>`: Create initial admin user.
*   `--cache-reset`: Updates the cached `itemsinfo` file after changing `ItemInfo.json`.
*   `--generate-achievements`: Runs the `generateAchievementData.js` script.
*   `--generate-chest`: Runs the `generateDailyChestItems.js` script.
*   `--help`: Show this help message.

---

## Server Configuration

This guide covers the initial setup and configuration of the Server.

## Data Files
The server relies on specific JSON files for item and weapon information. These files are required in the `data/` folder.

> ⚠️ You can use your own custom `itemsInfo.json` and `itemWeaponInfo.json` files by placing them in the `data/` folder and Refresh the cache using `--cache-reset`.  


### Required JSON Files

- `itemsInfo.json`
- `itemWeaponInfo.json`

### Using the Provided Archive

The JSON files are provided in a `.rar` archive within the `data/` folder. To use them:

1. Extract the files from the archive:

```bash
# Example using unrar (ensure unrar is installed)
unrar x data/archive.rar data/
```

### Environment Variables

The server is configured using a `.env` file. Create this file by copying the provided `.env.example` and filling in the values.

*   `PORT`: The port the server will run on (e.g., `3000`).
*   `DB_HOST`: The hostname or IP address of your MySQL database.
*   `DB_USER`: The username for your MySQL database.
*   `DB_PASSWORD`: The password for your MySQL database.
*   `DB_NAME`: The name of your MySQL database.
*   `USER_JWT_SECRET`: A secret key for signing JSON Web Tokens (JWTs) for regular users.
*   `ADMIN_JWT_SECRET`: A secret key for signing JWTs for admin/staff users.
*   `EMU_JWT_SECRET`: The JWT secret used by the Microvolts Emulator for API communication.
*   `EMU_API_URL`: The base URL for the Microvolts Emulator API (e.g., `http://localhost:8080/api`).
*   `DAILY_PLAYTIME_DRAW_TRIGGER`: The number of hours a player must be playing to be eligible for a daily playtime reward. Default is 2 hours.
*   `WHEEL_DRAW_TRIGGER`: The number of hours a player must complete to earn one spin on the wheel. Default is 160 hours.

---

## Command-Line Option Details

This section provides more detailed information on specific command-line options.

### `--populate` (Database Setup)

The `--populate` command is a one-time setup step that prepares your database. It should be run before the first server startup or after significant database schema changes.

**Usage:**

```bash
node server.js --populate
```

This command executes the `dbUpdater.js` script, which performs the following actions:

1.  **Ensures Reward Columns Exist:** It checks the `users` table for the following columns and adds them if they are missing. This is crucial for the server to function correctly.
    *   `WheelSpinsClaimed` (INT, DEFAULT 0)
    *   `TwoHoursCounter` (INT, DEFAULT 0)
    *   `dailySpinsClaimed` (INT, DEFAULT 0)
    *   `EventCurrency` (INT, DEFAULT 0)

2.  **Ensures Player Achievements Table Exists:** It creates the `player_achievements` table if it does not already exist. This table tracks which achievements each player has claimed.

    ```sql
    CREATE TABLE player_achievements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        AchievementSlug VARCHAR(50) NOT NULL UNIQUE,
        AccountId INT NOT NULL,
        CONSTRAINT fk_user
            FOREIGN KEY (AccountId) REFERENCES users(AccountID)
            ON DELETE CASCADE
    )
    ```

After running successfully, the script will exit. You can then start the server normally.

### `--create-admin <username> <password>` (Admin User Creation)

The `--create-admin` command allows you to create an initial administrator account.

**Usage:**

```bash
node server.js --create-admin <username> <password>
```

**Example:**

```bash
node server.js --create-admin AdminUser P@ssword123!
```

**Requirements:**

*   **Username:** Must be at least 3 characters long and contain only alphanumeric characters (`A-Z`, `a-z`, `0-9`).
*   **Password:** Must be at least 6 characters long and include at least one non-alphanumeric symbol (e.g., `!`, `@`, `#`, `_`).

This command will create a new user with `Grade` 7, which is the highest administrative level. If a user with the specified username already exists, the script will notify you and exit without making changes.