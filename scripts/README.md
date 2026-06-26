# Scripts

One-off utility, maintenance, and debugging scripts. These are **not** part of the application runtime.

> ⚠️ These scripts connect directly to the database using `DATABASE_URL`. Run them with care — especially against production data.

## Usage

Run TypeScript scripts with [`tsx`](https://github.com/privatenumber/tsx) (or `ts-node`):

```bash
npx tsx scripts/test-prisma.ts
npx tsx scripts/update-prices.ts
```

Run JavaScript scripts with Node:

```bash
node scripts/check-user.js
node scripts/verify-user.js user@example.com
```

## Available scripts

| File | Description |
| --- | --- |
| `check-user.js` | List the email addresses of all registered users. |
| `verify-user.js` | Manually mark a user's email as verified. Pass the target email as an argument. |
| `test-prisma.ts` | Smoke-test the Prisma connection by fetching public memories. |
| `update-prices.ts` | Discount the price of every shop item by 50%. |
| `enable-realtime.sql` | SQL to enable Supabase Realtime on the relevant tables. |
