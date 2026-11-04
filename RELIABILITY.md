# RELIABILITY.md — Zero-Regression & Production Hardening Guide

## 1. Zero-Regression Invariant
All core defect-tracking capabilities, backward-compatible schemas, and prompt synthesizer workflows must never break:
- **Baseline Invariant**: The 22 canonical bugs ported from legacy formats are preserved intact with identical descriptions, severity ratings, acceptance checklists, and evidence assets.
- **Fail-Safe Offline Mode**: If Supabase connectivity is intermittent or unconfigured, the platform seamlessly falls back to local memory and cache storage without UI degradation or runtime exceptions.

## 2. Security & Data Protection
- **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer. Anonymous clients cannot modify private project data without matching permissions.
- **Sanitized Markdown & Safe Canvas**: Image uploads are handled via bounded canvas scaling (max 1920px) preventing memory exhaustion (DoS).
- **Safe Environment Fallbacks**: Public keys are read safely without leaking backend secrets to client bundles.

## 3. Performance & Resource Footprint
- **Frame Budget**: Canvas drawing operates within an 8.3ms frame budget (120FPS capable).
- **Zero-Polling Architecture**: Uses WebSocket push via Supabase Realtime subscriptions rather than periodic interval polling, yielding 0% idle CPU drain.
- **Bundle Optimization**: Built with Next.js Turbopack, tree-shaking, and lightweight SVG vector primitives.
