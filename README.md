# Mindalo website — mindalo.org

A simple, fast website for Mindalo: closing the gap between dementia diagnosis, care and understanding across Africa.

It is plain HTML and CSS — no build step, no database, nothing to install. GitHub Pages hosts it for free.

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | Home page |
| `guides.html` | List of guides for carers |
| `guides/*.html` | The five guides |
| `training.html` | Training and education |
| `about.html` | About Mindalo, work with us, contact |
| `404.html` | "Page not found" page |
| `assets/css/site.css` | All the styling (colours are at the top) |
| `assets/js/site.js` | Text size, listen and print buttons |
| `assets/` | Logo, favicon and the image shown when the site is shared |
| `CNAME` | Tells GitHub Pages to use mindalo.org |

## Designed for people living with dementia

- Large text (20px) and three text sizes, remembered on each device
- "Listen to this page" uses the voice built into the phone or computer
- Print button for guides; print layout removes menus
- Strong colour contrast (WCAG AA or better), underlined links, big buttons
- The same simple menu on every page — four items, no hidden "hamburger" menu
- No pop-ups, sliding carousels or auto-playing video
- Plain English, short sentences, "The main points" at the top of every guide
- Font: Atkinson Hyperlegible Next, designed for readers with low vision

## Put it live on mindalo.org (GitHub Pages)

1. On GitHub, create a new **public** repository, for example `mindalo-website`.
2. Upload everything in this folder (including the `guides` and `assets` folders, `CNAME` and `.nojekyll`).
3. In the repository go to **Settings → Pages**. Under "Build and deployment" choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. Under **Custom domain** check that it says `mindalo.org` (the CNAME file sets this).
5. At the company where you bought mindalo.org, add these DNS records:

   | Type | Name | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | `<your-github-username>.github.io` |

   Remove any other A records for `@` (for example a "parked page" record).
6. DNS can take up to 24 hours. When GitHub shows the domain is working, tick **Enforce HTTPS**.
7. Recommended: in your GitHub account **Settings → Pages → Add a domain**, verify mindalo.org so nobody else can use it on GitHub.

## Editing the text

Open any `.html` file on GitHub, click the pencil icon, change the words between the tags, and "Commit changes". The site updates in about a minute.

The top bar, menu and footer are repeated on every page. If you change one of them, change it on every page (or ask Claude to do it for you).

## Before launch — please check

- [ ] Set up the email address `hello@mindalo.org` (or change it everywhere to the address you use)
- [ ] Add your charity or company registration number to the footer, if you have one
- [ ] Ask a clinician to review the five guides
- [ ] Add real photos (with consent) if you want them
- [ ] Privacy: the site sets no cookies and has no tracking. The font loads from Google Fonts; if you prefer, the font files can be hosted in `assets/` instead.
