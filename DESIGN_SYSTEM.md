# MovieExplorer design system

**Baseline version 1 · 2026-11-26 · Existing movie-only interface**

This reference describes the current Vue templates and Tailwind 3 styling. Palette and breakpoints were checked against the existing compiled stylesheet. The wireframes are derived from code. Screenshots and interactive viewport inspection were unavailable for this baseline. See [Architecture](ARCHITECTURE.md) for behavior and [Agent instructions](AGENTS.md) for development rules.

## Implemented visual identity

MovieExplorer uses a green wordmark, a dark navy header and footer, a light grey page, and dark charcoal-navy movie cards. Posters are the principal visual content. The interface places navigation and search in the header, a bold title and green divider above browse grids, and credits in the footer. The green Details link is the primary card action. The heart is a compact secondary toggle. The detail page uses a quieter grey Back control and starts with the poster on the left at desktop sizes.

Preserve the green and navy identity, poster-first hierarchy, simple card anatomy, and restrained density. Current density comes from equal-width tracks, 24 px grid gaps, compact labels, modest panel radii, and utility spacing. Responsive or accessibility defects are candidates for deliberate improvement.

## Color and elevation

The app uses default Tailwind 3 tokens. [tailwind.config.js](tailwind.config.js) extends no colors and enables the forms plugin. [Global CSS](src/assets/main.css) imports Tailwind's base, components, and utilities.

| Color | Current utility and purpose | States and context |
|---|---|---|
| `#D1D5DB` | `bg-gray-300`, light grey shell | Behind routed content and short-page feedback |
| `#111827` | `bg-gray-900` on header/footer and `text-gray-900` in Details | Back hover also uses `hover:text-gray-900` |
| `#1F2937` | `bg-gray-800`, card panel | Card hover changes scale and elevation |
| `#22C55E` | `text-green-500`, wordmark and footer technology links | `border-green-500` divider, search focus ring and filter focus border/ring |
| `#16A34A` | `bg-green-600`, Details link | White text, about 3.30:1 contrast at rest |
| `#166534` | `hover:bg-green-800`, Details link | Hover fill |
| `#4ADE80` | `hover:text-green-400`, Home, Favorites and technology links | Hover text color |
| `#374151` | `bg-gray-700`, search surface | Favorite hover surface via `hover:bg-gray-700` |
| `#4B5563` | `bg-gray-600`, genre/year inputs | `text-gray-600` for filter labels, tagline, Back, votes and detail labels |
| `#9CA3AF` | `text-gray-400`, footer, Home loading, empty Favorites and unselected heart | `placeholder-gray-400` in search and year. Contrast against page grey is about 1.72:1 and against search grey about 4.06:1. |
| `#EF4444` | `fill-red-500 stroke-red-500`, selected heart | Unselected heart uses `fill-none` with `stroke="currentColor"` and grey text, turning white on hover |
| `#EAB308` | `text-yellow-500`, star and rating | About 1.30:1 against the page grey |
| `#60A5FA` | `text-blue-400`, TMDB credit link | `hover:text-blue-300` uses `#93C5FD` |
| `#FFFFFF` | `text-white`, header, cards, controls and Details action | Unselected heart can use `hover:text-white` |
| `#000000` | `text-black`, Home and Favorites section headings | Black is also the base color of the default shadows |
| Transparent | `border-transparent` on genre/year, `fill-none` on outline icons | Focused filter border turns green |

The forms plugin also supplies native-control baseline styles, including the select arrow and default control geometry. Footer grey on navy is approximately 6.99:1 and brand green on navy approximately 7.79:1. Ratios are calculated from colors, with interactive accessibility unverified. There is no dedicated error palette. No custom theme switch or fixed active-link color exists.

- `shadow-lg` on header, cards, and the details poster uses black at 10% in the default layers `0 10px 15px -3px` and `0 4px 6px -4px`.
- Card `hover:shadow-2xl` uses black at 25% with `0 25px 50px -12px`. Footer has no shadow.

## Typography

