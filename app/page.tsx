import DashboardClient from "./dashboard-client";
import LoginClient from "./login-client";
import { getSessionUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) return <LoginClient />;
  return <DashboardClient mode={user.role} />;
}
