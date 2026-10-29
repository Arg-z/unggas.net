import { getSessionUser } from "./session";

/** Guard untuk kode server: user login aktif atau null. Bukan Server Action. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user || user.isBanned) return null;
  return user;
}
