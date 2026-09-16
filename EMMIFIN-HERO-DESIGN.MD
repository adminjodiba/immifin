# EMMIFIN split-scene hero playbook

**Status:** Locked. The `/about/share-feedback` hero is the approved reference.

**How to use this file:** When a new page is uploaded with a two-corner USA landmark PNG, rebuild that page’s hero from this playbook. Reuse `Ds2SplitSceneHero`. Do not invent a new method. Do not retune the locked Share Your Feedback hero unless the product owner explicitly asks.

---

## What the product owner is asking for

The source PNG is **one photo** that already has:

- a **left landmark** (complete, unstretched)
- a **right landmark** (complete, unstretched)
- a **middle band** of sky / cloud / trees / water from the **same** picture

The finished hero must look like one continuous American landscape, not two pictures pasted onto a colored bar. Same idea as the landing coast-to-coast hero (Golden Gate / NYC / ocean): lock the sides at natural aspect, fill the gap from the same image.

---

## Locked reference — Share Your Feedback

| Item | Locked value |
|---|---|
| Route | `/about/share-feedback` |
| Component | `components/ds2/Ds2SplitSceneHero.tsx` |
| Page wiring | `components/feedback/ShareFeedbackPage.tsx` |
| Styles | `app/globals.css` — `.ds2-split-hero` / `.ds2-share-hero` |
| Image | `/images/mountrushmore-yosometti.png` |
| Natural size | **2172 × 724** |
| Left landmark | Yosemite (waterfall + cliff). Whole landmark. Never stretch. |
| Right landmark | Mount Rushmore. **All 4 faces** (Washington, Jefferson, Roosevelt, Lincoln). Never stretch. Never crop a head. |
| Eyebrow | Share your feedback |
| H1 | Your voice matters. |
| Description | Your experience helps us improve the tools we build for immigrants navigating life in America. |
| Copy placement | Horizontally **centered** in the hero, over the **middle sky**, not on rock. |
| Description on small screens | Hidden at `max-width: 767px` |

### Locked lock / fill fractions

```ts
imageSrc="/images/mountrushmore-yosometti.png"
imageWidth={2172}
imageHeight={724}
leftLock={0.33}
rightLock={0.38}
fillLeft={0.33}
fillRight={0.69}
skyLeft={0.35}
skyRight={0.54}
```

### Locked hero heights (same as landing — do not change)

| Breakpoint | Height |
|---|---|
| default | `min(28vh, 180px)` |
| `sm` 640 | `min(24vh, 172px)` |
| `lg` 1024 | `min(19vh, 160px)` |

### Locked zoom tokens (Share Your Feedback)

| Breakpoint | `--ds2-lock-zoom-left` | `--ds2-lock-zoom-right` |
|---|---|---|
| default | `1.38` | `1.72` |
| `sm` 640 | `1.52` | `1.88` |
| `lg` 1024 | `1.7` | `2.02` |

These zooms are the approved “complete landmark” sizes. Higher right zoom (2.78–3.55) **chopped Rushmore heads** and hid faces in the fade. Completeness beats filling the band.

### Locked right-fade override (Share Your Feedback only)

Default component fade is too wide on the right lock and can erase the inner face (Washington). Share page overrides:

```css
.ds2-share-hero .ds2-split-hero-lock-right {
  mask: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, 0.35) 6%,
    #000 16%,
    #000 100%
  );
}
```

---

## Architecture (do not replace)

One source image. Three jobs:

1. **Locked left** — unstretched slice of the left landmark. `background-position: left bottom`.
2. **Locked right** — unstretched slice of the right landmark. `background-position: right bottom`.
3. **Middle fill** — only the source slice `fillLeft`–`fillRight` (sky / trees / water). Optional sky band `skyLeft`–`skyRight`. Far / mid / near layers plus a light valley haze.

Copy sits in a child wrapper above the scene (`z-index: 3`).

```
[ left lock | middle fill from SAME pic | right lock ]
[              page title / copy                      ]
```

### Why `left bottom` / `right bottom`

Extra zoom crops **sky from the top**, not the tree / water base. Never use `scaleX`. Never `object-fit: cover` on a short non-panoramic crop.

