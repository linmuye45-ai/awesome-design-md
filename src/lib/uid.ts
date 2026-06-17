/**
 * Tiny, dependency-free unique-id generator.
 *
 * IDs are monotonic within a session (a module-level counter guarantees no two
 * calls collide even inside the same millisecond) and carry a human-readable
 * prefix so they're easy to eyeball in the store / audit log (e.g. `msg_lr8x_3`).
 *
 * This is deliberately NOT cryptographically random — it's for client-side
 * record keys, conversation messages and demo data, never for security tokens.
 */

let counter = 0;

export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}
