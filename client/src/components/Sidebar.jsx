import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Investigation Queue', path: '/queue', icon: Inbox },
  { name: 'Questions', path: '/questions', icon: BookOpen },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between bg-[#151917] border-r border-[#2b312e] transition-all duration-200 ease-in-out select-none
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-18' : 'md:w-64'}
        `}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#2b312e]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#24332a] border border-[#3e5647] flex items-center justify-center font-bold text-sm text-[#8fd1a8] shrink-0">
                A
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="min-w-0">
                  <div className="font-medium text-sm tracking-tight text-[#f4f3ee] truncate">ACADZA</div>
                  <div className="text-[10px] text-[#78827c] font-mono tracking-tight truncate">Report → Fix QA</div>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded text-[#969e99] hover:text-[#f4f3ee] md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-2.5 py-4 space-y-1">
            {(!collapsed || mobileOpen) && (
              <div className="px-2.5 pb-2 text-[10px] font-semibold tracking-wider uppercase text-[#626965]">
                Platform
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : ''}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1e2722] text-[#8fd1a8] border border-[#2e4437]'
                        : 'text-[#969e99] hover:text-[#f4f3ee] hover:bg-[#1b201d]'
                    } ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#7a9e8b]" />
                  {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Collapse Toggle & User Profile */}
        <div className="border-t border-[#2b312e] p-3 space-y-3 bg-[#131615]">
          {/* User Profile Area */}
          <div className="flex items-center gap-2.5 overflow-hidden px-1">
            <div className="w-7 h-7 rounded-full bg-[#27322c] border border-[#37453d] flex items-center justify-center text-xs font-medium text-[#b5cbbf] shrink-0">
              FA
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#f4f3ee] truncate">Faculty Reviewer</div>
                <div className="text-[10px] text-[#626965] font-mono truncate">acadzaaiintern@gmail.com</div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center p-1.5 rounded-lg bg-[#181d1a] hover:bg-[#202723] text-[#78827c] hover:text-[#f4f3ee] border border-[#2b312e] text-xs transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}