System sans-serif stack from Tailwind Preflight, with no custom font files or remote font imports. The stack is `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. Pixels below assume a 16 px root.

| Element | Tailwind utilities | Size / line height | Weight and treatment |
|---|---|---|---|
| Wordmark | `text-2xl font-bold` | 24 / 32 px | 700, green |
| Header nav, base body and overview | Inherited base | 16 / 24 px | 400 |
| Home/Favorites H1 | `text-3xl font-bold` | 30 / 36 px | 700, black |
| Movie card H2 | `text-lg font-semibold` | 18 / 28 px | 600, white |
| Release date | `text-sm text-white` | 14 / 20 px | 400, literal “Release Date:” then raw date |
| Filter labels | `text-sm font-medium` | 14 / 20 px | 500, grey |
| Search and Details link | `text-sm`, with link `font-semibold` | 14 / 20 px | Input 400, link 600 |
| Genre/year control values | No local size utility, forms plugin defaults | Nominal 16 / 24 px | 400, white |
| Details H1 | `text-4xl font-bold` | 36 / 40 px | 700 |
| Details tagline | `text-lg italic` | 18 / 28 px | 400, grey |
| Detail rating and votes | Inherited base | 16 / 24 px | 400 |
| Detail metadata | `text-sm`, labels `font-semibold` | 14 / 20 px | Values 400, labels 600 |
| Back | `font-semibold text-md` | Inherited 16 / 24 px | 600. Default Tailwind has no `text-md` utility. |
| Footer | `text-sm` author, inherited technology links, `text-xs` credit | 14 / 20, 16 / 24, and 12 / 16 px | 400 |
| Home loading and Favorites empty | Inherited base, `text-gray-400` | 16 / 24 px | 400 |
| Detail loading | `text-lg text-center` | 18 / 28 px | 400, inherited navy |

## Shell, widths and spacing

[App.vue](src/App.vue) uses `flex flex-col min-h-screen bg-gray-300` (minimum 100vh). Its children are header, `main.container.mx-auto.p-4` containing the router outlet, and footer. Each routed view also uses `main.container.mx-auto.p-4`. The nested main landmarks and duplicated container padding are existing defects. The page can have 32 px of padding on each side inside the outer container.

The Tailwind `container` is full width until a breakpoint caps it. At 640, 768, 1024, 1280 and 1536 px, the respective maximum widths are 640, 768, 1024, 1280 and 1536 px. `mx-auto` centers each container. Header and footer backgrounds span the viewport. Their content uses independent centered containers.

| Pattern | Utilities and geometry |
|---|---|
| Shell/header/page padding | Each `p-4` is 16 px per edge |
| Header spacing | `gap-4` is 16 px. Desktop nav control group also has `md:space-x-6` (24 px sibling margin in addition to gap). No fixed height. |
| Section heading | `mb-6 pb-2 border-b-4` gives 24 px below the underline, 8 px padding above it, and a 4 px border |
| Filters | `gap-6 mb-6` gives 24 px between controls and after the group. `mt-1` gives 4 px below the label. |
| Movie grids | `gap-6` is 24 px on both axes |
| Card | `rounded-lg` (8 px), `overflow-hidden`, `p-3` (12 px) in body. Text elements have `mb-2` (8 px). Action row uses `gap-4` and centers items. |
| Details link and heart | Link uses `px-4 py-2 rounded-lg` (16 px horizontal, 8 px vertical, 8 px radius). Heart uses `p-2 rounded-full` around a 24 px icon. |
| Inputs | Search is pill-shaped with `px-4 py-1.5` (16 px and 6 px), approximately 32 px tall. Genre/year inherit forms padding and border width, with `rounded-lg`; native dimensions vary. |
| Details | Poster/text gap `gap-8` (32 px). Metadata `gap-4` (16 px). Tagline, rating, overview and Back have `mb-4` (16 px). Title has `mb-2`. Cast block adds `mt-4`. |
| Footer | `py-6 px-4` (24 px vertical and 16 px horizontal), centered. Technology group `mt-2 gap-1 md:gap-2`; TMDB credit `mt-4`. Height follows content. |

## Component specifications

The following describes the default state first. Motion and focus shared across controls are detailed below.

| Component and source | Structure, layout and behavior | Accessibility and limitations |
|---|---|---|
| **AppHeader** · [AppHeader.vue](src/components/AppHeader.vue), lines 10–35 | Navy `header` with shadow wraps a centered padded `nav`. Green MovieExplorer wordmark links Home. Sibling group holds white Home and Favorites links and search. Stack below 768 px, then horizontal with brand and group at opposite ends. Links turn green on hover, with no authored transition or special active appearance. | Native anchors via RouterLink. Persistent header appears even when search cannot display results on the active route. |
| **AppFooter** · [AppFooter.vue](src/components/AppFooter.vue), lines 2–29 | Navy centered block. “Made by Ahmed Wanjugi using”, followed by green Vue.js, Tailwind CSS and Pinia links, then “Movie data provided by TMDB.” Technology links stack on smaller widths and form a centered row with commas at 768 px. Tech links lighten green on hover and TMDB turns lighter blue. External links open new tabs. | Semantic footer, native links, no authored special focus effect. Footer follows content, so it can sit high on short pages. |
| **MovieCard** · [MovieCard.vue](src/components/MovieCard.vue), lines 15–43 | Rounded, clipped, shadowed charcoal panel. Poster first, then flexible padded text with H2 and raw release date, then Details and heart. The body and text region grow to help align actions within a grid row. The entire panel scales and increases shadow on hover. | Card and poster are not links. Individual controls are interactive. No line clamp, fixed media block, or mobile action reflow. |
| **HomeView** · [HomeView.vue](src/views/HomeView.vue), lines 39–72 | Nested centered main. “Popular Movies” H1 and underline, then genre/year if search is empty. Loading text or a grid follows. Search replaces the same grid and keeps the heading. | Filter labels exist. Heading does not reflect search mode. Loading uses result length, even on failure. |
| **FavoritesView** · [FavoritesView.vue](src/views/FavoritesView.vue), lines 8–25 | Nested centered main, “Favourite Movies” H1, then either muted empty copy or shared cards. Grid uses four tracks from 768 px, and removal immediately updates the list. | Native card actions are reused. Empty copy has no CTA or live announcement. |
| **MovieDetailView** · [MovieDetailView.vue](src/views/MovieDetailView.vue), lines 24–83 | Nested `text-gray-900` main. Centered loading text or a poster and text group. At 768 px poster and text are nominally one-third and two-thirds in a flex row, with normal shrink around the 32 px gap. Below 768 px the poster is above Back, H1, italic tagline, rating, overview and a two-column metadata grid. Cast starts in the next grid row. | Back appears with loaded data. No favorite action, backdrop, detail error panel, or missing-field presentation. |
| **Search input** · AppHeader lines 25–33 | `type="text"`, placeholder “Search movies...”, muted grey on charcoal, white value, full-width pill on mobile and auto width from 768 px. `v-model` writes query text on input. Green 2 px ring on focus. | Placeholder is the only visible identifier and no persistent label or explicit accessible name is supplied. |
| **Genre selector** · HomeView lines 45–54 | “Genre” label over native select. “All Genres” is the empty value, with API names displayed and IDs bound. White on grey with 8 px rounding and green border/ring on focus. Full width of wrapper below 640 px, auto width at 640 px. | Native keyboard support and associated label. No indication when the genre request fails. |
| **Year input** · HomeView lines 56–59 | “Year” above native `type="number"`, placeholder “e.g., 2024”. Shares genre style and responsive width. Uses browser-native increments and sends a truthy value during discovery. | Associated label. Missing completion/range validation can send partial input. |
| **Section heading** · HomeView lines 40–43 and FavoritesView lines 9–10 | Left-aligned black 30 px H1 with bold weight. Detail H1 is a separate 36 px treatment without divider. | Provides page hierarchy. Search does not rename the section. |
| **Green heading divider** · same H1s | Green 4 px bottom border across the heading box. 8 px padding above the border and 24 px outer gap below. | Decorative CSS border. No standalone child element. |
| **Movie grid** · HomeView lines 67–68 and FavoritesView lines 16–21 | Equal CSS Grid tracks and 24 px gap. Home 2→5 and Favorites 2→4 at 768 px. Cards fill the assigned tracks. | Reading order follows the array. Fewer cards leave unused tracks. No special handling for very sparse lists. |
| **Poster image** · MovieCard lines 17–18 and MovieDetailView lines 33–35 | Full width of its box and intrinsic height. Card poster is clipped at the rounded top, details poster has rounding and shadow. Alt uses title. | No fixed aspect ratio, placeholder, responsive source, or failure handler. |
| **Details button** · MovieCard lines 24–28 | Centered green RouterLink styled as a rounded button, `flex-1`, white semibold 14/20 px label and about 36 px tall on one line. Turns darker green on hover. | Native anchor. No custom focus utility. Low contrast on the resting fill and pressure to wrap at narrow widths. |
| **Favorite button** · MovieCard lines 29–40 | Round approximately 40×40 px button, inline 24×24 px heart, uses selected red fill/stroke and inactive grey outline. Hover adds grey surface, with inactive icon able to turn white. | No explicit accessible name or pressed-state attribute. Focus outline removed. |
| **Rating presentation** · MovieDetailView lines 52–57 | Aligned row containing literal star, numeric rating to one decimal, “/ 10”, and grey “(N votes)”. 8 px margin after the rating and 16 px below the row. | Text conveys the score without relying on color. The yellow is low-contrast and the formatting assumes a numeric score. |
| **Back button** · MovieDetailView lines 39–47 | Inline native button using `router.back()`. Grey label and 20×20 px arrow, 8 px icon gap. Hover darkens the text and moves the arrow left 4 px. | Visible “Back” label. Focus outline removed. Browser history determines the destination. |
| **Loading text** · HomeView lines 63–65 and MovieDetailView lines 25–29 | Home shows left-aligned “Loading movies...” in muted grey. Details shows centered “Loading movie details...” in larger navy text. Both occupy only their text height. | No live status, skeleton, progress or retry. Home conflates empty and failure, and Details conflates failure with loading. |
| **Empty favorites state** · FavoritesView lines 12–14 | “No favorite movies found.” on the light grey page below the usual H1 and border. It replaces the grid. | Low contrast and no announcement. Same short-content footer behavior. |

## Image system

Card and Details templates concatenate `https://image.tmdb.org/t/p/w500` with the raw TMDB `poster_path`. Both use `movie.title` as alt text. Cards put the poster before the text block. Details puts it in the first layout column, stacking it first on mobile. `w500` is the requested TMDB size, not the CSS display width. Browser layout uses `w-full` and the intrinsic proportions it learns from the file. There is no explicit ratio, object-fit, cropping region, reserved height, `srcset`, `sizes`, or `loading="lazy"`. The surrounding rounded corners clip the card edges only. A null path can form a broken URL ending in `null`. If the CDN request fails, browser-native broken-image and alt rendering apply. There are no backdrops in the current UI.

