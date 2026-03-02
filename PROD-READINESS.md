# Production Readiness Checklist (cong-le.com)

Last updated: March 2, 2026

## Done in this repo
- Added `/privacy.html`
- Added `/terms.html`
- Added `/developer.html`
- Added shared styling in `/legal.css`
- Updated footer links in live bundle to legal/support pages
- Updated public support email in site content to `support@cong-le.com`

## Remaining setup outside code
1. Configure domain email aliases in Cloudflare Email Routing:
   - `support@cong-le.com` -> your preferred inbox
   - `privacy@cong-le.com` -> your preferred inbox
   - `legal@cong-le.com` -> your preferred inbox
2. Add legal page links in each App Store listing:
   - Privacy Policy URL: `https://www.cong-le.com/privacy.html`
   - Terms URL: `https://www.cong-le.com/terms.html`
   - Support URL: `https://www.cong-le.com/developer.html`
3. Legal pass:
   - Review wording with a lawyer for your target jurisdiction(s).
4. Security/ops baseline:
   - Enforce HTTPS in GitHub Pages once certificate is issued.
   - Keep Cloudflare DNS records stable after HTTPS activation.
