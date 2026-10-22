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

Local testing of the form: `npm run dev` doesn't run the `/api` functions. Use `npx vercel link`, `npx vercel env pull`
and then `npx vercel dev` instead.

## Deploy

1. Create an empty repository on GitHub, then:
   ```bash
   git remote add origin https://github.com/<your-user>/vikas-favorite-recipes.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repository and click **Deploy**.
   Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
