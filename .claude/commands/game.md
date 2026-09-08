---
description: Build, modify, test, and polish the portfolio mini-game.
argument-hint: [describe the game feature, fix, or polish pass to make]
---

# Game development command

Task: $ARGUMENTS

Delegate this to the `game-dev` subagent (Agent tool, `subagent_type: "game-dev"`) rather than doing game work inline — that agent owns the platformer's architecture, conventions, and prior context. Brief it with the task above plus the full context below, since a fresh agent invocation doesn't see this conversation's history unless you're resuming a prior `game-dev` run (check for one and continue it via `SendMessage` if it exists, rather than starting a duplicate).

The portfolio game is an original 2D platformer that turns the developer's real education, skills, projects, and experience into an interactive journey.

## Important — non-negotiable

Do not copy Super Mario or any other copyrighted game. The game may be inspired by classic 2D platformer mechanics, but all characters, graphics, environments, sounds, names, and branding must be original.

## Before development

Have the agent:

1. Inspect the existing portfolio.
2. Locate the current game implementation (if one exists yet — it may not).
3. Understand the existing architecture.
4. Check the `portfolio-design` skill.
5. Identify the real developer information available to use (`src/data/resume.ts` and anything derived from it).
6. Avoid inventing personal, educational, professional, or project information.

## Game development

Have the agent implement the requested task, maintaining:

- Smooth movement
- Responsive controls
- Reliable collision detection
- Proper game state management
- Responsive layout
- Mobile touch controls
- Accessibility
- Good performance
- Original visual design
- Integration with the existing portfolio

## Portfolio integration

Real portfolio information only — never invented. Possible mappings:

- Education → levels
- Skills → collectibles
- Projects → interactive locations
- OJT → experience level
- Achievements → unlockables
- Résumé → final reward
- Contact information → final interaction

## Game features

The agent may implement, as relevant to the task: player movement, jumping, platforms, collectibles, checkpoints, enemies, obstacles, level progression, project information areas, skill collectibles, an achievement system, a pause menu, a restart system, mobile controls, a game-completion screen. Keep the game relatively small and polished — scope each invocation to what was actually asked, not everything on this list at once.

## Design

The game must feel like part of the portfolio. Follow the existing portfolio design system (tokens, fonts, the `portfolio-design` skill's anti-generic-design checklist). Avoid: generic AI-generated game aesthetics, excessive visual effects, unnecessary 3D effects, copyrighted assets, excessive complexity.

## Testing

After implementation, the agent must actually run through:

1. Desktop controls
2. Mobile controls
3. Collision detection
4. Level progression
5. Restart functionality
6. Pause functionality
7. Console errors
8. The project's build/type checks (`npx astro check`, `npx tsc --noEmit`, `npm run build`)
9. That the main portfolio still works (the game must not have regressed anything outside itself)

## Performance

Ensure the game does not negatively affect the main portfolio. Optimize: animation loops, assets, collision calculations, particles, event listeners, JavaScript execution.

## Final review checklist

Before the agent reports done, it should have verified:

- The game is playable.
- The controls work.
- The game works on mobile.
- The game does not cause horizontal scrolling.
- Portfolio information is accurate.
- The game does not break the main website.
- No copyrighted assets were added.
- The project builds successfully.

## Relaying the result

When the agent returns, relay its Final Report to the user in this shape — don't paraphrase away specifics, and don't add claims the agent didn't make:

### Game Changes
### Portfolio Information
### Files Changed
### Testing
### Remaining Issues

If the agent's report is missing one of these sections or hedges on whether something was actually tested, surface that gap rather than smoothing over it.
