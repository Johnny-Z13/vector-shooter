# Ship Workbench Unlock Pool Design

## Context

The current ship workbench rolls a small number of real upgrade choices, but renders them inside the full build manifest. Cards that were not rolled still appear in the install view as disabled manifest entries. This makes the interface read as if the player is being shown many upgrade options that cannot be clicked.

The redesign keeps the existing weighted upgrade pressure, but separates the install surface from the reference manifest. If an item is presented as an install choice, it should be clickable.

## Goals

- Show the player a clear set of upgradeable workbench offers.
- Preserve weighted, run-shaping randomness rather than turning the workbench into a static shop.
- Let maxing an upgrade open new upgrade families, creating a visible long-term progression rhythm inside a run.
- Keep maxed and locked systems visible as context, but not mixed into the clickable offer list.
- Avoid greyed-out visible install choices.

## Workbench Structure

The ship workbench has one primary install surface and one reference surface.

The primary install surface shows upgrade offers sorted by actionability:

1. **Upgradeable offers** at the top. These are the currently rolled workbench offers and are always clickable unless an install animation is already in progress.
2. **Maxed systems** below the offers. These remain visible with a completed/maxed treatment so the player can read what has been finished and what it unlocked.
3. **Locked systems** below maxed systems. These are visible while scrolling, clearly labelled as future unlocks and never styled as current offers.

The reference manifest remains available for the full build overview: owned ranks, maxed systems, locked future systems, catalysts, relics, evolutions, and limit ranks. It is informational only.

## Offer Rules

- The workbench displays 5 current offers when enough installable options exist.
- Any displayed offer must be installable.
- Maxed upgrades do not appear as installable offers.
- Owned upgrades remain weighted to appear more often, preserving build coherence.
- Rare rolls can still inject relics.
- Available evolutions can still appear as special high-priority offers.
- Limit Break offers appear only when the unlocked normal pool has no meaningful installable choices left.
- Reroll only replaces the current offer set with other installable offers from the unlocked pool.

## Unlock Pool

The workbench uses an unlocked upgrade pool. Only upgrades in that pool can roll as normal offers.

Starter pool:

- Pulse Cannon
- Drift Engine
- Signal Magnet
- Halo Battery
- Prism Barrel

Unlocks happen when a system reaches max rank:

- Max Pulse Cannon unlocks Static Arc and Rail Lattice.
- Max Prism Barrel unlocks Ghost Rounds and Echo Chamber.
- Max Drift Engine unlocks Nav Ghost and Phase Rudder.
- Max Halo Battery unlocks Hull Stitcher and Salvage Hunger.
- Max Signal Magnet unlocks Luck Coil and Cargo Spine.
- Max Luck Coil unlocks Survey Array.
- Max Survey Array unlocks Exo-Lung, Skinweave Suit, and Field Blaster.
- Max Rail Lattice or Echo Chamber unlocks Rift Needle.
- Max Phase Rudder or Cargo Spine unlocks Mine Wake.

If an unlock target is already unlocked through another route, no duplicate state is created.

## UI Behavior

Upgradeable offer cards use the strongest visual treatment and appear first. Each card shows:

- upgrade name
- current rank and max rank
- install route, such as `INSTALL RANK 3/6`
- next-rank effect
- bucket label

Maxed cards use a completed treatment, such as `MAXED`, with the final effect and any newly unlocked systems. They are not buttons.

Locked cards use a quieter treatment, such as `LOCKED`, with an unlock hint like `Max Signal Magnet`. They are not buttons and appear below actionable and maxed cards.

Special offers such as relics, evolutions, and limit breaks appear with the upgradeable offer group and are clickable when displayed.

## Data Model

Add an explicit workbench unlock definition close to the upgrade balance data. The model should describe:

- starter upgrade ids
- unlock edges from maxed upgrade id to newly unlocked upgrade ids
- helper for computing the currently unlocked pool from the current build
- helper for returning locked upgrade ids with their unlock requirement text

This can be derived from build ranks at render and roll time, so it does not need new save data unless future design requires persistent non-rank unlocks.

## Roll Flow

1. Compute unlocked normal upgrades from starter ids plus max-rank unlock edges.
2. Filter out maxed upgrades.
3. Inject available evolutions before normal upgrades when evolution rules hit.
4. Roll relics using existing relic chance rules.
5. Fill remaining slots to 5 with weighted normal upgrades from the unlocked, non-maxed pool.
6. If the unlocked normal pool cannot fill the offers, fill remaining slots with valid special offers or Limit Breaks.

## Error Handling

The install click path keeps the existing safety check. If a stale choice somehow becomes invalid, the workbench rerolls and shows a short rejection toast. This is a defensive fallback, not a normal visible state.

The renderer must not output disabled buttons for normal upgrade offers. Non-actionable maxed and locked systems should be non-button elements.

## Tests

Add focused tests for the workbench unlock helpers:

- starter pool contains the five starter systems
- maxing a starter system unlocks the configured children
- maxed systems are filtered out of rollable offers
- locked systems include useful unlock requirement text

Update workbench UI tests to assert:

- the workbench install surface has clickable offers before maxed and locked sections
- normal disabled upgrade buttons are not rendered as visible install offers
- maxed and locked systems remain visible as non-button context

## Out Of Scope

- Rebalancing upgrade effects or rank counts.
- Replacing weighted rolls with a deterministic tree shop.
- Changing relic acquisition outside workbench offer eligibility.
- Adding persistent save data for unlock state.
