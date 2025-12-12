// app/portofolio/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PortofolioPage() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [heroBackground, setHeroBackground] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ image: '', title: '', link: '' });

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Grid columns
  const [gridCols, setGridCols] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfolioRes, heroRes] = await Promise.all([
          fetch('/api/portfolio'),
          fetch('/api/hero')
        ]);
        const portfolioData = await portfolioRes.json();
        const heroData = await heroRes.json();

        setPortfolioItems(portfolioData || []);
        if (heroData?.background_image) {
          setHeroBackground(heroData.background_image);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered data
  const filteredItems = useMemo(() => {
    let data = portfolioItems;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.alt?.toLowerCase().includes(query)
      );
    }
    return data;
  }, [portfolioItems, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const gridColsClass = useMemo(() => {
    switch (gridCols) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 4: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  }, [gridCols]);

  const openModal = (item) => {
    setModalData(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section
          id="hero-section"
          className="mx-4 rounded-b-3xl bg-primary pt-32 pb-20 relative overflow-hidden bg-center bg-cover shadow-2xl mb-12"
          style={heroBackground ? { backgroundImage: `url('${heroBackground}')` } : {}}
        >
          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-white">
              Our Portfolio
            </h1>
            <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
              Take a look at our portfolio of websites that combine beautiful design with powerful functionality.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
              {/* Search */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search portfolio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                {/* Count */}
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-800">{filteredItems.length}</span> projects
                </p>

                {/* Grid Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                  <span className="text-xs text-gray-500 px-2">Grid:</span>
                  {[2, 3, 4].map(cols => (
                    <button
                      key={cols}
                      onClick={() => setGridCols(cols)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${gridCols === cols
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-r-transparent"></div>
                <p className="mt-4 text-gray-500">Loading portfolio...</p>
              </div>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No portfolio found</h3>
              <p className="text-gray-500">Try changing your search keywords</p>
            </div>
          ) : (
            <div className={`grid ${gridColsClass} gap-6`}>
              {paginatedItems.map((item, index) => (
                <div
                  key={index}
                  className="relative group rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition duration-300"
                >
                  <img
                    src={item.image}
                    alt={item.alt || item.title}
                    className="w-full transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    {/* Top Right Eye Icon */}
                    <button
                      onClick={() => openModal(item)}
                      className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-primary z-10 transition-colors"
                      title="Preview Image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>

                    {/* Center Link Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg z-10"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl font-medium transition ${currentPage === page
                    ? 'bg-primary text-white shadow-lg'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
            <div className="absolute top-5 right-5 w-10 h-10 cursor-pointer hover:opacity-75 transition-opacity" onClick={closeModal}>
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
            <div className="max-w-full max-h-screen object-contain p-4 flex flex-col items-center">
              <img alt="Preview" className="max-w-full max-h-screen object-contain" src={modalData.image} />
              <a className="mt-4 text-lg bg-primary text-white px-8 py-3 rounded-full font-medium" href={modalData.link} target="_blank" rel="noopener noreferrer">
                {modalData.title}
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}