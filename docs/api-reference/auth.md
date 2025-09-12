# Authentication API

Endpoints for user registration and login.

---

### Register a New User

*   **Endpoint:** `POST /api/register`
*   **Authentication:** None

#### Request Body

```json
{
  "username": "testuser",
  "password": "password123",
  "nickname": "TestUser"
}
```

#### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "message": "User registered successfully"
  }
}
```

#### Error Responses

*   **400 Bad Request:** If required fields are missing, or if the username/nickname format is invalid.
*   **400 Bad Request:** If the username or nickname is already taken.
*   **500 Internal Server Error:** For general server errors.

---

### User Login

*   **Endpoint:** `POST /api/login`
*   **Authentication:** None

#### Request Body

```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "<your_jwt_token>"
  }
}
```

#### Error Responses

*   **400 Bad Request:** If `username` or `password` are missing.
*   **401 Unauthorized:** If credentials are invalid.
*   **500 Internal Server Error:** For general server errors.
