/**
 * Returns a loosely-typed Supabase client to work around postgrest-js v2.99
 * generic inference issues. All application-level types are enforced by our
 * own interfaces in src/types/database.ts — this just lets us call .insert()
 * and .update() without the ORM resolving the table Row to `never`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySupabaseClient = any;

export function asDb(
  client: ReturnType<typeof import("./client").createClient>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return client;
}
