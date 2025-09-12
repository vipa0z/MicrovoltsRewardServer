
## MV Overvolts Overview

The MVO Rewards Server handles various in-game reward mechanisms and administrative tasks.
```
    |  \/  | \ \ / /  / _ \  
    | |\/| |  \ V /  | (_) | 
    |_|__|_|  _\_/_   \___/  
    _|"""""|_| """"|_|"""""| 
    `-0-0-'  `-0-0-'  `-0-0-` 
    
Microvolts OverVolt v 0.5
──────────────────────────────────────────────────────────────
```



## Table of Contents

- [Features](#features)
- [Development Status](#development-status)
- [Compatibility](#compatibility)
- [Authentication](#authentication)
- [Documentation](#documentation)

---

## Features
- **Referral Wheel** 
- **Achievement system** 
- **Event Shop** 
- **daily playtime chest**
- **GUI** (🔜 Planned)

## Development Status
The good news is that most of the features I wanted are in here!

The catch is that I haven't had a chance to write tests for everything yet, so some parts are definitely more stable than others. You might run into some flaky behavior. If you find a bug, please let me know by opening an issue! 

![Microvolts](bea969fced10a14b443c0af9240b566e_w200.gif)


## Compatibility
- The server is not plug and play yet but can be tested with tools like Postman.
- It is designed to send rewards via API requests to the [MicrovoltsEmulator](https://github.com/SoWeBegin/MicrovoltsEmulator).



## Documentation

For a complete guide on setup, configuration, and API usage, please see the **[Full User Manual](./docs/README.md)**.

### Quick Navigation

*   **[Server Configuration](./docs/configuration/README.md)**: Learn how to set up your `.env` file, prepare the database, and create an admin user.
*   **[API Reference](./docs/api-reference/README.md)**: Detailed guides for every API endpoint, including request/response examples.
*   **[Core Systems](./docs/core-systems/README.md)**: An inside look at how the server handles configuration loading, validation, and in-memory caching.

