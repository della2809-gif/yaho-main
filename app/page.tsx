import DashboardClient from "./dashboard-client";
import Landing from "./landing";
import { getSessionUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) return <Landing />;
  return <DashboardClient mode={user.role} />;
}
