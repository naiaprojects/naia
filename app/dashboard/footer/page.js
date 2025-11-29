// app/dashboard/footer/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function FooterManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('footer');
  const [footerLinks, setFooterLinks] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [message, setMessage] = useState('');

  const [footerFormData, setFooterFormData] = useState({
    category: 'naia',
    label: '',
    href: '',
    position: 0,
    is_active: true
  });

  const [socialFormData, setSocialFormData] = useState({
    name: '',
    href: '',
    icon_svg: '',
    position: 0,
    is_active: true
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setMessage('Error: Session tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    await fetchData();
  };

  const fetchData = async () => {
    try {
      const [footerResponse, socialResponse] = await Promise.all([
        supabase.from('footer_links').select('*').order('category, position'),
        supabase.from('social_links').select('*').order('position')
      ]);

      if (footerResponse.error) throw footerResponse.error;
      if (socialResponse.error) throw socialResponse.error;

      setFooterLinks(footerResponse.data);
      setSocialLinks(socialResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Footer Links Handlers
  const handleFooterSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menyimpan perubahan');
        return;
      }

      if (editItem) {
        const { error } = await supabase
          .from('footer_links')
          .update({ ...footerFormData, updated_at: new Date().toISOString() })
          .eq('id', editItem.id);
        if (error) throw error;
        setMessage('Footer link berhasil diupdate!');
      } else {
        const { error } = await supabase
          .from('footer_links')
          .insert([footerFormData]);
        if (error) throw error;
        setMessage('Footer link berhasil ditambahkan!');
      }

      resetForm();
      fetchData();

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
      });

      router.refresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving footer link:', error);
      setMessage('Error: ' + error.message);
    }
  };

  // Social Links Handlers
  const handleSocialSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menyimpan perubahan');
        return;
      }

      if (editItem) {
        const { error } = await supabase
          .from('social_links')
          .update({ ...socialFormData, updated_at: new Date().toISOString() })
          .eq('id', editItem.id);
        if (error) throw error;
        setMessage('Social link berhasil diupdate!');
      } else {
        const { error } = await supabase
          .from('social_links')
          .insert([socialFormData]);
        if (error) throw error;
        setMessage('Social link berhasil ditambahkan!');
      }

      resetForm();
      fetchData();

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
      });

      router.refresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving social link:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const handleEdit = (item, type) => {
    setEditItem(item);
    if (type === 'footer') {
      setFooterFormData({
        category: item.category,
        label: item.label,
        href: item.href,
        position: item.position,
        is_active: item.is_active
      });
    } else {
      setSocialFormData({
        name: item.name,
        href: item.href,
        icon_svg: item.icon_svg,
        position: item.position,
        is_active: item.is_active
      });
    }
    setActiveTab(type);
    setShowForm(true);
  };

  const handleDelete = async (id, type) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menghapus item');
        return;
      }

      const table = type === 'footer' ? 'footer_links' : 'social_links';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage('Item berhasil dihapus!');
      fetchData();

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
      });

      router.refresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting item:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFooterFormData({
      category: 'naia',
      label: '',
      href: '',
      position: 0,
      is_active: true
    });
    setSocialFormData({
      name: '',
      href: '',
      icon_svg: '',
      position: 0,
      is_active: true
    });
    setEditItem(null);
    setShowForm(false);
  };

  if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <LogoPathAnimation />
        </div>
      );
    }

  return (
    <div className="p-4 lg:p-6 mt-16 lg:mt-0">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Footer Management</h1>
            <p className="text-sm text-slate-700 mt-1">Kelola link footer dan media sosial</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
          >
            {showForm ? 'Batal' : 'Tambah Item'}
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('footer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'footer'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-gray-300'
              }`}
          >
            Footer Links
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'social'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-gray-300'
              }`}
          >
            Social Links
          </button>
        </nav>
      </div>

      {/* Footer Links Form */}
      {showForm && activeTab === 'footer' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
          <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
            {editItem ? 'Edit Footer Link' : 'Tambah Footer Link'}
          </h2>
          <form onSubmit={handleFooterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <select
                  value={footerFormData.category}
                  onChange={(e) => setFooterFormData({ ...footerFormData, category: e.target.value })}
                  className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="naia">Naia</option>
                  <option value="products">Products</option>
                  <option value="resources">Resources</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Posisi</label>
                <input
                  type="number"
                  value={footerFormData.position}
                  onChange={(e) => setFooterFormData({ ...footerFormData, position: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Label</label>
              <input
                type="text"
                value={footerFormData.label}
                onChange={(e) => setFooterFormData({ ...footerFormData, label: e.target.value })}
                required
                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
              <input
                type="text"
                value={footerFormData.href}
                onChange={(e) => setFooterFormData({ ...footerFormData, href: e.target.value })}
                required
                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={footerFormData.is_active}
                onChange={(e) => setFooterFormData({ ...footerFormData, is_active: e.target.checked })}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <label className="text-sm font-medium text-slate-700">Aktif</label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 sm:px-6 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Social Links Form */}
      {showForm && activeTab === 'social' && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
          <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
            {editItem ? 'Edit Social Link' : 'Tambah Social Link'}
          </h2>
          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama</label>
                <input
                  type="text"
                  value={socialFormData.name}
                  onChange={(e) => setSocialFormData({ ...socialFormData, name: e.target.value })}
                  required
                  className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Posisi</label>
                <input
                  type="number"
                  value={socialFormData.position}
                  onChange={(e) => setSocialFormData({ ...socialFormData, position: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
              <input
                type="text"
                value={socialFormData.href}
                onChange={(e) => setSocialFormData({ ...socialFormData, href: e.target.value })}
                required
                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SVG Icon Code</label>
              <textarea
                value={socialFormData.icon_svg}
                onChange={(e) => setSocialFormData({ ...socialFormData, icon_svg: e.target.value })}
                required
                rows="4"
                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={socialFormData.is_active}
                onChange={(e) => setSocialFormData({ ...socialFormData, is_active: e.target.checked })}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <label className="text-sm font-medium text-slate-700">Aktif</label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 sm:px-6 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Table View - Footer Links */}
      {activeTab === 'footer' && (
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Posisi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {footerLinks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 capitalize">{item.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.href}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.position}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(item, 'footer')} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                      <button onClick={() => handleDelete(item.id, 'footer')} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card View - Footer Links */}
      {activeTab === 'footer' && (
        <div className="lg:hidden space-y-4">
          {footerLinks.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 mb-1">{item.label}</p>
                  <p className="text-xs text-slate-500">Kategori: {item.category} | Posisi: {item.position}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-slate-700 break-all">{item.href}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(item, 'footer')} 
                  className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id, 'footer')} 
                  className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View - Social Links */}
      {activeTab === 'social' && (
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Posisi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {socialLinks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.href}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.position}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(item, 'social')} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                      <button onClick={() => handleDelete(item.id, 'social')} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card View - Social Links */}
      {activeTab === 'social' && (
        <div className="lg:hidden space-y-4">
          {socialLinks.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 mb-1">{item.name}</p>
                  <p className="text-xs text-slate-500">Posisi: {item.position}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-slate-700 break-all">{item.href}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(item, 'social')} 
                  className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id, 'social')} 
                  className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State - Footer Links */}
      {activeTab === 'footer' && footerLinks.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-slate-700">Tidak ada footer link yang tersedia</p>
        </div>
      )}

      {/* Empty State - Social Links */}
      {activeTab === 'social' && socialLinks.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <p className="text-slate-700">Tidak ada social link yang tersedia</p>
        </div>
      )}
    </div>
  );
}