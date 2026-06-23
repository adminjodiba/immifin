# Immifin

A production-ready Next.js 15 website helping immigrants navigate visas, taxes, investing, credit, and citizenship in America.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Responsive design** (mobile-first)
- **SEO optimized** (metadata, sitemap, robots.txt, Open Graph)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, featured calculators, guides, and articles |
| `/immigration` | Immigration guides and topic overview |
| `/finance` | Finance guides and topic overview |
| `/calculators` | Immigration, finance, and tax calculators |
| `/about` | Mission, values, and latest articles |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/contact` | Contact form |

## Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or later (Node 20+ recommended)
- npm, yarn, or pnpm

## Installation

1. **Clone or navigate to the project:**

   ```bash
   cd C:\Projects\immifin
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open in your browser:**

   [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
# Build for production
npm run build

# Start the production server
npm start
```

## Project Structure

```
immifin/
├── app/
│   ├── layout.tsx          # Root layout with fonts & metadata
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Tailwind & global styles
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   ├── immigration/
│   ├── finance/
│   ├── calculators/
│   ├── about/
│   ├── privacy/
│   ├── terms/
│   └── contact/
├── components/
│   ├── SiteShell.tsx       # Client wrapper (header + footer)
│   ├── Header.tsx          # Navigation with mobile menu
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── PageHeader.tsx
│   ├── SectionHeader.tsx
│   ├── CalculatorCard.tsx
│   ├── GuideCard.tsx
│   └── ArticleCard.tsx
├── lib/
│   ├── site.ts             # Site config & nav links
│   ├── metadata.ts         # SEO metadata helper
│   └── data/               # Content data
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Customization

- **Site URL & branding:** Edit `lib/site.ts`
- **Content:** Update guides, calculators, and articles in `lib/data/`
- **Colors:** Adjust the `brand` palette in `tailwind.config.ts`
- **SEO:** Per-page metadata is set via `createMetadata()` in each page file

## Deployment

Deploy to [Vercel](https://vercel.com) (recommended for Next.js):

```bash
npx vercel
```

Or build and deploy the `.next` output to any Node.js hosting platform.

## License

Private — All rights reserved.
