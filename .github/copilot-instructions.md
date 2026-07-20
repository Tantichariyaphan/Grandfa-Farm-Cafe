# Copilot Instructions for Grandfa Cafe LINE OA

This file guides Copilot CLI sessions in developing the Grandfa Cafe LINE OA Express.js backend service.

## Quick Start

```bash
npm start                # Production server
npm run dev              # Development with auto-reload
npm test                 # Run all tests (Node.js test runner)
npm run migrate          # Run database migrations
npm run seed             # Seed database with initial data
```

**Test a specific file:** `node --test test/utils.test.js`

## Project Context

Grandfa Cafe LINE OA is an **independent Express.js backend** (not part of the Next.js frontend) that integrates with LINE Official Account for:
- Customer membership registration and authentication
- Loyalty stamps and reward coupon management  
- Chatbot with keyword-based responses
- Staff interfaces for stamp awards and coupon redemption

Two separate LINE channels are required: LINE Login (LIFF authentication) and Messaging API (chatbot/push notifications).

## Request & Response Pattern

**Every endpoint** follows the same shape using utilities in `utils/response.js`:

```javascript
// Success responses
ok(res, data, message, statusCode)           // 200 (or custom status)
created(res, data, message)                  // 201 Created

// Error responses
fail(res, statusCode, message, errors)       // errors is array of field/msg pairs
```

All error responses include `{ success: false, message, errors }`.

## Core Patterns

### Error Handling
- **AppError**: Custom error class with HTTP status code, thrown in services/routes
- **asyncHandler**: Wraps async route handlers; passes thrown errors to global `errorHandler`
- **errorHandler middleware**: Catches all errors, formats responses, logs unexpecteds

Route usage: Every async handler must be wrapped:
```javascript
asyncHandler(async (req, res) => { /* ... */ })
```

### Input Validation
Use `express-validator` with the `validate` middleware:
```javascript
router.post('/x', validate([
  body('email').isEmail().withMessage('Invalid email'),
  body('age').isInt({ min: 18 }).withMessage('Must be 18+'),
]), asyncHandler(handler))
```

Validation errors automatically throw AppError(422) with field/message pairs.

### Database
- **query(sql, params)**: Execute parameterized queries with automatic logging in dev
- **withTransaction(callback)**: Wrap multi-step operations that must be atomic (e.g., stamp award + reward coupon)
- Connection pool: 10 max connections, 30s idle timeout, configured for serverless

**Always use parameterized queries** — never interpolate user input.

### Authentication
Three middleware types in `middleware/`:
- **requireMemberAuth**: Verifies JWT from LIFF member app; attaches `req.member`
- **requireStaffAuth**: Verifies staff JWT; attaches `req.staff`
- **requireOwnerAuth**: Extends staff auth; enforces owner role

## Service Organization

`services/` by domain:
- **chatbot/**: Webhook handling, keyword replies, event parsing
- **coupon/**: Issuance, validation, redemption, QR sessions
- **line/**: LINE Bot SDK client, message builders (reply, push, flex, broadcast)
- **membership/**: Registration, LINE auth, profile, staff auth
- **stamp/**: Stamp awards, transaction tracking, reward generation
- **notification/**: Push notifications, broadcast scheduling
- **staff**: Staff management, dashboard data

Each service owns its business logic; routes orchestrate and validate.

## Key Environment Variables

- `DATABASE_URL` — PostgreSQL connection
- `LINE_LOGIN_CHANNEL_*` — LINE Login credentials (LIFF auth)
- `LINE_CHANNEL_*` — Messaging API credentials (chatbot/notifications)
- `LIFF_ID_MEMBER`, `LIFF_ID_STAFF` — LIFF app IDs
- `JWT_SECRET` — Member token signing
- `QR_SIGNING_SECRET` — Tamper-proof QR codes
- `MAINTENANCE_TOKEN` — Cron job auth

See `.env.example` for full list. `config/index.js` validates all required vars at startup.

## LINE Integration Details

**LIFF Apps** (LINE Front-end Framework):
- `/liff/member` — Member card, stamps, coupon list
- `/liff/staff` — Stamp award form, coupon redemption interface

**Webhook** (`/webhook`):
- Receives LINE events (follow, message, postback, etc.)
- Auto-registers followers as members
- Replies to text messages via keyword matching (30s reply token window)
- Calls services in `services/chatbot/`

**Message Sending**:
- **replyMessage** — Immediate response within webhook (free, fast)
- **pushMessage** — Async notification outside webhook context
- **Flex messages** — Rich UI for cards, menus (see `services/line/flexMessage.js`)

## Running Tests

```bash
npm test                          # All tests
node --test test/utils.test.js   # Single file
```

Tests use Node.js built-in runner (`node:test`). Test files in `test/`.

## Core Data Model

**Key tables** (PostgreSQL):
- `members` — Customers (linked to LINE user ID)
- `staff` — Staff accounts (owner or staff role)
- `transactions` — Purchases that trigger stamps
- `stamps` — Loyalty stamps earned
- `coupons` — Rewards (types: reward, birthday, holiday, promotion, welcome)
- `promotions` — Active campaigns
- `chat_keywords` — Chatbot keywords and responses
- `notifications` — Push/broadcast log

Schema in `database/schema.sql`.

## Loyalty Rules

- **10 stamps = 1 reward coupon** (configurable in `config/index.js`)
- **Coupon expiry**: 90 days default
- **Birthday coupons**: Auto-generated daily at 2 AM UTC via cron job
- Coupon types: reward, birthday, holiday, promotion, welcome

## Deployment

Deployed on Render.com:
- Health checks: `/health`, `/ready`
- Daily cron job for birthday coupons (2 AM UTC)
- See `render.yaml` for infrastructure

## Rate Limiting & Security

- `/api/*` routes limited to 100 requests/60s
- Helmet middleware for security headers
- CORS restricted to configured origins
- Passwords hashed with bcryptjs
- JWT expiry: 7d members, 12h staff
- QR tokens signed to prevent tampering
