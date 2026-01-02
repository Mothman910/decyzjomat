## Decyzjomat

Decyzjomat to szybka, lekka gra w decyzje: karty do wyboru, wspólne głosowanie oraz tryby w stylu „randki w ciemno” i quiz „Gusta”.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables

Utwórz `.env.local` (na dev) lub ustaw zmienne w Vercel (Production/Preview):

- `NEXT_PUBLIC_SITE_URL` – pełny URL strony, np. `https://twoj-projekt.vercel.app`
- `GEMINI_API_KEY` – klucz Gemini (quiz „Gusta”)
- `GEMINI_MODEL` – opcjonalnie, domyślnie `gemini-flash-latest`
- `GROQ_API_KEY` – klucz Groq (Porady)
- `GROQ_MODEL` – opcjonalnie, domyślnie `llama-3.3-70b-versatile`
- `TMDB_API_KEY` – opcjonalnie (jeśli korzystasz z kart z TMDB)

## Deploy on Vercel

1. Importuj repo do Vercel.
2. Framework preset: **Next.js**.
3. Ustaw powyższe env vars (zwłaszcza `NEXT_PUBLIC_SITE_URL`).
4. Deploy.

## Facebook (Open Graph)

Meta tagi OG/Twitter, obrazy oraz ikony są generowane przez Next App Router.
Po wdrożeniu użyj narzędzia Facebook Sharing Debugger i wklej URL strony, żeby wymusić odświeżenie podglądu.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
