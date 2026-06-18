import React from 'react';
import * as Icons from 'lucide-react';

interface QuoteIconProps extends React.ComponentProps<'svg'> {
  name: string;
  className?: string;
  size?: number;
}

export default function QuoteIcon({ name, className = '', size = 20, ...props }: QuoteIconProps) {
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    return <Icons.Package className={className} size={size} {...props} />;
  }

  return <IconComponent className={className} size={size} {...props} />;
}
