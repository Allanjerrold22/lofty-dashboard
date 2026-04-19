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

      <MorningBriefingHero />

      <KpiStrip />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PipelineFunnelChart />
        <LeadSourceChart />
        <WeeklyActivityChart />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <TasksCard />
        <AppointmentsCard />
        <NewLeadsCard />
        <TransactionsCard />
      </section>

      <footer className="text-center text-[11px] text-neutral-400 pt-2 pb-6">
        Lofty AI assistant takes actions only after your approval.
      </footer>
    </div>
  );
}
