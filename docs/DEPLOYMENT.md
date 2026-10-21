# Deployment and launch checks

## Cloudflare Pages

1. Create a **new** GitHub repository and push this project into it. Do not upload a prior project or `.git` folder.
2. Connect that repository to Cloudflare Pages. Set framework preset to **None**, build command to `npm run build`, and output directory to `dist`.
3. Set the production branch to `main` and enable HTTPS. There are no environment variables or API keys.
4. Verify the `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` and other headers in your browser's Network panel. Other hosts must configure equivalent headers independently.
5. Run the full [release checklist](RELEASE.md), including real browsers and actual device testing.
6. Set your canonical HTTPS URL and an absolute Open Graph image URL in `index.html`; do not claim that relative `og:image` always works on social platforms. Configure a sitemap if appropriate.
7. Check brand name availability and ensure all logos, screenshots and imagery are yours to publish.

## Alternative hosts

Deploy the contents of `dist/` to a static HTTPS host. Its production server must serve `.webmanifest`, `.webp`, `.js`, `.css`, `.svg`, and `.png` with appropriate MIME types and apply equivalent security headers.

## Maintenance

Automated tests run on every pull request and push to `main`. The `verify` GitHub Actions status check can be made mandatory using a repository ruleset once it has completed successfully. Prefer review-first feature branches, squash merges and protected `main`.

Avoid artificial stars, automated follows, unsolicited mass messages, fake testimonials, manipulated reviews and unsupported performance promises.