### Proposed image direction

A 2:3 poster slot shared by movies and TV could reserve dimensions before fetching, provide a stable same-ratio missing-poster placeholder, and select responsive sizes. Lazy-load below-the-fold images while keeping the immediately visible content responsive. A future crop/object-fit rule and any backdrop treatment should be approved as part of the relevant design phase. These are proposals.

## Current responsive behavior

| Viewport | Container cap | Home / Favorites columns | Header, search, filters, detail, footer |
|---|---:|---:|---|
| Below 640 px | Fluid | 2 / 2 | Stacked navigation, full-width search, stacked full-width filters, poster above text, stacked tech links |
| 640–767 px | 640 px | 2 / 2 | Filters become a row with auto-width controls. Other groups remain stacked. |
| 768–1023 px | 768 px | 5 / 4 | Horizontal header and auto-width search, four or five narrow grid tracks, side-by-side detail, footer links in a row |
| 1024–1279 px | 1024 px | 5 / 4 | Same structure with wider container |
| 1280–1535 px | 1280 px | 5 / 4 | Same structure with wider container |
| 1536 px and above | 1536 px | 5 / 4 | Header content, page content and footer content centered in capped containers |

Card width is roughly `(grid width − total inter-column gaps) / columns`. Four tracks on Favorites produce larger cards than five on Home from 768 px onward. An individual card does not grow simply because there are fewer items. Cards ordinarily stretch within a grid row, while intrinsic poster proportions, wrapped titles, and release dates vary by item. Different rows may have different heights. The jump at 768 px and the rigid action row create potential clipping or overflow, particularly with nested padding and long words. The classes and dimensions are confirmed in source. Browser overflow, tap behavior and exact alignment are unverified.

