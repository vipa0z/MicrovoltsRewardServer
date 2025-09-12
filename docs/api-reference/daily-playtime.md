# Daily Playtime API

Endpoints for the daily playtime reward system.

---

### Get Playtime Progress

*   **Endpoint:** `GET /api/daily-chest/progress`
*   **Authentication:** User

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "canDraw": true,
    "progress": 7200
  }
}
```
*   **`canDraw`**: A boolean indicating if the player has met the required playtime.
*   **`progress`**: The player's current playtime in seconds.

---

### Draw Daily Reward

*   **Endpoint:** `POST /api/daily-chest/claim`
*   **Authentication:** User

#### Request Body

(Empty)

#### Success Response (200 - Reward Claimed)

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Congratulations you won 1,000 Battery",
    "progress": 0,
    "progressPercentage": "0%"
  }
}
```

#### Success Response (200 - Not Enough Playtime)

If the user attempts to draw but has not met the playtime requirement.

```json
{
  "success": false,
  "message": "Not enough playtime to draw a reward",
  "data": {
    "canDraw": false,
    "progress": 3600,
    "progressPercentage": "50%"
  }
}
```

#### Error Responses

*   **401 Unauthorized:** If the user is not authenticated.
*   **500 Internal Server Error:** For general server errors.
