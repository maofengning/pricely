import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '首页' },
  { path: '/trade', label: '模拟交易' },
  { path: '/log', label: '交易日志' },
  { path: '/report', label: '交易报表' },
  { path: '/profile', label: '个人中心' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-48 bg-bg-secondary border-r border-border min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded transition-colors ${
                  location.pathname === item.path
                    ? 'bg-text-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}