## Wireframes

Diagrams show order and approximate proportions. Repeated cards and graphic blocks are schematic.

```text
HOME · DESKTOP (>=768)                       HOME · MOBILE (<640)
+-----------------------------------------+  +------------------------+
| MovieExplorer   Home Favorites [Search]|  | MovieExplorer          |
+-----------------------------------------+  | Home                   |
| Popular Movies                          |  | Favorites              |
| ======================================= |  | [ Search movies...   ] |
| Genre [All Genres]   Year [e.g. 2024]    |  +------------------------+
| [card] [card] [card] [card] [card]         |  | Popular Movies         |
| [card] [card] [card] [card] [card]         |  | ====================== |
+-----------------------------------------+  | Genre [All Genres    ] |
|               Footer                    |  | Year  [e.g. 2024     ] |
+-----------------------------------------+  | [ card ]  [ card ]    |
                                             | [ card ]  [ card ]    |
                                             +------------------------+
                                             |    Stacked footer      |
                                             +------------------------+

FAVORITES · DESKTOP                          FAVORITES · MOBILE
| MovieExplorer   Home Favorites [Search]|  | MovieExplorer          |
| Favourite Movies                        |  | Home                   |
| ======================================= |  | Favorites              |
| [ card ] [ card ] [ card ] [ card ]       |  | [ Search movies...   ] |
| [ card ] [ card ] [      ] [      ]       |  | Favourite Movies       |
|               Footer                    |  | ====================== |
                                             | [ card ]  [ card ]    |
                                             | [ card ]               |
                                             |    Stacked footer      |

DETAILS · DESKTOP                            DETAILS · MOBILE
| MovieExplorer   Home Favorites [Search]|  | MovieExplorer          |
| +-----------+   <- Back                 |  | Home / Favorites below |
| |           |   Movie title             |  | [ Search movies...   ] |
| |  Poster   |   Tagline                 |  | +--------------------+ |
| |           |   * 7.4 / 10 (N votes)     |  | |       Poster       | |
| +-----------+   Overview                |  | +--------------------+ |
|                 Release date   Runtime  |  | <- Back                |
|                 Cast                    |  | Movie title / tagline  |
|               Footer                    |  | * 7.4 / 10 (N votes)   |
                                             | Overview               |
                                             | Release date | Runtime |
                                             | Cast                   |
                                             |    Stacked footer      |

CARD ANATOMY                     HEADER ANATOMY
+---------------------+          header.bg-gray-900.shadow-lg
| full-width poster   |            nav.container.mx-auto.p-4
| intrinsic height    |              wordmark link to /
+---------------------+              group (column -> row at md)
| Movie title (H2)    |                Home link
| Release Date: ...   |                Favorites link
| [ Details    ] (♡)  |                search input
+---------------------+

FOOTER ANATOMY
footer.bg-gray-900
  Made by Ahmed Wanjugi using
  Vue.js, Tailwind CSS, Pinia        (one link per line on mobile)
  Movie data provided by TMDB.

HOME LOADING (short shell)       FAVORITES EMPTY (short shell)
| Header                     |   | Header                     |
| Popular Movies             |   | Favourite Movies           |
| ========================== |   | ========================== |
| Genre ...  Year ...        |   | No favorite movies found. |
| Loading movies...          |   | Footer                     |
| Footer                     |   |                            |
| remaining grey space       |   | remaining grey space       |
| viewport bottom            |   | viewport bottom            |

DETAIL LOADING (short shell)
| Header                     |
| Loading movie details...   |   (centered)
| Footer                     |
| remaining grey space       |
```

