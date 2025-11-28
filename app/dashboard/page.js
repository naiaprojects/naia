'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

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
          // No filter
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

    // Helper untuk reset jam ke 00:00:00
    const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0)).toISOString();

    // Hari Ini
    const todayStart = getStartOfDay(new Date());
    const { count: todayCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    // Bulan Ini
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: thisMonthCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart);

    // Tahun Ini
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const { count: thisYearCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisYearStart);

    // Bulan Kemarin
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const { count: lastMonthCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd);

    // Tahun Kemarin
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString();
    const { count: lastYearCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastYearStart)
      .lte('created_at', lastYearEnd);

    // By Country (ambil dari bulan ini saja agar relevan)
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
      'ID': '🇮🇩', 'US': '🇺🇸', 'SG': '🇸🇬', 'MY': '🇲🇾',
      'AU': '🇦🇺', 'JP': '🇯🇵', 'GB': '🇬🇧'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>


      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md p-6 text-white mb-6">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang di Admin Panel! 👋</h2>
        <p className="text-white">
          Kelola website Anda dengan mudah. Monitor pesanan, kelola konten, dan lihat statistik pengunjung dalam satu tempat.
        </p>
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Statistik Pesanan</h2>
          <select
            value={orderPeriod}
            onChange={(e) => setOrderPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="thisMonth">Bulan Ini</option>
            <option value="lastMonth">Bulan Kemarin</option>
            <option value="lastYear">Tahun Kemarin</option>
            <option value="all">Keseluruhan</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Total Pesanan {getPeriodLabel()}</p>
                <p className="text-4xl font-bold mt-2">{orderStats.count}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Pendapatan {getPeriodLabel()}</p>
                <p className="text-3xl font-bold mt-2">{formatPrice(orderStats.revenue)}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Pesanan Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderStats.orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.package_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatPrice(order.package_price)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.payment_status === 'verified' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.payment_status === 'verified' ? 'Terverifikasi' :
                          order.payment_status === 'rejected' ? 'Ditolak' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/dashboard/invoices" className="mt-4 inline-block text-primary hover:text-primarys font-medium text-sm">
            Lihat Semua Pesanan →
          </Link>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Portfolio</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contentStats.portfolio}</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/portfolio" className="text-primary hover:text-secondary text-sm font-medium">
            Kelola Portfolio →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Testimoni</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contentStats.testimonials}</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/testimoni" className="text-primary hover:text-secondary text-sm font-medium">
            Kelola Testimoni →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Rekening Bank Aktif</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contentStats.bankAccounts}</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/bank-accounts" className="text-primary hover:text-secondary text-sm font-medium">
            Kelola Bank →
          </Link>
        </div>
      </div>

      {/* Visitor Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Statistik Pengunjung</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-gray-700 font-medium">Hari Ini</span>
              <span className="text-2xl font-bold text-slate-600">{visitorStats.today.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-gray-700 font-medium">Bulan Ini</span>
              <span className="text-2xl font-bold text-slate-600">{visitorStats.thisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-gray-700 font-medium">Tahun Ini</span>
              <span className="text-2xl font-bold text-slate-600">{visitorStats.thisYear.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-gray-600 font-medium">Bulan Kemarin</span>
              <span className="text-xl font-semibold text-slate-700">{visitorStats.lastMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
              <span className="text-gray-600 font-medium">Tahun Kemarin</span>
              <span className="text-xl font-semibold text-slate-700">{visitorStats.lastYear.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pengunjung per Negara</h2>
          <div className="space-y-2">
            {visitorStats.byCountry.map((country) => (
              <div key={country.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <p className="font-medium text-slate-800">{country.country}</p>
                    <p className="text-xs text-slate-500">{country.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-600">{country.visitors.toLocaleString()}</p>
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