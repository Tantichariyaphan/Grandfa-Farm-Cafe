# Grandfa Cafe LINE OA

Production Express and PostgreSQL service for LINE OA membership, stamp rewards, coupons, staff operations, analytics, and LIFF.

## Run locally

1. Copy `.env.example` to `.env` and set every value. Generate distinct long random values for `JWT_SECRET`, `QR_SIGNING_SECRET`, and `MAINTENANCE_TOKEN`.
2. Run `npm ci`.
3. Run `npm run migrate`, then set `OWNER_INIT_PASSWORD` and run `npm run seed` once.
4. Run `npm start`.

The service exposes `/health`, `/ready`, `/dashboard`, `/liff/member`, `/liff/staff`, `/webhook`, and all APIs under `/api`.

## LINE setup

Set the Messaging API webhook URL to `https://YOUR_HOST/webhook`. Configure the member and staff LIFF endpoint URLs as `https://YOUR_HOST/liff/member` and `https://YOUR_HOST/liff/staff`. The LIFF app must belong to the LINE Login channel configured by `LINE_LOGIN_CHANNEL_ID`.

## Render Pro

Use `render.yaml` or create a Node web service with `npm ci` as its build command and `node index.js` as its start command. Attach a managed PostgreSQL database and provide all values from `.env.example`. Set `DATABASE_SSL=true` for Render PostgreSQL. Configure the cron service with the same `APP_BASE_URL` and `MAINTENANCE_TOKEN` to issue birthday coupons daily.

## Security model

Member and staff sessions use separate JWT audiences. Staff and owner access is database-checked on each request. Member and coupon QR payloads are HMAC-signed. The LINE webhook uses the official SDK signature middleware before JSON parsing. Coupon redemption is an atomic conditional update and stamp submission has a unique idempotency key.

## Verification

Run `npm test` for utility security checks and `npm run migrate` against a PostgreSQL instance before deployment.