## Interaction, focus and motion

- Navigation and technology links turn green on hover. The TMDB link lightens blue. Details darkens its green fill. These controls have no authored transition duration. Their native keyboard semantics remain available.
- `MovieCard` uses `transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl`. Scaling does not reflow grid tracks. The elevated card can extend into neighboring space.
- The heart uses `transition-colors duration-200`. Clicking or keyboard activating it toggles a movie in Pinia and changes fill/stroke. There is no visual keyboard-focus replacement for the removed outline and no pressed-state announcement.
- The Back arrow uses `transition-transform duration-200 group-hover:-translate-x-1`. Text darkens on hover. Back strips its focus outline.
- Search has explicit `focus:ring-2 focus:ring-green-500`. Genre/year define green focus borders and ring color. No custom route focus, live result announcements, skip link, or reduced-motion variants exist.

## Known visual defects and candidate fixes

| Status and issue | Source and cause | Proposed improvement |
|---|---|---|
| Confirmed source cause · footer sits high while loading or empty | App.vue lines 9–16 uses a viewport-minimum flex column without growing main. HomeView lines 63–68 initially renders one line. | Give the shell main flex growth and keep footer in flow. |
| Confirmed · nested containers and landmarks | App.vue line 12 and each routed view start with `main.container.mx-auto.p-4`. | Use one main landmark and one owner for page padding. |
| Confirmed absence · loading grid and reserved poster dimensions | HomeView lines 63–68, MovieCard lines 17–18, Detail lines 27–35. | Approved skeletons and stable media slots can reduce layout shift. |
| Confirmed source difference · card widths | HomeView line 67 is five columns at `md`, FavoritesView line 16 is four. | Evaluate one responsive grid across both pages. |
| Suspected visual impact · tablet density and narrow overflow | HomeView line 67, App.vue line 12 and MovieCard lines 19–35 combine five tracks at 768 px with nested padding and minimum action widths. | Inspect common widths, then tune track progression and action layout. |
| Suspected visual impact · long titles and mixed poster heights | MovieCard lines 17–24 allow natural wrapping and auto image height. | Measure long-title fixtures, then consider stable poster slots and consistent text space. |
| Confirmed scale rule · nearby overlap is unverified | MovieCard line 16 scales 105% in place without reallocating tracks. | Assess a restrained hover effect and reduced-motion behavior. |
| Confirmed absence · missing image treatment | MovieCard lines 17–18 and Detail lines 33–35 directly concatenate poster paths. | Handle absent paths and load failures with a defined placeholder. |
| Confirmed · unclear request feedback | HomeView lines 21–36 and 63–68, Detail lines 19–28, FavoritesView lines 12–14. | Give initial loading, refresh, empty and error independent UI and accessible announcements. |
| Confirmed · contrast, labels, and focus | Palette above. AppHeader lines 25–33, MovieCard lines 25–39, HomeView lines 63–64, FavoritesView lines 12–13 and Detail lines 39–55. | Keep the hue identity while improving contrast, control names, state, focus and motion. |

