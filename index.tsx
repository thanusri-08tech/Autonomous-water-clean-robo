import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Battery, BatteryCharging, Bot, ChevronUp, Cpu, Droplets, Gauge, Globe,
  Leaf, MapPin, Moon, Navigation, Radar, Recycle, Satellite, Ship, Sparkles, Sun,
  TreePine, TriangleAlert, Trash2, Users, Waves, Wifi, Zap,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useSimulation, type CellState } from "@/hooks/useSimulation";
import { useTheme } from "@/hooks/useTheme";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaBot — Autonomous Water Surface Cleaning Robot Dashboard" },
      { name: "description", content: "Software simulation dashboard for an autonomous water surface cleaning robot — live status, waste collection, coverage map, and analytics." },
      { property: "og:title", content: "AquaBot — Water Surface Cleaning Robot Simulation" },
      { property: "og:description", content: "Real-time monitoring & control simulation of an autonomous water-cleaning robot." },
    ],
  }),
  component: Dashboard,
});

/* ------------------------------ helpers ------------------------------ */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useCountUp(value: number, duration = 800) {
  const [v, setV] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return v;
}

/* ------------------------------ loading ------------------------------ */

function LoadingScreen({ done }: { done: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center transition-opacity duration-700 ${done ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ background: "var(--gradient-ocean)" }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground glow">
            <Droplets className="h-10 w-10" />
          </div>
        </div>
        <div className="text-lg font-semibold tracking-wide text-foreground">Initializing AquaBot Systems…</div>
        <div className="h-1 w-56 overflow-hidden rounded-full bg-secondary">
          <div className="shimmer-bar h-full w-full" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ header ------------------------------ */

function Header({ now, status }: { now: Date; status: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dateStr = mounted ? now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";
  const timeStr = mounted ? now.toLocaleTimeString() : "";
  return (
    <header className="sticky top-0 z-40 glass !rounded-none border-b">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow">
            <Waves className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold tracking-tight sm:text-lg">AquaBot Control Center</div>
            <div className="truncate text-xs text-muted-foreground">Autonomous Water Surface Cleaning Robot · Simulation</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-xs md:flex">
            <span className="relative grid h-2 w-2 place-items-center text-mint">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            <span className="font-medium">{status}</span>
          </div>
          <div className="hidden text-right text-xs leading-tight sm:block">
            <div className="font-mono text-cyan-ac">{timeStr}</div>
            <div className="text-muted-foreground">{dateStr}</div>
          </div>
          <button
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-lg border border-glass-border bg-glass transition hover:glow"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ sub-nav ------------------------------ */

const SECTIONS: Array<[string, string]> = [
  ["status", "Status"], ["battery", "Battery"], ["cleaning", "Cleaning"],
  ["waste", "Waste"], ["coverage", "Coverage"], ["obstacles", "Obstacles"],
  ["health", "Health"], ["activity", "Activity"], ["impact", "Impact"],
  ["simulation", "Simulation"], ["analytics", "Analytics"], ["architecture", "Architecture"],
  ["about", "About"], ["future", "Future"], ["team", "Team"],
];

function SubNav() {
  return (
    <nav className="sticky top-[68px] z-30 border-b border-glass-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <ul className="flex min-w-max gap-1 py-2 text-xs">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-glass hover:text-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* ------------------------------ generic ------------------------------ */

function Section({ id, title, icon: Icon, children, intro }: { id: string; title: string; icon: any; children: React.ReactNode; intro?: string }) {
  return (
    <section id={id} className="reveal scroll-mt-32 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Icon className="h-3.5 w-3.5" /> {title}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            {intro && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass p-5 ${className}`}>{children}</div>;
}

function Stat({ label, value, sub, icon: Icon, accent = "primary" }: { label: string; value: React.ReactNode; sub?: string; icon: any; accent?: "primary" | "mint" | "warning" | "danger" }) {
  const accentMap: Record<string, string> = {
    primary: "from-primary/30 to-accent/20 text-primary",
    mint: "from-mint/30 to-aqua/20 text-mint",
    warning: "from-warning/30 to-warning/10 text-warning",
    danger: "from-danger/30 to-danger/10 text-danger",
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ sections ------------------------------ */

function RobotStatus({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <div className="flex items-center gap-3">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow">
            <Bot className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-mint" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Robot Status</div>
            <div className="text-xl font-bold text-mint">ACTIVE</div>
            <div className="text-xs text-muted-foreground">Mode: Autonomous · Mission #A-2271</div>
          </div>
        </div>
      </Card>
      <Stat label="Current Speed" value={`${sim.speed} m/s`} sub="Cruising" icon={Gauge} />
      <Stat label="Location" value="12.97°N, 77.59°E" sub="Lake Sector 4" icon={MapPin} accent="mint" />
      <Stat label="Navigation" value="On Course" sub="Heading 045°" icon={Navigation} />
    </div>
  );
}

function CircularBattery({ value, charging }: { value: number; charging: boolean }) {
  const display = useCountUp(value);
  const R = 56, C = 2 * Math.PI * R;
  const off = C - (display / 100) * C;
  const color = value < 20 ? "var(--danger)" : value < 40 ? "var(--warning)" : "var(--mint)";
  return (
    <div className="relative grid place-items-center">
      <svg width="160" height="160" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} stroke="var(--muted)" strokeWidth="10" fill="none" opacity="0.4" />
        <circle
          cx="70" cy="70" r={R}
          stroke={color} strokeWidth="10" strokeLinecap="round" fill="none"
          strokeDasharray={C} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.6s ease", filter: "drop-shadow(0 0 8px currentColor)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold tabular-nums">{display.toFixed(0)}%</div>
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          {charging ? <BatteryCharging className="h-3.5 w-3.5 text-mint" /> : <Battery className="h-3.5 w-3.5" />}
          {charging ? "Charging" : "Discharging"}
        </div>
      </div>
    </div>
  );
}

function BatterySection({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex flex-col items-center gap-3">
          <CircularBattery value={sim.battery} charging={sim.charging} />
          <div className="text-center">
            <div className="text-sm font-semibold">Battery Pack · Li-Ion 48V</div>
            <div className="text-xs text-muted-foreground">Cell health 96% · Temp 34°C</div>
          </div>
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="mt-1 text-lg font-bold">{sim.charging ? "Solar-assist charging" : "Operating on battery"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Power draw 142 W · Voltage 47.8 V</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Remaining runtime</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{Math.floor(sim.runtimeMin / 60)}h {sim.runtimeMin % 60}m</div>
            <div className="mt-1 text-xs text-muted-foreground">At current load</div>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Charge level</span>
              <span className="tabular-nums text-primary">{sim.battery.toFixed(1)}%</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint via-aqua to-cyan-ac transition-[width] duration-700"
                style={{ width: `${sim.battery}%` }}
              />
              <div className="shimmer-bar absolute inset-0" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CleaningProgress({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const remaining = sim.areaTotal - sim.areaCovered;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Cleaning Progress</div>
            <div className="text-3xl font-bold tabular-nums">{sim.cleaning.toFixed(1)}%</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>ETA: {Math.max(1, Math.round((100 - sim.cleaning) * 0.6))} min</div>
            <div>Efficiency: 92%</div>
          </div>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-ac via-aqua to-mint transition-[width] duration-700"
            style={{ width: `${sim.cleaning}%` }}
          />
          <div className="shimmer-bar absolute inset-0" />
        </div>
      </Card>
      <Stat label="Area Covered" value={`${sim.areaCovered.toLocaleString()} m²`} sub={`of ${sim.areaTotal.toLocaleString()} m²`} icon={Globe} accent="mint" />
      <Stat label="Remaining" value={`${remaining.toLocaleString()} m²`} sub="Estimated zones left" icon={Radar} />
      <Stat label="Path Length" value={`${(sim.areaCovered * 0.012).toFixed(1)} km`} sub="Total distance" icon={Navigation} />
    </div>
  );
}

function WasteSection({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const bottles = useCountUp(sim.bottles);
  const bags = useCountUp(sim.bags);
  const floating = useCountUp(sim.floating);
  const total = useCountUp(sim.totalWaste);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Plastic Bottles" value={Math.round(bottles)} sub="Collected today" icon={Recycle} />
      <Stat label="Plastic Bags" value={Math.round(bags)} sub="Collected today" icon={Trash2} accent="warning" />
      <Stat label="Floating Waste" value={Math.round(floating)} sub="Mixed debris" icon={Waves} accent="mint" />
      <Stat label="Total Waste" value={Math.round(total)} sub="Pieces removed" icon={Sparkles} />
    </div>
  );
}

function CoverageMap({ grid }: { grid: CellState[] }) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Water Coverage Grid</div>
          <div className="text-sm">10×10 zones · live update</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-mint" /> Cleaned</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary animate-pulse" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-secondary" /> Pending</span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {grid.map((c, i) => (
          <div
            key={i}
            className={`group relative aspect-square rounded-md transition-all duration-300 hover:scale-110 hover:z-10 ${
              c === "cleaned" ? "bg-mint/70 shadow-[0_0_8px_var(--mint)]" :
              c === "active"  ? "bg-primary glow" :
              "bg-secondary/70"
            }`}
            title={`Zone ${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`}
          >
            {c === "active" && (
              <span className="absolute inset-0 rounded-md ring-2 ring-primary" style={{ animation: "ripple 1.4s ease-out infinite" }} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ObstaclePanel({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const clear = sim.obstacleType === "clear";
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className={`lg:col-span-2 ${!clear ? "ring-2 ring-warning glow" : ""}`}>
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${clear ? "bg-mint/20 text-mint" : "bg-warning/20 text-warning animate-pulse"}`}>
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Detection</div>
            <div className="text-lg font-bold">
              {clear ? "Path Clear" : sim.obstacleType === "log" ? "Floating Log Detected" : "Boat Detected"}
            </div>
            <div className="text-xs text-muted-foreground">Ultrasonic + camera fusion</div>
          </div>
        </div>
      </Card>
      <Stat label="Distance" value={`${sim.obstacleDist} m`} sub="Closest object" icon={Radar} accent={sim.obstacleDist < 3 ? "danger" : "primary"} />
      <Stat label="Avoidance" value={clear ? "Idle" : "Active"} sub={clear ? "No action needed" : "Rerouting"} icon={Navigation} accent={clear ? "mint" : "warning"} />
      <Card className="lg:col-span-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: TreePine, label: "Floating Log", state: sim.obstacleType === "log" },
            { icon: Ship,     label: "Boat",         state: sim.obstacleType === "boat" },
            { icon: Waves,    label: "Debris Field", state: sim.obstacleType !== "clear" },
          ].map((a) => (
            <div key={a.label} className={`flex items-center gap-3 rounded-xl border p-3 transition ${a.state ? "border-warning/60 bg-warning/10" : "border-glass-border bg-secondary/40"}`}>
              <a.icon className={`h-5 w-5 ${a.state ? "text-warning animate-pulse" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.state ? "Detected — avoiding" : "Not detected"}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HealthPanel() {
  const items = [
    { icon: Radar,      label: "Ultrasonic Sensor",     ok: true },
    { icon: Navigation, label: "Navigation System",     ok: true },
    { icon: Recycle,    label: "Collection Mechanism",  ok: true },
    { icon: Activity,   label: "Monitoring System",     ok: true },
    { icon: Wifi,       label: "Telemetry Link",        ok: true },
    { icon: Cpu,        label: "Onboard Compute",       ok: true },
    { icon: Battery,    label: "Power Management",      ok: true },
    { icon: Satellite,  label: "GPS Module",            ok: false },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className="!p-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary/60 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.ok ? "Operational" : "Degraded"}</div>
              </div>
            </div>
            <span className={`relative grid h-2.5 w-2.5 place-items-center ${it.ok ? "text-mint" : "text-danger"}`}>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "currentColor" }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "currentColor" }} />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ActivityFeed({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const iconFor = (t: string) =>
    t === "waste" ? Recycle : t === "obstacle" ? TriangleAlert : t === "route" ? Navigation : t === "complete" ? Sparkles : Trash2;
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Live Activity Feed</div>
        <span className="flex items-center gap-1.5 text-xs text-mint">
          <span className="h-2 w-2 animate-pulse rounded-full bg-mint" /> Streaming
        </span>
      </div>
      <ul className="space-y-2">
        {sim.activity.length === 0 && <li className="text-sm text-muted-foreground">Awaiting events…</li>}
        {sim.activity.map((e) => {
          const Icon = iconFor(e.type);
          return (
            <li key={e.id} className="animate-slide-in-left flex items-start gap-3 rounded-lg border border-glass-border bg-secondary/30 p-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{e.text}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{e.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ImpactStats({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const kg = useCountUp(+(sim.totalWaste * 0.08).toFixed(1));
  const area = useCountUp(sim.areaCovered);
  const pollution = useCountUp(Math.min(99, +(sim.cleaning * 0.95).toFixed(1)));
  const score = useCountUp(Math.min(99, 60 + sim.cleaning * 0.35));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Waste Removed Today" value={`${kg.toFixed(1)} kg`} sub="Equivalent mass" icon={Trash2} accent="mint" />
      <Stat label="Area Cleaned" value={`${Math.round(area).toLocaleString()} m²`} sub="Surface processed" icon={Droplets} />
      <Stat label="Pollution Reduction" value={`${pollution.toFixed(1)}%`} sub="Vs. baseline" icon={Leaf} accent="mint" />
      <Stat label="Impact Score" value={score.toFixed(0)} sub="Out of 100" icon={Sparkles} accent="warning" />
    </div>
  );
}

/* ------------------------------ simulation canvas ------------------------------ */

function SimulationCanvas() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 60);
    return () => clearInterval(i);
  }, []);
  // Robot follows a horizontal sine path
  const x = (t * 1.2) % 720;
  const y = 160 + Math.sin(t * 0.08) * 30;
  const waste = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ id: i, x: (i * 130 + (t * 0.6) % 720) % 720, y: 90 + (i * 23) % 140, k: i % 3 })),
    [t],
  );
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="relative h-[320px] w-full">
        {/* sky gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.3 0.08 230) 0%, oklch(0.18 0.06 240) 100%)" }} />
        {/* moving wave layers */}
        <svg className="absolute inset-x-0 bottom-0 w-[200%] animate-wave" viewBox="0 0 1440 200" preserveAspectRatio="none" height="200">
          <path d="M0 100 Q 180 60 360 100 T 720 100 T 1080 100 T 1440 100 V200 H0 Z" fill="oklch(0.35 0.12 210 / 0.6)" />
        </svg>
        <svg className="absolute inset-x-0 bottom-0 w-[200%] animate-wave" style={{ animationDuration: "18s" }} viewBox="0 0 1440 200" preserveAspectRatio="none" height="160">
          <path d="M0 120 Q 180 90 360 120 T 720 120 T 1080 120 T 1440 120 V200 H0 Z" fill="oklch(0.45 0.16 195 / 0.55)" />
        </svg>
        {/* floating waste */}
        {waste.map((w) => (
          <div key={w.id} className="absolute animate-float-y" style={{ left: w.x, top: w.y, animationDelay: `${w.id * 0.3}s` }}>
            {w.k === 0 ? <Recycle className="h-5 w-5 text-warning drop-shadow" /> :
             w.k === 1 ? <Trash2 className="h-5 w-5 text-cyan-ac drop-shadow" /> :
                         <Waves className="h-5 w-5 text-aqua drop-shadow" />}
          </div>
        ))}
        {/* robot */}
        <div className="absolute transition-[left,top] duration-100 ease-linear" style={{ left: x, top: y }}>
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-primary/30 blur-md" />
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow">
              <Bot className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-cyan-ac/60 blur-sm" />
          </div>
        </div>
        {/* path */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 720 320" preserveAspectRatio="none">
          <path d="M0 160 Q 120 110 240 160 T 480 160 T 720 160" fill="none" stroke="oklch(0.78 0.16 200 / 0.4)" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
        {/* HUD */}
        <div className="absolute left-3 top-3 rounded-md border border-glass-border bg-background/50 px-2 py-1 font-mono text-[10px] backdrop-blur">
          SIM · 60Hz · auto-pilot
        </div>
        <div className="absolute right-3 top-3 rounded-md border border-glass-border bg-background/50 px-2 py-1 font-mono text-[10px] backdrop-blur">
          Heading 045° · Depth 1.2m
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ analytics ------------------------------ */

const tickColor = "rgba(180, 220, 240, 0.5)";
const gridColor = "rgba(120, 180, 220, 0.12)";
const baseOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: tickColor, font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
    y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
  },
} as const;

function Analytics({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const labels = sim.history.efficiency.map((_, i) => `T-${11 - i}`);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Cleaning Efficiency</div>
          <span className="text-xs text-muted-foreground">% over last 12 ticks</span>
        </div>
        <div className="h-56">
          <Line
            data={{ labels, datasets: [{
              label: "Efficiency", data: sim.history.efficiency,
              borderColor: "oklch(0.78 0.16 200)", backgroundColor: "oklch(0.78 0.16 200 / 0.25)",
              fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
            }] }}
            options={baseOpts as any}
          />
        </div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Battery Usage</div>
          <span className="text-xs text-muted-foreground">% capacity</span>
        </div>
        <div className="h-56">
          <Line
            data={{ labels, datasets: [{
              label: "Battery", data: sim.history.battery,
              borderColor: "oklch(0.82 0.18 160)", backgroundColor: "oklch(0.82 0.18 160 / 0.25)",
              fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
            }] }}
            options={baseOpts as any}
          />
        </div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Waste Collection Trend</div>
          <span className="text-xs text-muted-foreground">Pieces / tick</span>
        </div>
        <div className="h-56">
          <Bar
            data={{ labels, datasets: [{
              label: "Waste", data: sim.history.waste,
              backgroundColor: "oklch(0.7 0.18 220 / 0.7)", borderRadius: 6,
            }] }}
            options={baseOpts as any}
          />
        </div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Area Coverage Trend</div>
          <span className="text-xs text-muted-foreground">% complete</span>
        </div>
        <div className="h-56">
          <Line
            data={{ labels, datasets: [{
              label: "Coverage", data: sim.history.coverage,
              borderColor: "oklch(0.82 0.17 75)", backgroundColor: "oklch(0.82 0.17 75 / 0.25)",
              fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
            }] }}
            options={baseOpts as any}
          />
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ architecture ------------------------------ */

function Architecture() {
  const nodes = [
    { icon: Radar,      title: "Sensors",            desc: "Ultrasonic · IR · Camera array" },
    { icon: Cpu,        title: "Control System",     desc: "Onboard MCU running real-time loop" },
    { icon: Navigation, title: "Navigation Module",  desc: "Path planning & obstacle avoidance" },
    { icon: Recycle,    title: "Cleaning Mechanism", desc: "Conveyor + mesh skimmer" },
    { icon: Trash2,     title: "Waste Collection",   desc: "Onboard bin with weight sensor" },
    { icon: Activity,   title: "Monitoring Dashboard", desc: "This software simulation interface" },
  ];
  return (
    <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((n, i) => (
        <Card key={n.title} className="relative">
          <div className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground glow">{i + 1}</div>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-primary">
              <n.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold">{n.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{n.desc}</div>
              {i < nodes.length - 1 && (
                <div className="mt-2 hidden text-xs text-primary lg:block">↓ feeds into next stage</div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------ about ------------------------------ */

function About() {
  const cards = [
    { title: "Project Overview", body: "AquaBot is an autonomous surface vessel designed to detect, navigate around, and collect floating debris from lakes, ponds, and harbors — operated and monitored entirely from this dashboard." },
    { title: "Problem Statement", body: "Floating plastic waste in inland water bodies threatens biodiversity, blocks waterways, and contaminates drinking-water sources. Manual cleanup is slow, expensive, and unsafe." },
    { title: "Need for Surface Cleaning", body: "Surface debris is the precursor to deeper contamination. Removing it early prevents microplastic breakdown and reduces downstream treatment costs by an estimated 40%." },
    { title: "Environmental Benefits", body: "Restores aquatic habitats, reduces methane from decomposing waste, supports cleaner urban water bodies, and demonstrates a scalable, low-emission cleanup pattern." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.title}>
          <div className="text-xs uppercase tracking-wider text-primary">{c.title}</div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.body}</p>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------ future + team ------------------------------ */

function Future() {
  const items = [
    { icon: Sparkles,   title: "AI Waste Detection",        body: "On-device CNN to classify debris types in real-time." },
    { icon: Satellite,  title: "GPS Navigation",            body: "Centimeter-precision RTK-GPS for repeatable patrol routes." },
    { icon: Sun,        title: "Solar Power Integration",   body: "Top-mounted PV array for 24/7 autonomous operation." },
    { icon: Activity,   title: "Mobile Monitoring App",     body: "iOS/Android companion app with push alerts." },
    { icon: Zap,        title: "Real-Time Analytics",       body: "Cloud telemetry with predictive maintenance." },
    { icon: Bot,        title: "Multi-Robot Coordination",  body: "Fleet of robots sharing a coverage map." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <Card key={i.title} className="group transition hover:-translate-y-1 hover:glow">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-primary transition group-hover:scale-110">
            <i.icon className="h-5 w-5" />
          </div>
          <div className="text-base font-bold">{i.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{i.body}</div>
        </Card>
      ))}
    </div>
  );
}

function Team() {
  const members = [
    { name: "Member One", role: "Hardware & Sensors" },
    { name: "Member Two", role: "Navigation Algorithm" },
    { name: "Member Three", role: "Frontend & Simulation" },
    { name: "Member Four", role: "Mechanical Design" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <div className="mb-4 text-xs uppercase tracking-wider text-primary">Team Members</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl border border-glass-border bg-secondary/40 p-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                {m.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="mb-3 text-xs uppercase tracking-wider text-primary">Guidance</div>
        <div className="space-y-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Project Guide</div><div className="font-semibold">Prof. Guide Name</div></div>
          <div><div className="text-xs text-muted-foreground">Department</div><div className="font-semibold">Electronics & Communication Engineering</div></div>
          <div><div className="text-xs text-muted-foreground">College</div><div className="font-semibold">Your College of Engineering</div></div>
          <div><div className="text-xs text-muted-foreground">Academic Year</div><div className="font-semibold">2025 – 2026</div></div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ footer + FAB ------------------------------ */

function Footer() {
  return (
    <footer className="mt-12 border-t border-glass-border bg-ocean-deep/60 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground"><Waves className="h-5 w-5" /></div>
            <div className="font-bold">AquaBot Dashboard</div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">A software simulation of an autonomous water surface cleaning robot, built as an academic engineering project.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-primary">Quick Links</div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {["status", "analytics", "architecture", "about", "team"].map((s) => (
              <li key={s}><a href={`#${s}`} className="text-muted-foreground transition hover:text-primary">{s.charAt(0).toUpperCase() + s.slice(1)}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-primary">Technologies</div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>HTML5 · CSS3 · JavaScript</li>
            <li>React + TanStack Start</li>
            <li>Tailwind CSS</li>
            <li>Chart.js</li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-primary">About</div>
          <p className="mt-3 text-xs text-muted-foreground">This dashboard does not connect to real hardware. All telemetry is simulated client-side for demonstration purposes.</p>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-glass-border px-4 pt-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} AquaBot Project · All rights reserved.
      </div>
    </footer>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground glow transition hover:scale-110"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

/* ------------------------------ root ------------------------------ */

function Dashboard() {
  const sim = useSimulation();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1100);
    document.documentElement.classList.add("dark");
    document.documentElement.style.scrollBehavior = "smooth";
    return () => clearTimeout(t);
  }, []);
  useScrollReveal();

  return (
    <div className="min-h-screen">
      <LoadingScreen done={loaded} />
      <Header now={sim.now} status="All Systems Nominal" />
      <SubNav />

      <Section id="status" title="Robot Status" icon={Bot} intro="Live snapshot of the AquaBot mission, mode, and position.">
        <RobotStatus sim={sim} />
      </Section>
      <Section id="battery" title="Battery Monitoring" icon={Battery} intro="Power, charge state, and remaining runtime.">
        <BatterySection sim={sim} />
      </Section>
      <Section id="cleaning" title="Cleaning Progress" icon={Droplets} intro="Total surface area processed by the current mission.">
        <CleaningProgress sim={sim} />
      </Section>
      <Section id="waste" title="Waste Collection Monitor" icon={Recycle} intro="Items captured and stored in the onboard bin.">
        <WasteSection sim={sim} />
      </Section>
      <Section id="coverage" title="Water Coverage Map" icon={Globe} intro="Per-zone cleaning state across the patrol grid.">
        <CoverageMap grid={sim.grid} />
      </Section>
      <Section id="obstacles" title="Obstacle Detection" icon={TriangleAlert} intro="Real-time alerts from the sensor fusion stack.">
        <ObstaclePanel sim={sim} />
      </Section>
      <Section id="health" title="System Health" icon={Activity} intro="Subsystem diagnostics with live status indicators.">
        <HealthPanel />
      </Section>
      <Section id="activity" title="Live Activity Feed" icon={Activity} intro="Streaming event log from the onboard control loop.">
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityFeed sim={sim} />
          <Card>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Mission Telemetry</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Uptime</div><div className="font-mono">02:14:36</div></div>
              <div><div className="text-xs text-muted-foreground">Packets</div><div className="font-mono">128,420</div></div>
              <div><div className="text-xs text-muted-foreground">Latency</div><div className="font-mono">24 ms</div></div>
              <div><div className="text-xs text-muted-foreground">Signal</div><div className="font-mono">-58 dBm</div></div>
              <div><div className="text-xs text-muted-foreground">Heading</div><div className="font-mono">045°</div></div>
              <div><div className="text-xs text-muted-foreground">Depth</div><div className="font-mono">1.2 m</div></div>
            </div>
          </Card>
        </div>
      </Section>
      <Section id="impact" title="Environmental Impact" icon={Leaf} intro="Aggregate benefit delivered by this mission.">
        <ImpactStats sim={sim} />
      </Section>
      <Section id="simulation" title="Robot Simulation" icon={Waves} intro="Animated visualization of the AquaBot navigating and collecting debris.">
        <SimulationCanvas />
      </Section>
      <Section id="analytics" title="Performance Analytics" icon={Activity} intro="Trend charts powered by the live simulation engine.">
        <Analytics sim={sim} />
      </Section>
      <Section id="architecture" title="Project Architecture" icon={Cpu} intro="End-to-end signal flow from sensors to dashboard.">
        <Architecture />
      </Section>
      <Section id="about" title="About the Project" icon={Sparkles} intro="Background, motivation, and impact of the AquaBot system.">
        <About />
      </Section>
      <Section id="future" title="Future Enhancements" icon={Zap} intro="Planned upgrades to evolve AquaBot into a production platform.">
        <Future />
      </Section>
      <Section id="team" title="Project Team" icon={Users} intro="The people behind the project.">
        <Team />
      </Section>

      <Footer />
      <BackToTop />
    </div>
  );
}
