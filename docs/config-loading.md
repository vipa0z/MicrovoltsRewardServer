# Configuration Loading & Validation

The server relies on a robust system to load, validate, and manage configuration files for various reward modules. This process is primarily handled by `util/ConfigValidator.js` and orchestrated during startup by `util/cliUtil.js`.

## Startup Process (`validateAndLoadConfigs`)

When the server starts, the `validateAndLoadConfigs` function is called. It performs the following steps for each reward category (`wheel`, `shop`, `playtime_draw`, `achievements`):

1.  **Validation Skip Check:** It first checks if the `DISABLE_ITEM_VALIDATION` environment variable is set to `true`. If so, all validation steps are skipped, and configs are loaded directly into memory. This is useful for development but not recommended for release.

2.  **Load `itemInfo.json`:** If validation is enabled, it calls `MemoryLoader.loadAndTransformItemsInfo()` to ensure the master list of all available items is loaded and cached. (See [In-Memory Caching](./memory-caching.md) for details).

3.  **Validate Config File (`validateConfigFileOnStartup`):** For each category, this function is called to perform critical checks:
    *   **File Existence:** It checks if the corresponding JSON file (e.g., `wheel_items_data.json`) exists in `data/configs/`. If not, it creates a new file with a default empty structure.
    *   **JSON Validity:** It ensures the file contains valid JSON. If parsing fails, it creates a backup of the invalid file and exits to prevent corruption.
    *   **Structure Validation:** It verifies that the JSON has the correct top-level key (e.g., `"wheel_items_data": [...]`).
    *   **Item Structure Validation (`validateItemStructure`):** Each item within the configuration array is checked to ensure it has the required fields (`itemId`, `itemName`, `itemOption`) and that category-specific fields (like `price` for shop items or `dropRate` for playtime rewards) are present and have the correct data type.
    *   **Item ID Validation:** The `itemId` of every reward in the config file is cross-referenced with the master item list loaded from `itemInfo.json`. If an `itemId` does not exist in the master list, the server will log an error and exit, preventing the use of invalid items.

4.  **Load into Memory:** Once a configuration file is successfully validated, `MemoryLoader.loadCategoryItemsIntoMemory()` is called to load its contents into the application's memory for fast access.

This strict, sequential process ensures that the server only runs with valid, well-formed configuration, preventing runtime errors and ensuring all rewards correspond to real in-game items.
