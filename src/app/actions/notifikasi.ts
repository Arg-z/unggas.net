"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/current-user";

/** Buka notifikasi: tandai dibaca (milik sendiri saja) lalu lompat ke balasannya. */
export async function bukaNotifikasi(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) redirect("/masuk");

  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) {
    const n = await prisma.notification.findUnique({ where: { id } });
    if (n && n.userId === user.id && !n.readAt) {
      await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    }
  }
  redirect(`/t/${Number(formData.get("discussionId"))}#post-${Number(formData.get("postNumber"))}`);
}

/** Tandai semua notifikasi user sebagai dibaca. */
export async function tandaiSemuaDibaca(): Promise<void> {
  const user = await requireUser();
  if (!user) redirect("/masuk");
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/notifikasi");
}
