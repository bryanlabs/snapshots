interface ChainIconProps {
  name: string;
}

export const ChainIcon = ({ name }: ChainIconProps) => (
  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/30 rounded-lg flex items-center justify-center">
    <span className="text-lg font-bold text-accent">
      {name.slice(0, 2).toUpperCase()}
    </span>
  </div>
);
