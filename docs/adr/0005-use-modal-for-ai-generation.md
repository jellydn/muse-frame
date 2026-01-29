# 5. Use Modal for AI Generation

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame needs GPU compute for AI portrait generation:
- ComfyUI with Stable Diffusion 3.5 / FLUX
- Variable load (scales to zero when idle)
- Target < 5 minutes generation time
- Cost per portrait < 30% of $10 price ($3)

Options considered:
1. **Replicate** - Managed API, pay per prediction
2. **Modal** - Serverless GPU, pay per compute second
3. **RunPod** - GPU cloud, hourly billing
4. **Self-hosted** - Own GPU server

## Decision

Use **Modal** for serverless GPU compute running ComfyUI.

Key reasons:
- Pay only for actual compute time (scales to zero)
- Lower cost than Replicate for custom workflows
- Full control over ComfyUI configuration
- Cold start acceptable for async generation
- Easy deployment of custom Docker images

## Consequences

### Positive
- Cost-effective for variable load (no idle costs)
- Full control over model and workflow
- Custom prompt templates per style
- Scales automatically with demand

### Negative
- Cold starts add latency (mitigated by async processing)
- More setup than Replicate's API
- Need to manage ComfyUI configuration
- Modal platform dependency
