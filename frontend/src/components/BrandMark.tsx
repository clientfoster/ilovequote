interface BrandMarkProps {
  size?: 'xs' | 'sm' | 'md';
}

export default function BrandMark({ size = 'md' }: BrandMarkProps) {
  const logoSize = size === 'md' ? 'h-7 w-[132px]' : size === 'sm' ? 'h-5 w-[96px]' : 'h-4 w-[78px]';

  return <img src="/ilovequote-logo.png" alt="i love quote.com" className={`${logoSize} block object-cover object-center`} />;
}
