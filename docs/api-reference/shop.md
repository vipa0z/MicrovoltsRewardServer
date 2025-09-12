# Event Shop API

Endpoints for interacting with the event shop.

---

### Get Shop Items and Player Currency

*   **Endpoint:** `GET /api/shop/items`
*   **Authentication:** User

#### Success Response (200)

```json
{
  "success": true,
  "message": "Shop items loaded successfully",
  "data": {
    "items": [
      {
        "itemId": 54321,
        "itemName": "Special Character",
        "itemOption": "PERM",
        "price": 100
      }
    ],
    "EventCurrency": 150
  }
}
```

#### Error Responses

*   **401 Unauthorized:** If the user is not authenticated.
*   **500 Internal Server Error:** For general server errors.

---

### Purchase an Item

*   **Endpoint:** `POST /api/shop/buy`
*   **Authentication:** User

#### Request Body

```json
{
  "itemName": "Special Character"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Successfully purchased Special Character",
  "data": {
    "item": {
      "itemId": 54321,
      "itemName": "Special Character",
      "itemOption": "PERM",
      "price": 100
    },
    "currencyAmount": 50
  }
}
```

#### Error Responses

*   **400 Bad Request:** If `itemName` is missing, the item is not found, or the player has insufficient currency.
*   **401 Unauthorized:** If the user is not authenticated.
*   **500 Internal Server Error:** For general server errors.
