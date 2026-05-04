import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fullName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || null;
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url
    || user?.user_metadata?.picture
    || null;

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 1).toUpperCase();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="h-7 w-7 rounded-full border border-border-subtle text-[12px] font-[var(--fw-medium)] flex items-center justify-center transition-colors overflow-hidden hover:border-border-hover"
        title={fullName || email}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="bg-surface-frost-10 h-full w-full flex items-center justify-center text-text-primary">
            {initials}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-border-default rounded-panel shadow-modal z-50 overflow-hidden">
          <div className="p-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="bg-surface-frost-10 h-full w-full flex items-center justify-center text-[11px] font-[var(--fw-medium)] text-text-primary">
                    {initials}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                {fullName && (
                  <p className="text-[13px] font-[var(--fw-medium)] text-text-primary truncate">{fullName}</p>
                )}
                <p className="text-[12px] text-text-tertiary truncate">{email}</p>
              </div>
            </div>
          </div>
          <div className="p-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-regular)] text-text-secondary hover:bg-surface-frost-05 hover:text-text-primary transition-colors"
            >
              <LogOut size={14} className="text-text-tertiary" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
