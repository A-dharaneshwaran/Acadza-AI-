import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ShieldCheck, 
  BookOpen 
} from 'lucide-react';

export default function TopNavbar({ setMobileOpen }) {
  return (
    <header className="h-16 border-b border-[#2b312e] bg-[#141816]/90 backdrop-blur-xs flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-[#969e99] hover:text-[#f4f3ee] hover:bg-[#1a1f1c] md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-48 sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#626965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search question ID, report, or formula..."
            className="w-full bg-[#101312] border border-[#2b312e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f4f3ee] placeholder-[#626965] focus:outline-none focus:border-[#4d7c5f] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Environment Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#528a6c] animate-pulse" />
          <span className="text-[11px] font-mono text-[#8ba895]">Atlas Cluster Active</span>
        </div>

        {/* Notifications */}
        <button 
          title="Audit Notifications"
          className="relative p-2 rounded-lg bg-[#181d1a] border border-[#2b312e] text-[#969e99] hover:text-[#f4f3ee] hover:bg-[#202723] transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6ba883]" />
        </button>

        {/* Faculty Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#2b312e]">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#1c2420] text-[#8fd1a8] border border-[#2e4437]">
            Faculty Console
          </span>
        </div>
      </div>
    </header>
  );
}

