# Digital Menu API Documentation

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Products](#products)
- [Orders](#orders)
- [Vouchers](#vouchers)
- [Visitors](#visitors)

## Base URL

All URLs referenced in the documentation have the following base:

```
http://localhost:5050/api
```

## Authentication

Authentication is handled using JSON Web Tokens (JWT).

### Register a new user

```
POST /auth/register
```

**Request Body**:

```json
{
  "displayName": "User Name",
  "username": "username",
  "email": "user@example.com",
  "password": "password"
}
```

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```
POST /auth/login
```

**Request Body**:

```json
{
  "username": "username",
  "password": "password"
}
```

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Orders

### Get All Orders

```
GET /orders
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "orderNumber": "210622-0001",
      "tableNumber": "5",
      "items": [
        {
          "product": "60d21b4667d0d8992e610c85",
          "productDetails": {
            "name": "بيتزا بيروني غنائي",
            "price": 140,
            "image": "https://example.com/image.jpg"
          },
          "quantity": 2,
          "notes": "Extra cheese"
        }
      ],
      "totalAmount": 280,
      "status": "pending",
      "paymentMethod": "cash",
      "paymentStatus": "unpaid",
      "customer": {
        "name": "John Doe",
        "phone": "123-456-7890"
      },
      "notes": "Please deliver quickly",
      "createdAt": "2023-06-22T10:30:00.000Z",
      "updatedAt": "2023-06-22T10:30:00.000Z"
    }
  ]
}
```

### Get Single Order

```
GET /orders/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001",
    "tableNumber": "5",
    "items": [
      {
        "product": "60d21b4667d0d8992e610c85",
        "productDetails": {
          "name": "بيتزا بيروني غنائي",
          "price": 140,
          "image": "https://example.com/image.jpg"
        },
        "quantity": 2,
        "notes": "Extra cheese"
      }
    ],
    "totalAmount": 280,
    "status": "pending",
    "paymentMethod": "cash",
    "paymentStatus": "unpaid",
    "customer": {
      "name": "John Doe",
      "phone": "123-456-7890"
    },
    "notes": "Please deliver quickly",
    "createdAt": "2023-06-22T10:30:00.000Z",
    "updatedAt": "2023-06-22T10:30:00.000Z"
  }
}
```

### Create Order

```
POST /orders
```

**Request Body**:

```json
{
  "items": [
    {
      "productId": "60d21b4667d0d8992e610c85",
      "quantity": 2,
      "notes": "Extra cheese"
    }
  ],
  "tableNumber": "5",
  "notes": "Please deliver quickly",
  "customer": {
    "name": "John Doe",
    "phone": "123-456-7890"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001",
    "tableNumber": "5",
    "items": [
      {
        "product": "60d21b4667d0d8992e610c85",
        "productDetails": {
          "name": "بيتزا بيروني غنائي",
          "price": 140,
          "image": "https://example.com/image.jpg"
        },
        "quantity": 2,
        "notes": "Extra cheese"
      }
    ],
    "totalAmount": 280,
    "status": "pending",
    "paymentMethod": "cash",
    "paymentStatus": "unpaid",
    "customer": {
      "name": "John Doe",
      "phone": "123-456-7890"
    },
    "notes": "Please deliver quickly",
    "createdAt": "2023-06-22T10:30:00.000Z",
    "updatedAt": "2023-06-22T10:30:00.000Z"
  }
}
```

### Update Order

```
PUT /orders/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body**:

```json
{
  "status": "preparing",
  "paymentStatus": "paid",
  "notes": "Customer already paid"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001",
    "status": "preparing",
    "paymentStatus": "paid",
    "notes": "Customer already paid",
    "updatedAt": "2023-06-22T11:30:00.000Z"
  }
}
```

### Delete Order

```
DELETE /orders/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "data": {},
  "message": "Order deleted"
}
```

## Vouchers

### Get All Vouchers

```
GET /vouchers
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "code": "WELCOME10",
      "type": "percentage",
      "value": 10,
      "maxDiscount": 50,
      "minOrderValue": 100,
      "description": "10% off your first order",
      "isActive": true,
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-07-01T00:00:00.000Z",
      "maxUses": 1000,
      "usedCount": 50,
      "createdAt": "2023-06-01T10:30:00.000Z",
      "updatedAt": "2023-06-22T10:30:00.000Z"
    }
  ]
}
```

### Get Single Voucher

```
GET /vouchers/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "maxDiscount": 50,
    "minOrderValue": 100,
    "description": "10% off your first order",
    "isActive": true,
    "startDate": "2023-06-01T00:00:00.000Z",
    "endDate": "2023-07-01T00:00:00.000Z",
    "maxUses": 1000,
    "usedCount": 50,
    "createdAt": "2023-06-01T10:30:00.000Z",
    "updatedAt": "2023-06-22T10:30:00.000Z"
  }
}
```

### Create Voucher

```
POST /vouchers
```

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body**:

```json
{
  "code": "SUMMER25",
  "type": "percentage",
  "value": 25,
  "maxDiscount": 100,
  "minOrderValue": 200,
  "description": "25% off for summer",
  "startDate": "2023-07-01T00:00:00.000Z",
  "endDate": "2023-08-31T23:59:59.000Z",
  "maxUses": 500
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "code": "SUMMER25",
    "type": "percentage",
    "value": 25,
    "maxDiscount": 100,
    "minOrderValue": 200,
    "description": "25% off for summer",
    "isActive": true,
    "startDate": "2023-07-01T00:00:00.000Z",
    "endDate": "2023-08-31T23:59:59.000Z",
    "maxUses": 500,
    "usedCount": 0,
    "createdAt": "2023-06-22T10:30:00.000Z",
    "updatedAt": "2023-06-22T10:30:00.000Z"
  }
}
```

### Update Voucher

```
PUT /vouchers/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body**:

