interface MiniColumnConnectorProps {
  side: 'left' | 'right';
}

export function MiniColumnConnector({ side }: MiniColumnConnectorProps) {
  const positionClass = side === 'left' ? '-left-2' : '-right-2';
  return <div className={`absolute top-1/2 ${positionClass} w-2 h-[1px] bg-border-focus z-10`} />;
}
