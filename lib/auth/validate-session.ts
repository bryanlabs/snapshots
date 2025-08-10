import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function validateSession() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Check if user exists in database
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  });

  if (!userExists) {
    // User in session but not in database - force re-authentication
    console.error(`Session user ${session.user.id} not found in database - forcing re-authentication`);
    redirect("/api/auth/signout?callbackUrl=/auth/signin");
  }

  return session;
}