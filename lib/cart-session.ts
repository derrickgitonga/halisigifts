import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getSessionOrUserId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get("halisi_guest_session")?.value;
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return guestId;
}

export async function getExistingCartSession(sessionToken: string) {
  if (!sessionToken) return null;
  return prisma.cartSession.findUnique({
    where: { sessionToken },
  });
}

export async function getOrCreateCartSession(sessionToken: string) {
  let cartSession = await prisma.cartSession.findUnique({
    where: { sessionToken },
  });

  if (!cartSession) {
    let userId: string | null = null;
    let email: string | null = null;
    let customerName: string | null = null;

    if (sessionToken.startsWith("user_")) {
      userId = sessionToken.replace("user_", "");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        email = user.email;
        customerName = user.name;
      }
    }

    cartSession = await prisma.cartSession.create({
      data: {
        sessionToken,
        userId,
        email,
        customerName,
        status: "ACTIVE",
        lastActiveAt: new Date(),
      },
    });
  } else {
    if (cartSession.status === "ABANDONED") {
      cartSession = await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: {
          status: "ACTIVE",
          lastActiveAt: new Date(),
        },
      });
    }
  }

  return cartSession;
}
