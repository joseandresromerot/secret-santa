const palette = [
  { badge: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
  { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  { badge: "bg-violet-100 text-violet-800", dot: "bg-violet-500" },
  { badge: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
  { badge: "bg-teal-100 text-teal-800", dot: "bg-teal-500" },
  { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  { badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
];

export function groupColor(index: number, kind: "badge" | "dot" = "badge") {
  return palette[index % palette.length][kind];
}
