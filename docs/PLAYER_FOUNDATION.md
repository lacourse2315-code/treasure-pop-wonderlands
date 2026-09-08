# Player Foundation — PRD-03

## Profiles

Local profiles are pure TypeScript domain objects managed independently of Phaser. Maximum local profiles: 6. Display names are trimmed, whitespace-normalized, required, and limited to 24 characters. IDs use `crypto.randomUUID()` and are never public account identifiers.

## Input abstraction

Semantic commands are `move-up`, `move-down`, `move-left`, `move-right`, `primary-action`, `back`, and `pause-menu`. Keyboard and touch adapters translate device events into the same `PlayerCommandBus`. A future gamepad adapter can emit the same commands without changing Domain.

## Development harness

The visible profile/save/input controls are explicitly DEVELOPMENT / NON-FINAL UI. They exist only to exercise the PRD-03 foundation. They are not the final home screen, final Who Plays screen, HUD, joystick, avatar UI, realm, quest, or gameplay.

## Privacy

PRD-03 uses local profiles only: no online authentication, child cloud account, email, birth date, geolocation, child analytics, public identifier, advertising, or chat.
