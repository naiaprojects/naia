"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import dynamic from "next/dynamic";
import LogoPathAnimation from "@/components/LogoPathAnimation";

// Dynamic import for ApexCharts (client-side only)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });



export default function DashboardPage() {
  const [orderStats, setOrderStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    allTime: 0,
    percentChange: 0,
    monthlyData: [],
  });
  const [contentStats, setContentStats] = useState({
    orders: { total: 0, thisMonth: 0 },
    portfolio: { total: 0, thisMonth: 0 },
    services: { total: 0, thisMonth: 0 },
    testimonials: { total: 0, thisMonth: 0 },
  });
  const [visitorStats, setVisitorStats] = useState({
    byCountry: [],
    bySource: [],
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoaded, setChartLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    fetchAllStats();
    setChartLoaded(true);
  }, []);

  // Initialize map after data loaded
  useEffect(() => {
    if (
      !loading &&
      typeof window !== "undefined" &&
      mapRef.current &&
      !mapInstance.current
    ) {
      initMap();
    }
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [loading, visitorStats.byCountry]);

  const initMap = async () => {
    try {
      const jsVectorMap = (await import("jsvectormap")).default;
      await import("jsvectormap/dist/maps/world.js");

      if (mapRef.current && !mapInstance.current) {
        mapInstance.current = new jsVectorMap({
          selector: mapRef.current,
          map: "world",
          zoomButtons: false,
          zoomOnScroll: false,
          regionStyle: {
            initial: {
              fill: "#D1D5DB",
              fillOpacity: 1,
              stroke: "none",
              strokeWidth: 0,
            },
            hover: {
              fillOpacity: 0.8,
              cursor: "pointer",
            },
          },
          backgroundColor: "transparent",
        });
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrderStats(),
      fetchContentStats(),
      fetchVisitorStats(),
      fetchPendingOrders(),
    ]);
    setLoading(false);
  };

  const fetchOrderStats = async () => {
    const supabase = createClient();
    const now = new Date();

    try {
      // This Week
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { count: weekCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString());

      // This Month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: monthCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      // Last Month (for comparison)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59
      );
      const { count: lastMonthCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // This Year
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const { count: yearCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yearStart.toISOString());

      // All Time
      const { count: allCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Monthly data for chart (last 12 months)
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59
        );

        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthDate.toISOString())
          .lte("created_at", monthEnd.toISOString());

        monthlyData.push({
          month: monthDate.toLocaleDateString("en-US", { month: "short" }),
          count: count || 0,
        });
      }

      // Calculate percentage change
      const percentChange =
        lastMonthCount > 0
          ? Math.round(((monthCount - lastMonthCount) / lastMonthCount) * 100)
          : monthCount > 0
            ? 100
            : 0;

      setOrderStats({
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0,
        thisYear: yearCount || 0,
        allTime: allCount || 0,
        lastMonth: lastMonthCount || 0,
        percentChange,
        monthlyData,
      });
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  };

  const fetchContentStats = async () => {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // Orders
      const { count: ordersTotal } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      const { count: ordersMonth } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      // Portfolio
      const { count: portfolioTotal } = await supabase
        .from("portfolio_items")
        .select("*", { count: "exact", head: true });
      const { count: portfolioMonth } = await supabase
        .from("portfolio_items")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      // Services
      const { count: servicesTotal } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true });
      const { count: servicesMonth } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      // Testimonials
      const { count: testimonialsTotal } = await supabase
        .from("testimoni_items")
        .select("*", { count: "exact", head: true });
      const { count: testimonialsMonth } = await supabase
        .from("testimoni_items")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      setContentStats({
        orders: { total: ordersTotal || 0, thisMonth: ordersMonth || 0 },
        portfolio: {
          total: portfolioTotal || 0,
          thisMonth: portfolioMonth || 0,
        },
        services: { total: servicesTotal || 0, thisMonth: servicesMonth || 0 },
        testimonials: {
          total: testimonialsTotal || 0,
          thisMonth: testimonialsMonth || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching content stats:", error);
    }
  };

  const fetchVisitorStats = async () => {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    try {
      // By Country
      const { data: countryData } = await supabase
        .from("page_views")
        .select("country_code, country_name")
        .gte("created_at", monthStart);

      const countryCounts = (countryData || []).reduce((acc, item) => {
        const code = item.country_code || "XX";
        acc[code] = {
          count: (acc[code]?.count || 0) + 1,
          name: item.country_name || "Unknown",
        };
        return acc;
      }, {});

      const totalVisitors = Object.values(countryCounts).reduce(
        (sum, c) => sum + c.count,
        0
      );

      const byCountry = Object.entries(countryCounts)
        .map(([code, data]) => ({
          code,
          country: data.name,
          visitors: data.count,
          percentage:
            totalVisitors > 0
              ? Math.round((data.count / totalVisitors) * 100)
              : 0,
          flag: getCountryFlag(code),
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);

      // By Source/Referrer
      const { data: sourceData } = await supabase
        .from("page_views")
        .select("referrer")
        .gte("created_at", monthStart);

      const sourceCounts = (sourceData || []).reduce((acc, item) => {
        let source = "Direct";
        if (item.referrer) {
          try {
            const url = new URL(item.referrer);
            source = url.hostname.replace("www.", "");
          } catch {
            source = item.referrer;
          }
        }
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const bySource = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, visitors: count }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);

      setVisitorStats({ byCountry, bySource, totalVisitors });
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
    }
  };

  const fetchPendingOrders = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPendingOrders(data || []);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getCountryFlag = (countryCode) => {
    // Convert country code to flag emoji
    if (!countryCode || countryCode === "XX")
      return "/icons/country/default.svg";
    return `/icons/country/${countryCode.toLowerCase()}.svg`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Calculate total activity this month
  const totalActivityThisMonth =
    contentStats.orders.thisMonth +
    contentStats.portfolio.thisMonth +
    contentStats.services.thisMonth +
    contentStats.testimonials.thisMonth;

  // ApexCharts options for bar chart - using CSS variable for primary color
  const barChartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    colors: ["#14dff2"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: orderStats.monthlyData.map((d) => d.month),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} orders`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
  };

  const barChartSeries = [
    {
      name: "Orders",
      data: orderStats.monthlyData.map((d) => d.count),
    },
  ];

  // Fullscreen loading
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders This Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-slate-500 text-sm font-medium">Orders This Week</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.thisWeek}
            </p>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              vs last week
            </span>
          </div>
        </div>

        {/* Orders This Month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-slate-500 text-sm font-medium">
            Orders This Month
          </p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.thisMonth}
            </p>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${orderStats.percentChange >= 0
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
                }`}
            >
              {orderStats.percentChange >= 0 ? "+" : ""}
              {orderStats.percentChange}%
            </span>
          </div>
        </div>

        {/* Orders This Year */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-slate-500 text-sm font-medium">Orders This Year</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.thisYear}
            </p>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              YTD
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-slate-500 text-sm font-medium">Total Orders</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.allTime}
            </p>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              All time
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Orders Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                Monthly Orders
              </h2>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                  />
                </svg>
              </button>
            </div>

            {/* ApexCharts Bar Chart */}
            <div className="-mx-2">
              {chartLoaded && (
                <Chart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={300}
                />
              )}
            </div>
          </div>

          {/* Visitors Demographic with Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Visitors Demographic
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Number of Visitor based on country
                </p>
              </div>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 h-fit">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                  />
                </svg>
              </button>
            </div>

            {/* Map Container */}
            <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 sm:px-6">
              <div
                ref={mapRef}
                className="h-[212px] w-full"
                style={{ backgroundColor: "transparent" }}
              />
            </div>

            {/* Country List */}
            <div className="space-y-5">
              {visitorStats.byCountry.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No visitor data available
                </p>
              ) : (
                visitorStats.byCountry.map((country, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                        <span className="text-xl">
                          {getFlagEmoji(country.code)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {country.country}
                        </p>
                        <span className="block text-xs text-slate-500">
                          {formatNumber(country.visitors)} Visitors
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-36">
                      <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-slate-200">
                        <div
                          className="absolute left-0 top-0 h-full rounded-sm bg-primary"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {country.percentage}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Content Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Content Overview
              </h2>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                  />
                </svg>
              </button>
            </div>

            <div className="flex justify-between text-xs text-slate-500 mb-3 px-1">
              <span>Type</span>
              <span>This Month / Total</span>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/invoices"
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="text-slate-700 font-medium">Orders</span>
                <span className="text-slate-500 font-medium">
                  <span className="text-primary">
                    {contentStats.orders.thisMonth}
                  </span>{" "}
                  / {contentStats.orders.total}
                </span>
              </Link>
              <Link
                href="/dashboard/portfolio"
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="text-slate-700 font-medium">Portfolio</span>
                <span className="text-slate-500 font-medium">
                  <span className="text-primary">
                    {contentStats.portfolio.thisMonth}
                  </span>{" "}
                  / {contentStats.portfolio.total}
                </span>
              </Link>
              <Link
                href="/dashboard/services"
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="text-slate-700 font-medium">Services</span>
                <span className="text-slate-500 font-medium">
                  <span className="text-primary">
                    {contentStats.services.thisMonth}
                  </span>{" "}
                  / {contentStats.services.total}
                </span>
              </Link>
              <Link
                href="/dashboard/testimoni"
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="text-slate-700 font-medium">Testimonials</span>
                <span className="text-slate-500 font-medium">
                  <span className="text-primary">
                    {contentStats.testimonials.thisMonth}
                  </span>{" "}
                  / {contentStats.testimonials.total}
                </span>
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-slate-500">
                  Total Activity This Month
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {totalActivityThisMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Pending Orders</h2>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                {pendingOrders.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending orders
                </p>
              ) : (
                pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {order.invoice_number}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100 whitespace-nowrap">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        {formatDate(order.created_at)}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(order.package_price)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/invoices?status=pending"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              View All Pending
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for flag emoji
function getFlagEmoji(countryCode) {
  const flags = {
    ID: "🇮🇩",
    SG: "🇸🇬",
    MY: "🇲🇾",
    TH: "🇹🇭",
    PH: "🇵🇭",
    VN: "🇻🇳",
    JP: "🇯🇵",
    CN: "🇨🇳",
    KR: "🇰🇷",
    TW: "🇹🇼",
    HK: "🇭🇰",
    IN: "🇮🇳",
    PK: "🇵🇰",
    BD: "🇧🇩",
    SA: "🇸🇦",
    AE: "🇦🇪",
    TR: "🇹🇷",
    GB: "🇬🇧",
    FR: "🇫🇷",
    DE: "🇩🇪",
    IT: "🇮🇹",
    ES: "🇪🇸",
    NL: "🇳🇱",
    RU: "🇷🇺",
    PL: "🇵🇱",
    UA: "🇺🇦",
    US: "🇺🇸",
    CA: "🇨🇦",
    MX: "🇲🇽",
    BR: "🇧🇷",
    AR: "🇦🇷",
    AU: "🇦🇺",
    NZ: "🇳🇿",
    ZA: "🇿🇦",
    EG: "🇪🇬",
    NG: "🇳🇬",
  };
  return flags[countryCode] || "🌍";
}
