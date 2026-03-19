'use client';
import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error?.message || '' };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">{t('error.title')}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {this.props.fallbackMessage || t('error.message')}
            </p>
            <p className="text-xs text-gray-600 mb-4 font-mono break-all">{this.state.error}</p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> {t('error.retry')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
