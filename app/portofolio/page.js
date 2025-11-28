import Navbar from '@/components/Navbar';

export default function PortofolioPage() {
  // Data portfolio lengkap - tambahkan sebanyak yang Anda mau
  const allPortfolio = [
    {
      id: 1,
      title: 'KangLogo.com',
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      category: 'Website',
      link: '#'
    },
    {
      id: 2,
      title: 'Project 2',
      image: 'https://via.placeholder.com/400x300',
      category: 'Logo Design',
      link: '#'
    },
    {
      id: 3,
      title: 'Project 3',
      image: 'https://via.placeholder.com/400x300',
      category: 'Branding',
      link: '#'
    },
    {
      id: 4,
      title: 'Project 4',
      image: 'https://via.placeholder.com/400x300',
      category: 'Website',
      link: '#'
    },
    {
      id: 5,
      title: 'Project 5',
      image: 'https://via.placeholder.com/400x300',
      category: 'UI/UX',
      link: '#'
    },
    {
      id: 6,
      title: 'Project 6',
      image: 'https://via.placeholder.com/400x300',
      category: 'Website',
      link: '#'
    },
    // Tambahkan portfolio lainnya...
  ];

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
              Semua Portofolio
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Lihat semua project yang telah kami kerjakan untuk berbagai klien dari berbagai industri
            </p>
          </div>

          {/* Portfolio Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allPortfolio.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition duration-300 group"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.category}</p>
                </div>
                <span className="absolute bottom-4 left-4 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  {item.category}
                </span>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            
            <a href="/" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-full font-medium transition">  ← Kembali ke Beranda</a>
          </div>
        </div>
      </main>
    </>
  );
}