```json
{
  "isActive": false,
  "description": "Deactivated summer promotion"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "code": "SUMMER25",
    "isActive": false,
    "description": "Deactivated summer promotion",
    "updatedAt": "2023-06-23T10:30:00.000Z"
  }
}
```

### Delete Voucher

```
DELETE /vouchers/:id
```

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "data": {}
}
```

### Validate Voucher

```
POST /vouchers/validate
```

**Request Body**:

```json
{
  "code": "WELCOME10",
  "orderValue": 200
}
```

**Response (valid voucher)**:

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "voucherId": "60d21b4667d0d8992e610c85",
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "discountAmount": 20,
    "originalValue": 200,
    "finalValue": 180
  }
}
```

**Response (invalid voucher)**:

```json
{
  "success": false,
  "message": "Voucher cannot be applied: minimum order value not met (300)",
  "data": {
    "isValid": false,
    "reason": "minimum order value not met (300)",
    "minOrderValue": 300
  }
}
```

### Apply Voucher

```
POST /vouchers/apply
```

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body**:

```json
{
  "voucherId": "60d21b4667d0d8992e610c85",
  "orderValue": 200
}
```

**Response**:

```json
{
  "success": true,
  "message": "Voucher applied successfully",
  "data": {
    "voucherId": "60d21b4667d0d8992e610c85",
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "discountAmount": 20,
    "originalValue": 200,
    "finalValue": 180,
    "usedCount": 51
  }
}
```

## WebSocket Notifications

The Digital Menu server uses WebSockets to notify connected clients about important events in real-time. The WebSocket server is available at:

```
ws://localhost:5050
```

### Message Types

The server sends the following types of notification messages:

#### New Order

```json
{
  "type": "new_order",
  "data": {
    "orderId": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001",
    "items": 3,
    "timestamp": "2023-06-22T10:30:00.000Z"
  },
  "timestamp": "2023-06-22T10:30:00.000Z"
}
```

#### Order Updated

```json
{
  "type": "order_updated",
  "data": {
    "orderId": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001",
    "status": "preparing",
    "updatedAt": "2023-06-22T11:30:00.000Z"
  },
  "timestamp": "2023-06-22T11:30:00.000Z"
}
```

#### Order Deleted

```json
{
  "type": "order_deleted",
  "data": {
    "orderId": "60d21b4667d0d8992e610c85",
    "orderNumber": "210622-0001"
  },
  "timestamp": "2023-06-22T12:30:00.000Z"
}
```

#### Voucher Created/Updated/Deleted

```json
{
  "type": "voucher_created",
  "data": {
    "voucherId": "60d21b4667d0d8992e610c85",
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10
  },
  "timestamp": "2023-06-22T10:30:00.000Z"
}
```

### Connection Example

```javascript
const socket = new WebSocket("ws://localhost:5050");

socket.onopen = function (e) {
  console.log("Connection established");
};

socket.onmessage = function (event) {
  const message = JSON.parse(event.data);
  console.log(`Received notification: ${message.type}`, message.data);

  // Handle different notification types
  switch (message.type) {
    case "new_order":
      // Handle new order notification
      break;
    case "order_updated":
      // Handle order update notification
      break;
    // Handle other notification types
  }
};

socket.onclose = function (event) {
  if (event.wasClean) {
    console.log(
      `Connection closed cleanly, code=${event.code} reason=${event.reason}`
    );
  } else {
    console.log("Connection died");
  }
};

socket.onerror = function (error) {
  console.log(`WebSocket Error: ${error.message}`);
};
```
