import { GLOBAL_STATS } from "@/lib/data/chains";

export const HeroStats = () => {
  const stats = [
    { number: `${GLOBAL_STATS.totalChains}+`, label: "Chains Available" },
    { number: GLOBAL_STATS.updateFrequency, label: "Updates" },
    { number: GLOBAL_STATS.uptime, label: "Uptime" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="text-center group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        >
          <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 leading-none">
            {stat.number}
          </div>
          <div className="text-sm font-medium text-muted uppercase tracking-wider">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
