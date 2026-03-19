'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useT } from '@/lib/i18n';

interface DashboardChartProps {
  categoryCounts: Record<string, number>;
  sentimentCounts: Record<string, number>;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];
const SENTIMENT_COLORS: Record<string, string> = { positive: '#34d399', negative: '#f87171', neutral: '#fbbf24' };

export default function DashboardChart({ categoryCounts, sentimentCounts }: DashboardChartProps) {
  const t = useT();
  const categoryData = Object.entries(categoryCounts ?? {}).map(([name, value]: [string, number]) => ({ name, value }));
  const sentimentData = Object.entries(sentimentCounts ?? {}).map(([name, value]: [string, number]) => ({ name, value }));

  if ((categoryData?.length ?? 0) === 0 && (sentimentData?.length ?? 0) === 0) {
    return (
      <div className="p-8 rounded-xl glass text-center">
        <p className="text-gray-500 text-sm">{t('dashboard.noData')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-semibold mb-3">{t('dashboard.wishCategories')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={2}>
                {(categoryData ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS?.[i % (COLORS?.length ?? 8)] ?? '#60B5FF'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 11 }} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-semibold mb-3">{t('dashboard.sentimentDist')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {(sentimentData ?? []).map((entry: any, i: number) => (
                  <Cell key={i} fill={SENTIMENT_COLORS?.[entry?.name ?? ''] ?? '#60B5FF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
