'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { TreePine, Sun, Moon, LogOut, LogIn, Wallet, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession() || {};
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass"
    >
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <TreePine className="w-7 h-7 text-accent group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
            WishTree
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-3">
          <Link href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent/10 transition-colors">
            Home
          </Link>
          <Link href="/wishes" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent/10 transition-colors">
            All Wishes
          </Link>
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent/10 transition-colors">
            Dashboard
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {session?.user ? (
            <button
              onClick={() => signOut?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </nav>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden glass border-t border-white/5 px-4 py-3 space-y-2"
        >
          <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-accent/10">Home</Link>
          <Link href="/wishes" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-accent/10">All Wishes</Link>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-accent/10">Dashboard</Link>
          <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMobileOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent/10">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Toggle Theme
          </button>
          {session?.user ? (
            <button onClick={() => { signOut?.(); setMobileOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-accent hover:bg-accent/10">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}
