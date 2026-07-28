# i10 visual check (vite preview, post-grading — non-scoring)

- Dark single-page site: fixed navbar (Netadyne brand, anchor nav, Sign in + CTA), centered
  hero "Meet SkyNet. 10× better than Fable." with subtle radial wash, dual CTAs. Clean,
  coherent, less ornate than i01's baseline (no terminal demo card / grid texture) —
  consistent with the leanest-run profile (51 turns, 712 src lines).
- No console errors on load; page title "SkyNet by Netadyne — 10× better than Fable".
- The known shipped defect is invisible at a glance by design: the Fable comparison bar
  (Progress color="grey") renders with default styling instead of grey — exactly the
  "type-valid CSS no-op" class. Visual-diff would not flag it without knowing intent.
