interface MiniIndicatorDotProps {
  color: string;
  title?: string;
}

export function MiniIndicatorDot({ color, title }: MiniIndicatorDotProps) {
  return <div className={`w-1.5 h-1.5 rounded-full ${color}`} title={title} />;
}
