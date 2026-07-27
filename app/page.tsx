import { fetchDashboardData } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";

export const revalidate = 300;

export default async function DashboardPage() {
  const { fleet: allFleet, tickets } = await fetchDashboardData();
  const fleet = allFleet.filter((f) => f.visibilidadeDash.trim().toLowerCase() === "sim");

  return <Dashboard fleet={fleet} tickets={tickets} />;
}
