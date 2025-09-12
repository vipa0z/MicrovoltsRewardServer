# Admin API

Endpoints for administrative tasks. All endpoints in this section require Admin-level authentication.

---

### Register a Staff Member

*   **Endpoint:** `POST /api/register-staff`
*   **Authentication:** Admin (Grade 4 or higher)

#### Request Body

```json
{
  "username": "newstaff",
  "password": "StaffP@ssword!",
  "nickname": "NewStaff",
  "grade": 2
}
```
*   **grades as per emu docs:**:
    *   `2`: Event Supporter
    *   `3`: Moderator
    *   `4`: Game Master
    *   `7`: Developer

#### Success Response (201)

```json
{
  "success": true,
  "message": "privileged user registered successfully"
}
```

#### Error Responses

*   **400 Bad Request:** If required fields are missing or the grade is invalid.
*   **403 Forbidden:** If the authenticated user's grade is less than 4.
*   **500 Internal Server Error:** For general server errors.

---

### Configure Reward Items

This is a generic endpoint to add new items to a reward category's configuration.

*   **Endpoint:**
    *   `POST /api/config/wheel`
    *   `POST /api/config/shop`
    *   `POST /api/config/achievements`
    *   `POST /api/config/daily-chest`
*   **Authentication:** Admin

#### Request Body

The body should be a JSON array of item objects. The structure of the objects depends on the category.

**Example for `/api/config/shop`:**

```json
[
  {
    "itemId": 12345,
    "itemName": "Example Sword",
    "itemOption": "PERM",
    "price": 50
  },
  {
    "itemId": 67890,
    "itemName": "Example Rifle",
    "itemOption": "30D",
    "price": 25
  }
]
```

*   **`itemId`**: The in-game ID of the item.
*   **`itemName`**: The name of the item.
*   **`itemOption`**: The duration or type (e.g., "PERM", "30D").
*   **`price`**: (Required for `shop_items_data`) The cost in Event Currency.
*   **`dropRate`**: (Required for `playtime_draw_data`) A number representing the drop chance weight.

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "category": "shop_items_data",
    "data": [
      {
        "itemId": [
          12345
        ],
        "itemName": "Example Sword",
        "itemOption": "PERM",
        "price": 50
      }
    ]
  },
  "message": "1 new item(s) added (duplicates skipped)."
}
```

#### Error Responses

*   **400 Bad Request:** If the request body is missing or malformed, if items have missing fields, or if an `itemId` is invalid (does not exist in `itemInfo.json`).
*   **500 Internal Server Error:** For general server errors.
