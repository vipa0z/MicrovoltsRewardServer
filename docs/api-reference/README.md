# API Reference

This section provides detailed information about the API endpoints available on the MVO Rewards Server.

## Authentication

Most endpoints require a JSON Web Token (JWT) for authentication. The token must be included in the `Authorization` header of your request.

**Format:** `Authorization: Bearer <your_jwt_token>`

Tokens are obtained via the `/api/login` endpoint.

## Table of Contents

* [Postman Documentation](https://documenter.getpostman.com/view/40053537/2sB3HooypU#849aa71a-0d1f-449d-ac3e-47a512c33f11)

*   [Authentication](./api-reference/auth.md)
*   [Admin](./api-reference/admin.md)
*   [Spinning Wheel](./api-reference/wheel.md)
*   [Event Shop](./api-reference/shop.md)
*   [Achievements](./api-reference/achievements.md)
*   [Daily Playtime](./api-reference/daily-playtime.md)
