# Vika's Recipes 🍲

A responsive recipe site (phone, tablet, desktop) built with Vite, React, TypeScript and Tailwind CSS.

- English / Українська language switch and light / dark theme (both remembered per browser)
- Search by recipe name or ingredient (works in both languages)
- Categories: course, main ingredient (chicken, beef, pork, seafood…), cooking method (oven, air fryer, casserole…) and diet
- Filters: season / occasion (Christmas, Easter, Summer…), cuisine, and ingredients
- Recipe view with a real photo, ingredient checklist and numbered steps

## Run locally

```bash
npm install
npm run dev
```

## Add a recipe

1. `src/data/recipes.ts` — copy an existing recipe, give it a unique `id` and fill in the fields.
   Categories, cuisines and seasons are listed in `src/types.ts`.
2. `src/data/recipes.uk.ts` — add the Ukrainian title, description and steps under the same `id`.
   New ingredient names or notes go in `src/i18n.tsx` (`ingredientUk` / `noteUk`).
3. Photo (optional): put a `.jpg` in `public/images/` named after the `id`, and add it to `src/data/photos.ts`.
   Without a photo the card shows the recipe emoji.

## Photos

Recipe photos come from [Wikimedia Commons](https://commons.wikimedia.org) under free licenses
(CC0, CC BY, CC BY-SA, public domain). Each recipe page credits the author and license with a link to the original.

## Contact form (database + photo uploads)

The contact page (`/contact`) saves messages and shared recipes to a Postgres database, and photos to Vercel Blob.
Code: `api/contact.ts` (saves the form) and `api/upload.ts` (lets the browser upload photos).

One-time setup in the Vercel dashboard → your project → **Storage**:

1. **Create Database → Neon (Postgres)** → connect it to this project. This adds `DATABASE_URL`.
2. **Create → Blob** → connect it to this project. This adds `BLOB_READ_WRITE_TOKEN`.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new settings are picked up.

The `submissions` table is created automatically on the first message. To read messages, open the
database from the Vercel Storage tab ("Open in Neon") and run:

```sql
SELECT * FROM submissions ORDER BY created_at DESC;
```

Photo links are in the `image_urls` column (kept for turning photographed recipes into site recipes later).
Photos are stored **privately** (the Blob store must be a private store), so the links don't open in a browser on their own —
view them in Vercel → **Storage** → your Blob store → **Browser**.

### Environment variables

Only the contact form needs these — the recipe site itself works without any.

| Variable | Required | What it is | Where to get it |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes, for the contact form | Postgres connection string for the Neon database where messages are saved. Looks like `postgresql://user:password@host/dbname?sslmode=require`. `POSTGRES_URL` is also accepted if `DATABASE_URL` is missing. | Added automatically when the Neon database is connected to the project in Vercel → **Storage**. |
| `BLOB_READ_WRITE_TOKEN` | Yes, for photo uploads | Secret token that lets `api/upload.ts` give the browser permission to upload photos to Vercel Blob. Starts with `vercel_blob_rw_`. | Added automatically when the Blob store is connected to the project in Vercel → **Storage**. |
| `ADMIN_PASSWORD` | Yes, for the inbox | Password for the private inbox at `/admin`, where you read messages and see photos. Choose a long one. Changing it logs out every session. | You choose it. Add it yourself in Vercel → **Settings → Environment Variables**. |
| `RESEND_API_KEY` | Optional — email alerts | API key for [Resend](https://resend.com), which emails you when a new message arrives. Starts with `re_`. | resend.com → **API Keys** → Create. |
| `NOTIFY_EMAIL` | Optional — email alerts | Where the alerts go. Several addresses can be separated by commas. | Your email address. |
| `NOTIFY_FROM` | Optional | Sender shown on alerts. Defaults to `Vika’s Recipes <onboarding@resend.dev>`. Only change it after verifying your own domain in Resend. | — |

The Neon integration also adds other variables (`PGHOST`, `PGUSER`, `POSTGRES_PRISMA_URL`, …). They are not used
and can be left as they are.

**On Vercel** the database and Blob variables are set for you when you connect the stores. `ADMIN_PASSWORD`,
`RESEND_API_KEY` and `NOTIFY_EMAIL` you add yourself in **Settings → Environment Variables**. Redeploy after any change.

### Inbox (`/admin`)

Open `https://<your-site>/admin` and log in with `ADMIN_PASSWORD`. You can read messages and shared recipes, view the
photos, reply by email, mark messages as read, archive or delete them (deleting also removes the photos).
The page isn't linked anywhere on the site and asks search engines not to index it.

### Email alerts

1. Sign up at [resend.com](https://resend.com) **with the same email address you want alerts sent to**. Without your own
   domain, Resend can only send to the email address of your Resend account.
2. Create an API key and add `RESEND_API_KEY` and `NOTIFY_EMAIL` (that same address) in Vercel and in `.env.local`.
3. Redeploy. Each new message sends a summary email with an **Open inbox** button; replying to it answers the sender.

If alerts aren't set up, messages are still saved — you just won't get an email.

**On your computer** (`npm run dev` also runs the `/api` functions), put the same variables in a `.env.local` file
in the project folder. `.env.example` shows the format. To fill it in, either:

- run `npx vercel link` and then `npx vercel env pull .env.local`, or
- copy the values from Vercel → **Storage** → your store → **.env.local** tab.

Restart `npm run dev` after changing `.env.local`. This file holds secrets and is git-ignored — never commit it.

## Deploy

1. Create an empty repository on GitHub, then:
   ```bash
   git remote add origin https://github.com/<your-user>/vikas-favorite-recipes.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repository and click **Deploy**.
   Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
