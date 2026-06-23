import { redirect } from "next/navigation";

export default function SettingsPlansRedirect() {
  redirect("/dashboard/plans");
}
