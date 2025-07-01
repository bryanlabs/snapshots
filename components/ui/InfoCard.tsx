interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const InfoCard = ({
  title,
  children,
  className = "",
}: InfoCardProps) => (
  <div
    className={`bg-white rounded-xl border border-border p-6 mb-8 ${className}`}
  >
    <h3 className="text-xl font-bold text-foreground mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
}

export const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
    <span className="text-muted-foreground font-medium">{label}:</span>
    <span className="text-foreground">{value}</span>
  </div>
);
