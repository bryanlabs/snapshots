export const HeroStats = () => {
  const stats = [
    { number: "30+", label: "Chains Available" },
    { number: "Daily", label: "Updates" },
    { number: "99.9%", label: "Uptime" },
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
