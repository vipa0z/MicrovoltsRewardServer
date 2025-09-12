# Achievements API

Endpoints for viewing and claiming achievements.

---

### Get Self Achievements and Progress

*   **Endpoint:** `GET /api/self/achievements`
*   **Authentication:** User

#### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "slug": "level-up-10",
      "status": {
        "claimed": true,
        "unlocked": true,
        "inProgress": false,
        "overallPercent": 100
      }
    },
    {
      "slug": "sharpshooter-1",
      "status": {
        "claimed": false,
        "unlocked": true,
        "inProgress": false,
        "overallPercent": 100
      }
    },
    {
      "slug": "total-slayer-5",
      "status": {
        "claimed": false,
        "unlocked": false,
        "inProgress": true,
        "overallPercent": 65
      }
    }
  ]
}
```

---

### Get Another Player's Claimed Achievements

*   **Endpoint:** `GET /api/:nickname/achievements`
*   **Authentication:** User

#### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "achievementSlug": "level-up-10",
      "claimed": true
    },
    {
      "achievementSlug": "level-up-20",
      "claimed": true
    }
  ]
}
```

#### Error Responses

*   **404 Not Found:** If the player with the specified nickname does not exist.

---

### Claim an Achievement

*   **Endpoint:** `POST /api/achievements/claim`
*   **Authentication:** User

#### Request Body

```json
{
  "achievementSlug": "sharpshooter-1"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Achievement claimed successfully",
    "achievement": {
      "name": "Sharpshooter - 1",
      "rewards": [
        {
          "itemId": 4600001,
          "itemName": "100 MP",
        }
      ]
    }
  }
}
```

#### Error Responses
Requirements not met:
request: 
```
{
    "achievementSlug": "level-up-104"
}
```
response: 
```
{
    "success": false,
    "data": {
        "message": "Requirements not met: level 100/104"
    }
}
```
