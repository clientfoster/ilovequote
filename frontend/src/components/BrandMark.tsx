interface BrandMarkProps {
  size?: 'sm' | 'md';
}

export default function BrandMark({ size = 'md' }: BrandMarkProps) {
  const logoSize = size === 'md' ? 'h-7 w-[132px]' : 'h-5 w-[96px]';

  return <img src="/ilovequote-logo.png" alt="i love quote.com" className={`${logoSize} block object-cover object-center`} />;
}
