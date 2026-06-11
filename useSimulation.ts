import { useEffect, useRef, useState } from "react";

export type ActivityEvent = {
  id: number;
  time: string;
  type: "waste" | "obstacle" | "route" | "complete" | "collect";
  text: string;
};

export type CellState = "pending" | "active" | "cleaned";

const EVENTS: Array<Omit<ActivityEvent, "id" | "time">> = [
  { type: "waste", text: "Plastic bottle detected at zone B4" },
  { type: "collect", text: "Collection mechanism engaged" },
  { type: "obstacle", text: "Floating log avoided successfully" },
  { type: "route", text: "Navigation route recalculated" },
  { type: "waste", text: "Plastic bag detected at zone D7" },
  { type: "complete", text: "Zone C3 cleaning completed" },
  { type: "collect", text: "Waste deposited to onboard bin" },
  { type: "obstacle", text: "Boat detected — slowing down" },
  { type: "route", text: "Heading to next pending zone" },
  { type: "waste", text: "Floating debris cluster found" },
];

const GRID = 10;

function makeGrid(): CellState[] {
  return Array.from({ length: GRID * GRID }, () => "pending");
}

export function useSimulation() {
  const [battery, setBattery] = useState(78);
  const [charging, setCharging] = useState(false);
  const [cleaning, setCleaning] = useState(34);
  const [areaCovered, setAreaCovered] = useState(1240);
  const [areaTotal] = useState(3600);
  const [speed, setSpeed] = useState(1.4);
  const [bottles, setBottles] = useState(128);
  const [bags, setBags] = useState(64);
  const [floating, setFloating] = useState(212);
  const [grid, setGrid] = useState<CellState[]>(makeGrid);
  const [obstacleDist, setObstacleDist] = useState(4.2);
  const [obstacleType, setObstacleType] = useState<"clear" | "log" | "boat">("clear");
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [now, setNow] = useState(new Date());
  const [history, setHistory] = useState({
    efficiency: [62, 65, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86],
    battery: [100, 96, 92, 88, 85, 82, 80, 78, 76, 74, 72, 70],
    waste: [12, 18, 22, 28, 35, 42, 48, 55, 60, 68, 74, 82],
    coverage: [4, 9, 15, 22, 30, 38, 46, 53, 60, 66, 72, 78],
  });
  const idRef = useRef(0);

  // initial grid seed: some cleaned cells
  useEffect(() => {
    setGrid((g) => {
      const ng = [...g];
      for (let i = 0; i < 28; i++) ng[Math.floor(Math.random() * ng.length)] = "cleaned";
      ng[Math.floor(Math.random() * ng.length)] = "active";
      return ng;
    });
  }, []);

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // main simulation tick
  useEffect(() => {
    const t = setInterval(() => {
      setBattery((b) => {
        if (charging) return Math.min(100, b + 0.6);
        const nb = b - 0.15;
        if (nb < 18) setCharging(true);
        return Math.max(0, nb);
      });
      if (charging && battery > 96) setCharging(false);

      setCleaning((c) => Math.min(100, c + Math.random() * 0.4));
      setAreaCovered((a) => Math.min(areaTotal, a + Math.random() * 6));
      setSpeed(() => +(1.0 + Math.random() * 1.2).toFixed(2));

      if (Math.random() > 0.6) setBottles((v) => v + 1);
      if (Math.random() > 0.75) setBags((v) => v + 1);
      if (Math.random() > 0.55) setFloating((v) => v + Math.floor(Math.random() * 2) + 1);

      setObstacleDist(+(1.5 + Math.random() * 8).toFixed(1));
      const r = Math.random();
      setObstacleType(r > 0.85 ? "log" : r > 0.7 ? "boat" : "clear");

      setGrid((g) => {
        const ng = [...g];
        // turn current active into cleaned
        const ai = ng.indexOf("active");
        if (ai >= 0) ng[ai] = "cleaned";
        // pick a new pending → active
        const pendings: number[] = [];
        for (let i = 0; i < ng.length; i++) if (ng[i] === "pending") pendings.push(i);
        if (pendings.length) ng[pendings[Math.floor(Math.random() * pendings.length)]] = "active";
        return ng;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [charging, battery, areaTotal]);

  // activity feed
  useEffect(() => {
    const t = setInterval(() => {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      idRef.current += 1;
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setActivity((a) => [{ id: idRef.current, time, ...ev }, ...a].slice(0, 12));
    }, 2600);
    return () => clearInterval(t);
  }, []);

  // chart history sliding window
  useEffect(() => {
    const t = setInterval(() => {
      setHistory((h) => ({
        efficiency: [...h.efficiency.slice(1), Math.min(100, h.efficiency.at(-1)! + (Math.random() * 4 - 1.5))],
        battery: [...h.battery.slice(1), Math.max(15, h.battery.at(-1)! + (charging ? 1 : -1.2))],
        waste: [...h.waste.slice(1), h.waste.at(-1)! + Math.random() * 4],
        coverage: [...h.coverage.slice(1), Math.min(100, h.coverage.at(-1)! + Math.random() * 2)],
      }));
    }, 2200);
    return () => clearInterval(t);
  }, [charging]);

  const totalWaste = bottles + bags + floating;
  const runtimeMin = Math.round((battery / 100) * 240);

  return {
    now,
    battery: +battery.toFixed(1),
    charging,
    runtimeMin,
    cleaning: +cleaning.toFixed(1),
    areaCovered: Math.round(areaCovered),
    areaTotal,
    speed,
    bottles,
    bags,
    floating,
    totalWaste,
    grid,
    obstacleDist,
    obstacleType,
    activity,
    history,
  };
}
