'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function DashboardPage() {
  const [orderPeriod, setOrderPeriod] = useState('thisMonth');
  const [orderStats, setOrderStats] = useState({ count: 0, revenue: 0, orders: [] });
  const [contentStats, setContentStats] = useState({ portfolio: 0, testimonials: 0, bankAccounts: 0 });
  const [visitorStats, setVisitorStats] = useState({
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    lastMonth: 0,
    lastYear: 0,
    byCountry: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, [orderPeriod]);

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrderStats(),
      fetchContentStats(),
      fetchVisitorStats()
    ]);
    setLoading(false);
  };

  const fetchOrderStats = async () => {
    const supabase = createClient();
    try {
      let query = supabase.from('orders').select('*');

      const now = new Date();
      let startDate;

      switch (orderPeriod) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query = query.gte('created_at', startDate.toISOString());
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          const endYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          query = query.gte('created_at', startDate.toISOString()).lte('created_at', endYear.toISOString());
          break;
        case 'all':
          break;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        const revenue = data.reduce((sum, order) => sum + (order.package_price || 0), 0);
        setOrderStats({ count: data.length, revenue, orders: data });
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const fetchContentStats = async () => {
    const supabase = createClient();
    try {
      const [portfolioRes, testimonialRes, bankRes] = await Promise.all([
        supabase.from('portfolio_items').select('id', { count: 'exact', head: true }),
        supabase.from('testimoni_items').select('id', { count: 'exact', head: true }),
        supabase.from('bank_accounts').select('*').eq('is_active', true)
      ]);

      setContentStats({
        portfolio: portfolioRes.count || 0,
        testimonials: testimonialRes.count || 0,
        bankAccounts: bankRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching content stats:', error);
    }
  };

  const fetchVisitorStats = async () => {
    const supabase = createClient();
    const now = new Date();

    const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0)).toISOString();

    const todayStart = getStartOfDay(new Date());
    const { count: todayCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: thisMonthCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart);

    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const { count: thisYearCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisYearStart);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const { count: lastMonthCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd);

    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString();
    const { count: lastYearCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastYearStart)
      .lte('created_at', lastYearEnd);

    const { data: countryData } = await supabase
      .from('page_views')
      .select('country_code, country_name')
      .gte('created_at', thisMonthStart);

    const countryCounts = (countryData || []).reduce((acc, item) => {
      const code = item.country_code || 'XX';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    const byCountry = Object.entries(countryCounts).map(([code, count]) => ({
      code,
      country: countryData.find(d => d.country_code === code)?.country_name || 'Unknown',
      visitors: count,
      flag: getFlagEmoji(code)
    })).sort((a, b) => b.visitors - a.visitors);

    setVisitorStats({
      today: todayCount || 0,
      thisMonth: thisMonthCount || 0,
      thisYear: thisYearCount || 0,
      lastMonth: lastMonthCount || 0,
      lastYear: lastYearCount || 0,
      byCountry
    });
  };

  const getFlagEmoji = (countryCode) => {
    const flags = {
      // Asia Tenggara
      'ID': '🇮🇩', 'SG': '🇸🇬', 'MY': '🇲🇾', 'TH': '🇹🇭',
      'PH': '🇵🇭', 'VN': '🇻🇳', 'BN': '🇧🇳', 'KH': '🇰🇭',
      'LA': '🇱🇦', 'MM': '🇲🇲', 'TL': '🇹🇱',
      
      // Asia Timur
      'JP': '🇯🇵', 'CN': '🇨🇳', 'KR': '🇰🇷', 'TW': '🇹🇼',
      'HK': '🇭🇰', 'MO': '🇲🇴', 'MN': '🇲🇳',
      
      // Asia Selatan
      'IN': '🇮🇳', 'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰',
      'NP': '🇳🇵', 'BT': '🇧🇹', 'MV': '🇲🇻', 'AF': '🇦🇫',
      
      // Timur Tengah
      'SA': '🇸🇦', 'AE': '🇦🇪', 'TR': '🇹🇷', 'IR': '🇮🇷',
      'IQ': '🇮🇶', 'IL': '🇮🇱', 'JO': '🇯🇴', 'LB': '🇱🇧',
      'SY': '🇸🇾', 'YE': '🇾🇪', 'OM': '🇴🇲', 'KW': '🇰🇼',
      'QA': '🇶🇦', 'BH': '🇧🇭',
      
      // Eropa Barat
      'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹',
      'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭',
      'AT': '🇦🇹', 'PT': '🇵🇹', 'IE': '🇮🇪', 'LU': '🇱🇺',
      
      // Eropa Utara
      'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
      'IS': '🇮🇸',
      
      // Eropa Timur
      'RU': '🇷🇺', 'PL': '🇵🇱', 'UA': '🇺🇦', 'CZ': '🇨🇿',
      'RO': '🇷🇴', 'HU': '🇭🇺', 'BG': '🇧🇬', 'SK': '🇸🇰',
      'BY': '🇧🇾', 'RS': '🇷🇸', 'HR': '🇭🇷', 'BA': '🇧🇦',
      'SI': '🇸🇮', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪',
      
      // Amerika
      'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BR': '🇧🇷',
      'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪',
      'VE': '🇻🇪', 'EC': '🇪🇨', 'UY': '🇺🇾', 'PY': '🇵🇾',
      'BO': '🇧🇴', 'CR': '🇨🇷', 'PA': '🇵🇦', 'GT': '🇬🇹',
      'CU': '🇨🇺', 'DO': '🇩🇴', 'HN': '🇭🇳', 'SV': '🇸🇻',
      'NI': '🇳🇮', 'JM': '🇯🇲',
      
      // Oseania
      'AU': '🇦🇺', 'NZ': '🇳🇿', 'FJ': '🇫🇯', 'PG': '🇵🇬',
      
      // Afrika
      'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪',
      'MA': '🇲🇦', 'ET': '🇪🇹', 'GH': '🇬🇭', 'TZ': '🇹🇿',
      'UG': '🇺🇬', 'DZ': '🇩🇿', 'SD': '🇸🇩', 'AO': '🇦🇴',
      'TN': '🇹🇳', 'LY': '🇱🇾', 'SN': '🇸🇳', 'ZW': '🇿🇼'
    };
    return flags[countryCode] || '🌍';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price).replace('IDR', 'Rp ');
  };

  const getPeriodLabel = () => {
    switch (orderPeriod) {
      case 'thisMonth': return 'Bulan Ini';
      case 'lastMonth': return 'Bulan Kemarin';
      case 'lastYear': return 'Tahun Kemarin';
      case 'all': return 'Keseluruhan';
      default: return 'Bulan Ini';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6 mt-16 lg:mt-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 lg:mb-8 gap-3">
        <div>
          <Breadcrumb />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700">Dashboard Overview</h1>
        </div>
        <div className="text-xs sm:text-sm text-slate-700">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md p-4 sm:p-5 md:p-6 text-white mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Selamat Datang di Admin Panel! 👋</h2>
        <p className="text-sm lg:text-base text-white">
          Kelola website Anda dengan mudah. Monitor pesanan, kelola konten, dan lihat statistik pengunjung dalam satu tempat.
        </p>
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700">Statistik Pesanan</h2>
          <select
            value={orderPeriod}
            onChange={(e) => setOrderPeriod(e.target.value)}
            className="w-full sm:w-auto px-3 lg:px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="thisMonth">Bulan Ini</option>
            <option value="lastMonth">Bulan Kemarin</option>
            <option value="lastYear">Tahun Kemarin</option>
            <option value="all">Keseluruhan</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-4 sm:p-5 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs sm:text-sm font-medium">Total Pesanan {getPeriodLabel()}</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">{orderStats.count}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-full">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-5 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Pendapatan {getPeriodLabel()}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 truncate">{formatPrice(orderStats.revenue)}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-full ml-2">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 text-sm lg:text-base">Pesanan Terbaru</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-slate-700 uppercase">Invoice</th>
                    <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-slate-700 uppercase hidden sm:table-cell">Pelanggan</th>
                    <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-slate-700 uppercase">Paket</th>
                    <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-slate-700 uppercase">Nominal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {orderStats.orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium text-slate-700 whitespace-nowrap">{order.invoice_number}</td>
                      <td className="px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-slate-700 hidden sm:table-cell">{order.customer_name}</td>
                      <td className="px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-slate-700 max-w-[100px] truncate">{order.package_name}</td>
                      <td className="px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-slate-700 whitespace-nowrap">{formatPrice(order.package_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Link href="/dashboard/invoices" className="mt-4 inline-block text-primary hover:text-secondary font-medium text-xs lg:text-sm">
            Lihat Semua Pesanan →
          </Link>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium">Total Portfolio</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 mt-2">{contentStats.portfolio}</p>
            </div>
            <div className="bg-primary text-white p-2 sm:p-3 rounded-full">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/portfolio" className="text-primary hover:text-secondary text-xs lg:text-sm font-medium">
            Kelola Portfolio →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium">Total Testimoni</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 mt-2">{contentStats.testimonials}</p>
            </div>
            <div className="bg-primary text-white p-2 sm:p-3 rounded-full">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/testimoni" className="text-primary hover:text-secondary text-xs lg:text-sm font-medium">
            Kelola Testimoni →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium">Rekening Bank Aktif</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 mt-2">{contentStats.bankAccounts}</p>
            </div>
            <div className="bg-primary text-white p-2 sm:p-3 rounded-full">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/bank-accounts" className="text-primary hover:text-secondary text-xs lg:text-sm font-medium">
            Kelola Bank →
          </Link>
        </div>
      </div>

      {/* Visitor Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700 mb-4">Statistik Pengunjung</h2>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-slate-700 font-medium text-sm lg:text-base">Hari Ini</span>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-600">{visitorStats.today.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-slate-700 font-medium text-sm lg:text-base">Bulan Ini</span>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-600">{visitorStats.thisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-slate-700 font-medium text-sm lg:text-base">Tahun Ini</span>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-600">{visitorStats.thisYear.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-slate-700 font-medium text-sm lg:text-base">Bulan Kemarin</span>
              <span className="text-base sm:text-lg lg:text-xl font-semibold text-slate-700">{visitorStats.lastMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-slate-700 font-medium text-sm lg:text-base">Tahun Kemarin</span>
              <span className="text-base sm:text-lg lg:text-xl font-semibold text-slate-700">{visitorStats.lastYear.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700 mb-4">Pengunjung per Negara</h2>
          <div className="space-y-2">
            {visitorStats.byCountry.map((country) => (
              <div key={country.code} className="flex items-center justify-between p-2 lg:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 text-sm lg:text-base truncate">{country.country}</p>
                    <p className="text-xs text-slate-500">{country.code}</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-600">{country.visitors.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">visitors</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}