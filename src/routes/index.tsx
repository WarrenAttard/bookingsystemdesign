import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { IncomeStrip } from "@/components/dashboard/IncomeStrip";
import { StatusColumn } from "@/components/dashboard/StatusColumn";
import type { Dog } from "@/components/dashboard/DogCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Board — Pawline Grooming Operations" },
      {
        name: "description",
        content:
          "Today's grooming board: dogs by status, assigned groomers, and stage progress at a glance.",
      },
      { property: "og:title", content: "Board — Pawline Grooming Operations" },
      {
        property: "og:description",
        content:
          "The shop-floor operations board for the day: check-ins, active grooms, and ready-for-pickup.",
      },
    ],
  }),
  component: Dashboard,
});

const booked: Dog[] = [
  { name: "Bear", breed: "Goldendoodle", owner: "Sarah M.", groomer: "Alex", groomerInitials: "AS", time: "09:00", flag: "allergy" },
  { name: "Luna", breed: "Husky", owner: "Kevin L.", groomer: "Maria", groomerInitials: "MR", time: "09:30" },
  { name: "Milo", breed: "Cavalier", owner: "Priya N.", groomer: "Alex", groomerInitials: "AS", time: "10:00" },
];
const pending: Dog[] = [
  { name: "Rocky", breed: "Bulldog", owner: "Tom G.", groomer: "Unassigned", groomerInitials: "?", time: "10:15", flag: "senior" },
];
const active: Dog[] = [
  { name: "Coco", breed: "Toy Poodle", owner: "Janet D.", groomer: "Alex", groomerInitials: "AS", time: "started 10:15", stage: "Scrubbing", progress: 75, flag: "nervous", active: true },
  { name: "Oliver", breed: "Beagle", owner: "Sam R.", groomer: "Maria", groomerInitials: "MR", time: "started 08:15", stage: "Clipping", progress: 40, active: true },
];
const ready: Dog[] = [
  { name: "Daisy", breed: "Maltipoo", owner: "Lena V.", groomer: "Jonas", groomerInitials: "JT", time: "ready 10:42" },
  { name: "Pepper", breed: "Schnauzer", owner: "Marco B.", groomer: "Maria", groomerInitials: "MR", time: "ready 10:55" },
];
const completed: Dog[] = [
  { name: "Nala", breed: "Cocker Spaniel", owner: "Yara S.", groomer: "Alex", groomerInitials: "AS", time: "picked 09:40" },
];
const cancelled: Dog[] = [
  { name: "Toby", breed: "Labrador", owner: "Ben F.", groomer: "—", groomerInitials: "—", time: "no-show 08:30" },
];

function Dashboard() {
  return (
    <AppShell title="Today" subtitle="October 24">
      <IncomeStrip />
      <div className="flex-1 overflow-x-auto px-10 pb-10">
        <div className="flex gap-6 h-full min-w-max">
          <StatusColumn title="Booked" tone="booked" dogs={booked} delay={40} />
          <StatusColumn title="Pending" tone="pending" dogs={pending} delay={100} />
          <StatusColumn title="Active" tone="active" dogs={active} delay={160} emptyLabel="No dogs in stations" />
          <StatusColumn title="Ready for pickup" tone="ready" dogs={ready} delay={220} />
          <StatusColumn title="Completed" tone="completed" dogs={completed} delay={280} />
          <StatusColumn title="Cancelled / No-show" tone="cancelled" dogs={cancelled} delay={340} emptyLabel="Nothing cancelled" />
        </div>
      </div>
    </AppShell>
  );
}
