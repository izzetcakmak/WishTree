'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TreePine, UserPlus, Mail, Lock, User, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function SignupContent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        setError(data?.error ?? t('signup.failed'));
        return;
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError(t('signup.loginFailed'));
      } else {
        router.replace('/dashboard');
      }
    } catch {
      setError(t('signup.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <TreePine className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">WishTree</span>
          </Link>
          <p className="text-sm text-gray-400 mt-2">{t('signup.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t('signup.name')}
              value={name}
              onChange={(e: any) => setName(e?.target?.value ?? '')}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-transparent"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder={t('signup.email')}
              value={email}
              onChange={(e: any) => setEmail(e?.target?.value ?? '')}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-transparent"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              placeholder={t('signup.password')}
              value={password}
              onChange={(e: any) => setPassword(e?.target?.value ?? '')}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-transparent"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-accent to-emerald-500 text-white font-medium text-sm shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? t('signup.submitting') : t('signup.submit')}
          </motion.button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          {t('signup.hasAccount')}{' '}
          <Link href="/login" className="text-accent hover:underline inline-flex items-center gap-1">
            <LogIn className="w-3 h-3" /> {t('signup.signIn')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
