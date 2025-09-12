# In-Memory Caching & Item Transformation

To ensure high performance and reduce disk I/O, the server loads all item configurations and the master item list into memory on startup. This process is managed by `util/MemoryLoader.js`.

## The Master Item List (`itemInfo.json`)

The `itemInfo.json` file is the source of truth for all items that can exist in the game. However, its original format uses snake\_case keys (e.g., `ii_id`, `ii_name`). To make this data more developer-friendly (camelCase) and to speed up subsequent server starts, an automated transformation and caching mechanism is used.

### `loadAndTransformItemsInfo`

This function is responsible for processing the master item list:

1.  **Check for Cache:** On startup, it first looks for a file named `itemInfo.transformed.json` in the `data/` directory.
2.  **Load from Cache:** If the transformed file exists, it is read directly into memory. This is the fastest path and is used on all server starts after the very first one.
3.  **Transform and Cache:** If the transformed file does not exist (i.e., on the first run), the original `data/itemInfo.json` is read.
    *   Each item object in the file is iterated over.
    *   Keys are converted from snake\_case to camelCase (e.g., `ii_name` becomes `itemName`).
    *   The newly transformed array of items is saved as `itemInfo.transformed.json`.
4.  **Store in Memory:** The final array of transformed items is stored in the static `MemoryLoader.allItems` variable for global access.

This process ensures that the expensive task of reading and transforming the large `itemInfo.json` file only happens once.

## Reward Configurations

After the master item list is loaded, the specific reward configurations (wheel, shop, etc.) are also loaded into memory.

### `loadCategoryItemsIntoMemory`

This function takes a category name (e.g., `wheel_items_data`) and:
1.  Reads the corresponding validated configuration file from `data/configs/`.
2.  Parses the JSON data.
3.  Stores the array of items in the static `MemoryLoader.items` object under its category key.

### Accessing Cached Data

Services and controllers throughout the application can access this cached data without needing to read files from the disk:

*   `MemoryLoader.getAllItems()`: Returns the complete list of all transformed items.
*   `MemoryLoader.getItems(category)`: Returns the array of reward items for a specific category (e.g., `MemoryLoader.getItems('shop_items_data')`).
*   `MemoryLoader.getAchievementsData()`: A specific helper for retrieving the achievements configuration.

### Hot-Reloading (`reloadCategory`)

If a configuration is changed at runtime (e.g., via an admin API endpoint), the `MemoryLoader.reloadCategory(category)` function can be called to re-read the specified config file from disk and update the in-memory cache without requiring a server restart.
