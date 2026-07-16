# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-07-16
- Primary product surfaces: Hardware discovery, serial port tools, BLE gateway tools, device configuration popovers.
- Evidence reviewed: `src/Home.tsx`, `src/nav.tsx`, `src/pages/broadcast/*`, `src/components/ui/*`, `src/globals.css`, `tailwind.config.js`, `public/hyz_logo.png`.

## Brand
- Personality: Quiet, technical, and dependable for repeated device-debugging tasks.
- Trust signals: Explicit connection state, stable control sizing, direct device status, and restrained use of color.
- Avoid: Marketing-style layouts, decorative gradients, large rounded containers, and unexplained icon-only actions.

## Product goals
- Goals: Let operators start UDP discovery quickly, inspect discovered hardware, and move into configuration without visual noise.
- Non-goals: Consumer onboarding, dashboard analytics, or promotional presentation.
- Success signals: The current discovery state, target multicast endpoint, primary action, and discovered-device result area are scannable at a glance.

## Personas and jobs
- Primary personas: Hardware integrators and support engineers.
- User jobs: Start or stop a UDP listener, trigger discovery, clear stale results, identify a device, and open its configuration.
- Key contexts of use: Desktop Tauri application, often alongside hardware/network tooling on 1000px-plus windows.

## Information architecture
- Primary navigation: Scan, Serialport, BLE, QR ac, and Setting.
- Core routes/screens: `/` discovery, `/serialport`, `/ble`, `/qrac`, `/updater`, `/quit`.
- Content hierarchy: Navigation context, connection controls and result filters, discovery actions, then device results.

## Design principles
- Keep operational state visible before configuration detail.
- Use a compact, aligned toolbar for repeated actions; reserve text buttons for primary commands only.
- Give empty and disabled states the same deliberate structure as populated states.
- Tradeoffs: Information density takes precedence over decorative visual treatment; device cards remain unchanged unless their own workflow needs redesign.

## Visual language
- Color: Existing semantic tokens from `globals.css`; green for active state, red only for destructive or stopped-state affordances, and muted tones for inactive information.
- Typography: Existing system/Inter stack, 14px control text, compact labels, no display typography.
- Spacing/layout rhythm: 4px internal rhythm with 8px control groups; 12px toolbar padding and compact 32px controls.
- Shape/radius/elevation: Use the global 14px radius token and its derived scale; light borders and restrained button shadows only.
- Motion: Existing short color transitions; no continuous decorative animation. Radar animation is feedback only while a scan is in progress.
- Imagery/iconography: Reuse Lucide icons. Icon-only controls require accessible labels and hover tooltips.

## Components
- Existing components to reuse: `Button`, `Input`, `Tabs`, `Tooltip`, `Separator`, `ScrollArea`, and Lucide icons.
- New/changed components: Discovery toolbar layout and empty-result state inside the existing broadcast page and device list.
- Variants and states: Listener stopped/active, scan available/disabled, clear available/disabled, empty/occupied result list.
- Token/component ownership: Semantic color, radius, and control-density rules live in `globals.css`, `tailwind.config.js`, and the shared UI primitives; route styles handle layout only.

## Accessibility
- Target standard: Keyboard-operable desktop controls with visible focus and semantic labels.
- Keyboard/focus behavior: Buttons retain native button semantics; icon actions expose `aria-label` and tooltip text.
- Contrast/readability: Use existing foreground/muted foreground tokens and never rely on color alone for listener state.
- Screen-reader semantics: Announce connection state and label all endpoint fields.
- Reduced motion and sensory considerations: Do not add nonessential motion; active scan feedback remains brief and functional.

## Responsive behavior
- Supported breakpoints/devices: Desktop-first Tauri window, adaptable down to narrow desktop and tablet-like widths.
- Layout adaptations: Toolbar groups wrap with stable control heights; the result list consumes remaining vertical space rather than a viewport-sized fixed region.
- Touch/hover differences: Tooltips are supplementary; controls remain labelled and keyboard-accessible.

## Interaction states
- Loading: Scan action may show an active radar state while a command is in flight.
- Empty: Preserve the result area and show that no devices have been found.
- Error: Reuse Sonner error toasts for listener and command failures.
- Success: Reuse Sonner success toasts for listener lifecycle and protocol commands.
- Disabled: Discovery and clear actions are unavailable until the listener is active or results exist.
- Offline/slow network, if applicable: Listener status remains explicit; the empty state does not imply a protocol error.

## Content voice
- Tone: Direct and technical.
- Terminology: Use `UDP`, `Multicast`, `Port`, `Listening`, and `devices` consistently.
- Microcopy rules: State current result or action outcome; avoid tutorial or promotional copy.

## Implementation constraints
- Framework/styling system: React 19, React Router, Tailwind CSS, shadcn-style local components, Tauri 2.
- Design-token constraints: Reuse CSS variables and Tailwind semantic colors already present in the repository.
- Performance constraints: Avoid new runtime dependencies and keep device rendering virtualisation-free unless profiling demonstrates a need.
- Compatibility constraints: Preserve Tauri command names and UDP discovery behavior.
- Test/screenshot expectations: Typecheck/build after edits; verify the root route renders controls, empty state, and navigation in a browser smoke test.

## Open questions
- [ ] Confirm the protocol device-type mapping for DCC and BLE GW before filtering results by tab. Owner: product/protocol maintainer. Impact: filter behavior.
