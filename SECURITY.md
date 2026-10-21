# Security and privacy

## Reporting vulnerabilities

If enabled, use GitHub Private Vulnerability Reporting from this repository's Security tab. Do not disclose exploitable details or private data in a public issue. Otherwise, ask maintainers for a private reporting channel without including sensitive details.

## Security model

- All tracker data is held in first-party browser local storage; it is **not encrypted** at rest.
- There is no account system, remote data store, analytics SDK, or server-side API.
- Text inputs render via `textContent`; job links are normalized and limited to `http(s)` without URL credentials.
- The JSON importer validates schema, IDs, entry count and input size. CSV output mitigates formula injection.
- The site ships a restrictive Content Security Policy and disables third-party fetches by application code.
- Background offline caching is for site assets, not application records.

## What this does not protect against

Someone with access to your browser profile, malicious browser extensions, shared devices, compromised endpoints, accidental local-storage clearing or stolen backup files may access or erase saved data. This app does not provide account recovery, device-to-device synchronization, encrypted storage, phishing detection or verified job-posting authenticity. Users should back up important information and avoid pasting secrets or ID documents into notes.

## Maintenance

Keep GitHub Actions and Node.js versions current. Enable Dependabot, branch protection, and private vulnerability reporting. Keep the public repository free from credentials, personal emails and machine-specific paths.
