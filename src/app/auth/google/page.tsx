import { getGoogleAuthUrl } from "@/lib/google/auth";
import { redirect } from "next/navigation";

export default function GoogleAuthPage() {
  const url = getGoogleAuthUrl();
  redirect(url);
}
