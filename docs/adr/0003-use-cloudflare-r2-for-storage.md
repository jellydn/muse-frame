# 3. Use Cloudflare R2 for Storage

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs object storage for:
- Uploaded user photos (temporary, 7-day retention)
- Generated AI portraits (7-day expiring links)

Requirements:
- S3-compatible API for easy integration
- Signed URLs for secure, expiring downloads
- Cost-effective for variable traffic
- No egress fees (users download generated images)

Options considered:
1. **AWS S3** - Industry standard, well-documented
2. **Cloudflare R2** - S3-compatible, zero egress fees
3. **Backblaze B2** - Low cost, S3-compatible

## Decision

Use **Cloudflare R2** for all object storage.

Key reasons:
- Zero egress fees (critical for image downloads)
- S3-compatible API via `@aws-sdk/client-s3`
- Signed URLs for secure, expiring access
- Competitive storage pricing
- Global edge network for fast downloads

## Consequences

### Positive
- No egress costs regardless of download volume
- Standard S3 SDK works unchanged
- Signed URLs provide secure, expiring access
- Easy lifecycle rules for auto-cleanup

### Negative
- Smaller ecosystem than AWS S3
- Fewer advanced features (no S3 Select, etc.)
- Cloudflare account dependency
