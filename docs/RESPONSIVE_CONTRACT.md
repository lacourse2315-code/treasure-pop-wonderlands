# Responsive Contract — PRD-02

Wonderlands is landscape-only.

The bootstrap uses the complete dynamic viewport (`100dvw × 100dvh`), disables document scrolling/overscroll, honors CSS safe-area insets, and lets Phaser resize its canvas to the available safe viewport without stretching a fixed 16:9 image.

Future gameplay/UI work must distinguish world camera composition from UI safe layout. Essential controls must remain inside the safe UI region, use large touch targets, and never rely on hover.

Portrait on small/mobile displays is gated with a minimal rotate-device notice. This is technical bootstrap UI only, not final Wonderlands presentation.