### Width math (already in the component)

```
posterW  = heroH * imageWidth / imageHeight
lockW    = posterW * lockFrac * zoom + 10rem overlap
bgSize   = (posterW * zoom) × (heroH * zoom)
```

Natural aspect is preserved. A higher zoom makes the landmark larger **and** the lock wider. Too much zoom does three bad things:

1. Chops the top of the landmark.
2. Pushes the inner face into the fade so it disappears.
3. Lets one lock swallow the whole viewport (especially mobile).

---

## Files to reuse

| File | Role |
|---|---|
| `components/ds2/Ds2SplitSceneHero.tsx` | Reusable scene. Pass image + fractions + children. |
| `app/globals.css` | Shared `.ds2-split-hero*` scene + page-specific copy/zoom class. |
| `public/images/<filename>.png` | The PO’s two-corner PNG, served as a static asset. |

Do **not** rebuild the scene with two `<img>` tags, a painted sky, or a second photo.

---

## Prompt to run for the next ~10 pages

Copy this block when the product owner uploads a new PNG and says to refer to `EMMIFIN-HERO-DESIGN.MD`:

```
DS2 SPLIT-SCENE HERO

Use EMMIFIN-HERO-DESIGN.MD and the existing Ds2SplitSceneHero pattern
(same as landing coast-to-coast and the locked /about/share-feedback hero).

Image: /images/<filename>.png
Natural size: <WIDTH> x <HEIGHT>
Left landmark: <PLACE NAME> — show the WHOLE landmark, do not stretch, do not crop a defining part
Right landmark: <PLACE NAME> — show the WHOLE landmark, do not stretch, do not crop a defining part
Middle filler: use only the middle sky / cloud / water / tree band from THIS same image
to fill the hero gap. No painted color. No second photo.

Rules:
- Keep landing hero heights (180 / 172 / 160)
- Lock left and right landmarks at natural aspect (never scaleX, never object-fit cover)
- Soft-fade locked sides into the middle filler
- Keep this page’s own title/copy on top of the sky, not on the rock/buildings
- Default copy to the horizontal center of the hero unless the PO says otherwise
- Hide the one-line description at max-width 767px unless the PO says otherwise
- Tune leftLock / rightLock / fillLeft / fillRight / skyLeft / skyRight so both landmarks stay complete
- Start conservative on zoom. Enlarge only until the landmark is complete. If any head, crown, statue, or tower chops, back off
- Prefer a slightly wider lock fraction over a huge zoom when a landmark has several parts (e.g. 4 faces)
- If the inner side of a landmark fades away, tighten that page’s fade; do not keep raising zoom
- Verify desktop (~1440) and mobile (~390) before done
- Do not retune the locked Share Your Feedback hero while building a new page
```

---

## Build checklist for a new page

1. **Take the PO PNG.** Copy it to `public/images/<kebab-name>.png`. Record natural `width × height`.
2. **Name the landmarks.** Left place, right place, what “complete” means (all faces, whole tower, full bridge, etc.).
3. **Measure fractions** on the source (0–1 from the left):
   - `leftLock` — width of the left landmark including a little sky
   - `rightLock` — width of the right landmark including a little sky (wide enough that every defining part is inside the solid mask, not the fade)
   - `fillLeft` / `fillRight` — middle only; no landmark stone/buildings if possible
   - `skyLeft` / `skyRight` — extra sky/cloud band from the same image
4. **Wire `Ds2SplitSceneHero`** on the new page with those props and a page-specific class (example: `ds2-<page>-hero`).
5. **Reuse shared scene CSS.** Add page zoom tokens only if this image needs different left/right zoom than the shared defaults. Prefer a page class so Share Your Feedback stays locked.
6. **Add copy** (eyebrow, accent, H1, optional one-line description). Center it over the sky. Keep landing type scale unless the PO specifies new copy styles.
7. **Start zooms near the locked reference** (left `1.38 / 1.52 / 1.7`, right `1.72 / 1.88 / 2.02`). Raise in small steps. Stop at the last value where the landmark is still complete.
8. **Verify in the browser**
   - Desktop ~1440×900: both landmarks complete, middle reads farther, title readable on sky.
   - Mobile ~390: both landmarks still recognizable; title readable; one lock must not cover the whole band.
