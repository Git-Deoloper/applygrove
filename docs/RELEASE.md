# Public release checklist

- [ ] Verify trademark/domain availability and obtain permission for every asset.
- [ ] Inspect the **entire** Git history (including authors, tags and prior branches) for identifying names, personal emails, credentials and secrets. The release ZIP contains no Git directory. Start from a clean local repository with a generic project commit identity.
- [ ] Configure a working HTTPS domain, absolute sharing image URL and canonical address.
- [ ] Run `npm run verify` under Node.js 22, review CI, and inspect a production deployment.
- [ ] Manually verify add/edit/move/delete, keyboard focus, empty board, sample board, JSON backup/import, CSV download, `.ics` import and offline PWA install on Safari, Firefox, Chromium and mobile.
- [ ] Try invalid URLs, malformed JSON, non-ASCII text, huge notes, date edge cases and narrow viewports.
- [ ] Make sure content is not clipped at mobile widths and the accessibility tree makes sense to screen reader users.
- [ ] Review CSP and security headers after deployment; inspect Network panel for unintentional outbound calls.
- [ ] Turn on secret scanning, push protection, private vulnerability reporting and `main` branch rules where supported.
- [ ] Publish honest screenshots using fictional sample roles. Avoid fabricated metrics, testimonials or celebrity/customer logos.
- [ ] Share in appropriate communities with useful context and respect community rules; prioritize real feedback over viral claims.

Public launch and rapid growth are not guaranteed. This is a tested MVP, not a substitute for independent security review or production browser testing.
