# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grandfa Cafe LINE OA Membership, Loyalty Stamp, and Coupon Platform - an Express.js backend service integrating with LINE Official Account for customer membership, loyalty stamps, and coupon management.

This is a **separate application** from the Next.js frontend in the parent directory. The parent directory contains a Next.js marketing website; this `line-oa/` directory is an independent Express.js backend.

## Development Commands

```bash
npm start                # Start production server
npm run dev              # Start development server with auto-reload
npm test                 # Run tests using Node.js test runner
npm run migrate          # Run database migrations
npm run seed             # Seed database with initial data
```

## Architecture

### Request Flow
Routes → Services → Database (PostgreSQL)
- Routes handle HTTP endpoints and input validation
- Services contain business logic and orchestrate database operations
- Database layer uses `pg` with connection pooling via `database/db.js`

### Key Patterns

**Error Handling**
- Use `AppError` class for custom errors with HTTP status codes
- Wrap all async route handlers with `asyncHandler` utility
- Global error handler catches and formats all errors into consistent JSON responses

**Response Format**
All endpoints use utilities from `utils/response.js`:
```javascript
ok(res, data, message, statusCode)      // Success response
created(res, data, message)              // 201 Created
fail(res, statusCode, message, errors)   // Error response
```

**Authentication Middleware**
- `requireMemberAuth` - LINE customer authentication via JWT (Member LIFF app)
- `requireStaffAuth` - Staff authentication via username/password JWT
- `requireOwnerAuth` - Owner-level authorization (extends staff auth)
- All attach authenticated user to `req.member` or `req.staff`

### Database

PostgreSQL with schema defined in `database/schema.sql`. Key tables:
- `members` - Customer profiles (linked to LINE user IDs)
- `staff` - Staff accounts (owner or staff role)
- `transactions` - Purchase records triggering stamp awards
- `stamps` - Loyalty stamps earned per transaction
- `coupons` - Reward coupons (reward, birthday, holiday, promotion, welcome types)
- `promotions` - Active promotional campaigns
- `notifications` - LINE push/broadcast notification log
- `chat_keywords` - Chatbot keyword-response mappings

**Database Operations**
- Use `query(sql, params)` from `database/db.js` for parameterized queries
- Connection pool configured for serverless/Render deployment
- Migrations use `database/migrate.js`

### LINE Integration

**Two LINE Channels Required**
1. **LINE Login** (`LINE_LOGIN_CHANNEL_*`) - For member authentication via LIFF
2. **Messaging API** (`LINE_CHANNEL_*`) - For chatbot and push notifications

**LIFF (LINE Front-end Framework)**
- Member app: `/liff/member` - Customer membership card, stamps, coupons
- Staff app: `/liff/staff` - Stamp award, coupon redemption interface

**Webhook Handler**
- `/webhook` endpoint receives LINE events (follow, unfollow, messages, postbacks)
- Auto-registers new followers as members using their LINE profile
- Responds to text messages via keyword matching (`chat_keywords` table)
- Uses reply tokens for immediate responses (30s window)

**Message Patterns**
- Use `replyMessage` for quick replies within webhook (free, fast)
- Use `pushMessage` for async notifications outside webhook context
- Flex messages for rich UI (member card, coupon display, menus)

### Service Modules

`services/` directory organized by domain:
- `chatbot/` - Webhook event handling, keyword replies
- `coupon/` - Coupon issuance, validation, redemption
- `line/` - LINE client, message sending, flex message builders
- `membership/` - Registration, authentication, profile management
- `stamp/` - Stamp award logic, reward coupon generation
- `notification/` - Push notification scheduling

## Environment Configuration

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET` - LINE Login credentials
- `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` - Messaging API credentials
- `LIFF_ID_MEMBER`, `LIFF_ID_STAFF` - LIFF app IDs
- `JWT_SECRET` - Token signing secret for member auth
- `QR_SIGNING_SECRET` - QR code tamper-proofing
- `MAINTENANCE_TOKEN` - Cron job authentication

**Configuration Validation**
`config/index.js` validates all required env vars at startup (fails fast). Missing vars cause immediate exit with clear error message.

## Loyalty Program Rules

- **Stamps**: 10 stamps = 1 reward coupon (configurable in `config/index.js`)
- **Coupon Types**: reward, birthday, holiday, promotion, welcome
- **Coupon Expiry**: 90 days by default
- **Birthday Coupons**: Automatically generated via daily cron job (2 AM UTC)

## Testing

Uses Node.js built-in test runner (`node:test`). Test files in `test/` directory.

Run tests: `npm test`

## Deployment

Deployed on Render.com:
- Web service with health checks at `/health` and `/ready`
- Cron job for birthday coupon generation (daily at 2 AM UTC)
- See `render.yaml` for infrastructure definition

## Security Notes

- Rate limiting on `/api/*` routes (100 requests per 60s by default)
- Helmet middleware for security headers
- CORS restricted to configured origins
- Passwords hashed with bcryptjs
- JWT tokens with configurable expiry (7d members, 12h staff)
- QR tokens signed to prevent tampering