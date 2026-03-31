interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title = "Pricely", children }: HeaderProps) {
  return (
    <header className="border-b border-border bg-bg-secondary">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          <span className="text-text-secondary text-sm">
            基于价格行为学的裸K分析平台
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {children}
        </nav>
      </div>
    </header>
  );
}