9. **Stop when the PO says it is nailed.** Lock that page’s numbers in this file or in a short comment on the page.

---

## Tuning rules (learned the hard way)

### Do

- Use **one** source PNG that already contains both landmarks and the middle sky.
- Lock sides at **natural aspect**. Height fill comes from zoom, not stretch.
- Fill the gap from the **same** picture’s sky / trees / water.
- Soft-fade locks into the fill. Keep fades off the stone/faces.
- Put title copy on **sky**, usually **centered**.
- If a landmark has several parts (4 presidents, a bridge + tower), **widen `rightLock` / `leftLock` first**, then zoom.
- When zooming, keep `left bottom` / `right bottom` so extra crop is sky.

### Do not

- Paint a flat sky color, mint wash, or a second sky image over the photo.
- Overlay a second picture or stamp clouds. That reads as “two pictures pasted” / collage.
- Use aggressive left masks that wipe the inner face (Washington was erased this way).
- Use `object-fit: cover` on a short band of a non-panoramic crop — it looks stretched.
- Use `scaleX` / non-uniform scale. Ever.
- Put title copy on rock or buildings.
- Raise zoom until heads, crowns, statues, or towers clip. Completeness wins.
- Build a cartoon V `clip-path` “valley.” Depth comes from **larger near landmarks + farther middle trees**, not a fake V.
- Change landing hero heights (180 / 172 / 160) unless the PO asks.
- Retune the locked Share Your Feedback hero while implementing another page.

### Failed approaches (do not repeat)

| Approach | Why it failed |
|---|---|
| Aggressive left fade / mask | Wiped Washington / inner stone |
| Painted sky or second sky image | “Two pictures pasted,” “mature child added 2 pictures” |
| `object-fit: cover` on a short hero | Stretched / over-zoomed |
| Cloud stamps / collage tiles | Fake, busy |
| Green mint sky wash | Rejected color, not from the photo |
| Single right-aligned photo in a wide band | Empty left, stretch, or hard edge |
| Subtle `rotateX` 3D depth | Invisible in a 160px band |
| V-shaped tree `clip-path` | Cartoon; PO wanted larger side landmarks instead |
| Right zoom 2.78–3.55 on Rushmore | Chopped heads; faces sat in the fade; lock ate the viewport |

---

## Copy / chrome defaults for future heroes

Reuse this structure unless the PO gives different copy:

```tsx
<Ds2SplitSceneHero className="ds2-<page>-hero" labelledBy="<page>-heading" ...>
  <div className={`${landingV3ContentGridClass} ds2-<page>-hero-inner`}>
    <div className="ds2-<page>-hero-copy">
      <p className="ds2-share-eyebrow">{eyebrow}</p>
      <span className="ds2-section-header-accent" aria-hidden="true" />
      <h1 id="<page>-heading" className="ds2-share-hero-title">{title}</h1>
      <p className="ds2-share-hero-description">{oneLiner}</p>
    </div>
  </div>
</Ds2SplitSceneHero>
```

Shared copy CSS already centers the Share hero. For a new page, copy those inner/copy/title/description rules onto the new class (or share a common `ds2-split-hero-copy` class) so each page can have its own eyebrow/title without restyling the scene.

---

## Verification before calling a new hero done

- [ ] Left landmark complete, unstretched
- [ ] Right landmark complete, unstretched (every defining part visible)
- [ ] No chopped heads / crowns / towers
- [ ] Middle is the same photo’s sky/trees/water — not a painted block
- [ ] Soft blend, not a hard seam
- [ ] Title readable on sky, centered unless told otherwise
- [ ] Description hidden at `max-width: 767px` if using the default
- [ ] Heights still 180 / 172 / 160
- [ ] Desktop ~1440 and mobile ~390 checked
- [ ] Share Your Feedback hero left untouched

---

## Locked Share Your Feedback — do not edit unless asked

The product owner approved this hero on 2026-09-12 (“NOW YOU NAILED IT”).

Do not change its image, fractions, zooms, fades, heights, or copy placement unless a later task explicitly reopens that hero.
