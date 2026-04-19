import DashboardHeader from "@/components/DashboardHeader";
import MorningBriefingHero from "@/components/MorningBriefingHero";
import KpiStrip from "@/components/KpiStrip";
import PipelineFunnelChart from "@/components/PipelineFunnelChart";
import LeadSourceChart from "@/components/LeadSourceChart";
import WeeklyActivityChart from "@/components/WeeklyActivityChart";
import TasksCard from "@/components/TasksCard";
import AppointmentsCard from "@/components/AppointmentsCard";
import NewLeadsCard from "@/components/NewLeadsCard";
import TransactionsCard from "@/components/TransactionsCard";

export default function Dashboard() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-6 py-6 space-y-6">
      <DashboardHeader />

      {/* Row 1: col-1 = Morning Brief + KPI Strip stacked, col-2 = Appointments */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="space-y-4">
          <MorningBriefingHero />
          <KpiStrip />
        </div>
        <AppointmentsCard />
      </section>

      {/* Row 2: Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PipelineFunnelChart />
        <LeadSourceChart />
        <WeeklyActivityChart />
      </section>

      {/* Row 3: Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TasksCard />
        <NewLeadsCard />
        <TransactionsCard />
      </section>

      <footer className="text-center text-[11px] text-neutral-400 pt-2 pb-6">
        Lofty AI assistant takes actions only after your approval.
      </footer>
    </div>
  );
}
