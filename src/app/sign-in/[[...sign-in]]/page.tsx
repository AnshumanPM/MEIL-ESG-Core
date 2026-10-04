import { redirect } from "next/navigation";

export default function SignInCatchAllPage() {
  redirect("/login");
}
