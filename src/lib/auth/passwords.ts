import "server-only";

import { hash, verify } from "@node-rs/argon2";

// Argon2id (algorithm 2), OWASP-recommended minimum: 19 MiB memory, 2 iterations, 1 lane.
const OPTIONS = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, OPTIONS);

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummy: Promise<string> | undefined;
/** Verifies against a throwaway hash so "unknown email" costs the same time as "wrong password". */
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword("not-a-real-password-for-timing");
  await verifyPassword(await dummy, password);
}
