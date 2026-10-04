import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootIndexPage() {
  const session = await auth();

  if (session.userId) {
    redirect("/dashboard");
  }

  redirect("/login");
}