## Proposed direction and decisions awaiting approval

A future landing page may feature Movies and TV Series together, with dedicated browse pages, a prominent search or discovery area, Popular/Trending/Top Rated/Upcoming collections, shared cards and grids, advanced filters, skeleton loading, and standardized poster treatment. Mixed favorites should express media type without losing the current add/remove affordance. Movie and TV details can share visual patterns, with TV-specific season and episode sections. Light and dark themes and backdrop imagery are optional concepts. Keep green and dark navy central across any approved directions.

Homepage composition, background treatment, navigation hierarchy, grid progression, placeholder art, poster crop policy, and theme behavior require later design approval. Architecture proposals are recorded in [ARCHITECTURE.md](ARCHITECTURE.md).

## Visual references to capture later

- Home, Favorites and Details at narrow mobile, large mobile, both sides of 640 and 768 px, tablet, laptop, desktop and wide desktop.
- Search results and off-Home search interaction, applied genre/year filters, and navigation at each layout.
- One favorite, several favorites, empty Favorites, default/selected hearts, long titles, missing posters, and varying poster proportions.
- Initial loading, slow refresh with existing cards, details loading, empty and failed responses, and the footer relative to the viewport.
- Hover, visible keyboard focus, zoom, and reduced-motion behavior.

## Design preservation rules and decision record

- Preserve MovieExplorer's visual identity unless the owner approves a change. Reuse established patterns and keep discovery poster-first.
- Use consistent visual treatments for matching movie and TV functions. Avoid unrelated decorative edits and redesigns.
- Treat accessibility, layout and feedback problems as functional defects. A documented defect is evidence of the baseline.
- Update this file alongside each approved visual change. Record the date, decision, rationale, affected components and verification evidence.

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-26 | Recorded the movie-only design baseline | Preserve the existing identity and make future proposals distinguishable from shipped behavior. |
