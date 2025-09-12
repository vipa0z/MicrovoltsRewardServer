# Referral Wheel API

Endpoints for interacting with the referral wheel, which rewards players based on playtime.

## Overview

The Referral Wheel system is designed to reward players with in-game items for their accumulated playtime. It mimics the referral system from the original game. Eligibility to spin the wheel is determined by the `WHEEL_DRAW_TRIGGER` value set in the `.env` file, which specifies the number of playtime hours required to earn one spin.

### Eligibility Checks

The system performs the following checks to determine if a player can spin the wheel:

1.  **Calculate Total Spins:** It divides the player's total playtime (in seconds) by the required playtime per spin (in seconds).
2.  **Determine Available Spins:** It subtracts the number of spins the player has already claimed from their total calculated spins.
3.  **Check Eligibility:** If the player has one or more available spins, they are eligible.
4.  **Calculate Time to Next Spin:** If the player is not eligible, the system calculates the remaining hours of playtime needed to earn the next spin.

### Logging

To maintain a record of rewards and mimic the original game's referral system, every successful spin is logged. When a player wins an item, a new entry is added to a log file located at `public/wheel.log`. Each log entry contains a timestamp, the player's nickname, and the name of the item they won.

---

### Get Wheel Items and Player Status

*   **Endpoint:** `GET /api/wheel/items`
*   **Authentication:** User

Retrieves the list of possible wheel items and the player's current spin status.

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "canSpin": true,
    "remainingSpins": 2,
    "hoursUntilNextSpin": 0,
    "wheelItems": [
      {
        "itemId": 10001,
        "itemName": "Apsu",
        "itemOption": " "
      },
      {
        "itemId": 4600050,
        "itemName": "Wreath Crown",
        "itemOption": "Shotgun bullets"
      }
    ]
  }
}
```

#### Error Responses

*   **500 Internal Server Error:** For general server errors.

---

### Draw from the Wheel

*   **Endpoint:** `POST /api/wheel/draw`
*   **Authentication:** User

Attempts to spin the wheel for the authenticated player.

#### Request Body

(Empty)

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Congratulations! You won Classic Rifle",
    "remainingSpins": 1
  }
}
```

#### Error Responses

*   **403 Forbidden:** If the user is not eligible to spin (e.g., not enough playtime).
    ```json
    {
      "error": "You need 10 more hours to claim a spin",
      "hoursUntilNextSpin": 10,
      "remainingSpins": 0
    }
    ```
*   **500 Internal Server Error:** For general server errors.