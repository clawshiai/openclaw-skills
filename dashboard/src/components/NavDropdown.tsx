'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  external?: boolean;
}

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  icon?: ReactNode;
}

export function NavDropdown({ label, items, icon }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any child item is active
  const isActive = items.some(item =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
          isActive
            ? 'text-foreground bg-surface-hover'
            : 'text-muted hover:text-foreground hover:bg-surface-hover'
        }`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-fadeUp">
          <div className="py-1">
            {items.map((item) => {
              const itemActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm transition-colors text-muted hover:text-foreground hover:bg-surface-hover"
                  >
                    {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    itemActive
                      ? 'text-teal-400 bg-teal-400/10'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile version - expandable section
interface MobileNavSectionProps {
  label: string;
  items: NavItem[];
  onNavigate?: () => void;
}

export function MobileNavSection({ label, items, onNavigate }: MobileNavSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-teal-400"
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-0.5 pl-2">
          {items.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onNavigate}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground bg-surface-hover'
                    : 'text-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
