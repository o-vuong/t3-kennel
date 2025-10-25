# Kennel Management API Documentation

This directory contains the OpenAPI specification for the Kennel Management System API.

## Files

- `openapi.json` - Complete OpenAPI 3.0.3 specification
- `README.md` - This documentation file

## API Overview

The Kennel Management API is a HIPAA-compliant system for managing pet boarding facilities. It provides comprehensive functionality for:

- **Kennel Management**: Create, update, and manage kennel facilities
- **Pet Management**: Customer pet profiles with medical information
- **Booking System**: Schedule and manage pet stays
- **Payment Processing**: Handle transactions and refunds
- **Care Logging**: Track daily pet activities and health
- **Notifications**: User communications and alerts
- **Reporting**: Business analytics and insights
- **System Overrides**: Emergency access and special permissions

## Authentication

The API supports two authentication methods:

1. **Bearer Token Authentication**: JWT tokens for programmatic access
2. **Session Authentication**: Cookie-based sessions for web applications

## Base URL

- Development: `http://localhost:3000`
- Production: `https://api.kennel.app`

## API Endpoints

### Kennels
- `GET /api/trpc/kennels.list` - List available kennels
- `GET /api/trpc/kennels.getById` - Get kennel details
- `POST /api/trpc/kennels.create` - Create new kennel (Admin/Owner)
- `PUT /api/trpc/kennels.update` - Update kennel (Admin/Owner)
- `DELETE /api/trpc/kennels.delete` - Delete kennel (Admin/Owner)

### Pets
- `GET /api/trpc/pets.list` - List pets
- `GET /api/trpc/pets.getById` - Get pet details
- `POST /api/trpc/pets.create` - Create pet profile
- `PUT /api/trpc/pets.update` - Update pet profile
- `DELETE /api/trpc/pets.delete` - Delete pet profile

### Bookings
- `GET /api/trpc/bookings.list` - List bookings
- `GET /api/trpc/bookings.getById` - Get booking details
- `POST /api/trpc/bookings.create` - Create new booking
- `PUT /api/trpc/bookings.update` - Update booking
- `DELETE /api/trpc/bookings.cancel` - Cancel booking

### Payments
- `GET /api/trpc/payments.list` - List payments
- `GET /api/trpc/payments.getById` - Get payment details
- `POST /api/trpc/payments.create` - Process payment
- `POST /api/trpc/payments.refund` - Process refund (Admin/Owner)

### Care Logs
- `GET /api/trpc/careLogs.list` - List care logs
- `POST /api/trpc/careLogs.create` - Create care log entry

### Notifications
- `GET /api/trpc/notifications.list` - List notifications
- `POST /api/trpc/notifications.markAsRead` - Mark notification as read
- `POST /api/trpc/notifications.markAllAsRead` - Mark all notifications as read
- `POST /api/trpc/notifications.clearAll` - Clear all notifications

### Reports
- `GET /api/trpc/reports.bookings` - Booking analytics report
- `GET /api/trpc/reports.revenue` - Revenue analytics report

### Overrides
- `GET /api/trpc/overrides.list` - List system overrides
- `POST /api/trpc/overrides.issue` - Issue system override (Admin/Owner)
- `DELETE /api/trpc/overrides.revoke` - Revoke system override (Admin/Owner)

## Data Models

### Core Entities

- **User**: System users with role-based access
- **Pet**: Customer pet profiles with medical information
- **Kennel**: Boarding facilities with amenities and pricing
- **Booking**: Pet stay reservations with status tracking
- **Payment**: Financial transactions and refunds
- **CareLog**: Daily pet care activities and health notes
- **Notification**: User communications and alerts

### User Roles

- **CUSTOMER**: Can manage pets, create bookings, view care logs
- **STAFF**: Can manage care logs, check pets in/out
- **ADMIN**: Can manage all entities, view reports, process refunds
- **OWNER**: Full system access including overrides and system configuration

## Error Handling

The API uses standard HTTP status codes and returns structured error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

Common error codes:
- `BAD_REQUEST` (400): Invalid input parameters
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Login endpoints**: 5 requests per minute
- **API endpoints**: 60 requests per minute
- **CSP reports**: 5 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Security

The API implements comprehensive security measures:

- **HTTPS Only**: All production traffic encrypted
- **CORS Protection**: Cross-origin request validation
- **CSP Headers**: Content Security Policy enforcement
- **Rate Limiting**: Request throttling and abuse prevention
- **Input Validation**: All inputs validated using Zod schemas
- **Role-Based Access**: Granular permission system
- **Audit Logging**: Complete audit trail for compliance

## HIPAA Compliance

The system is designed for HIPAA compliance with:

- **Data Encryption**: All PHI encrypted at rest and in transit
- **Access Controls**: Role-based access with audit trails
- **Audit Logging**: Complete activity logging
- **Data Minimization**: Only necessary data collected
- **Secure Communication**: TLS 1.3 for all communications
- **Regular Backups**: Automated backup and recovery procedures

## Getting Started

1. **Authentication**: Obtain credentials from your system administrator
2. **Base URL**: Use the appropriate environment URL
3. **Headers**: Include authentication headers in requests
4. **Rate Limits**: Respect rate limiting guidelines
5. **Error Handling**: Implement proper error handling

## Examples

### List Kennels
```bash
curl -X GET "https://api.kennel.app/api/trpc/kennels.list?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Booking
```bash
curl -X POST "https://api.kennel.app/api/trpc/bookings.create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "petId": "pet_123",
    "kennelId": "kennel_456"
  }'
```

### Create Care Log
```bash
curl -X POST "https://api.kennel.app/api/trpc/careLogs.create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity": "Feeding",
    "notes": "Ate all food, good appetite",
    "bookingId": "booking_789"
  }'
```

## Support

For API support and questions:
- Email: support@kennel.app
- Documentation: [API Documentation](https://docs.kennel.app)
- Status: [System Status](https://status.kennel.app)

## Changelog

### Version 1.0.0
- Initial API release
- Complete CRUD operations for all entities
- Authentication and authorization
- Rate limiting and security measures
- HIPAA compliance features