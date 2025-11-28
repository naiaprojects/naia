// app/dashboard/footer/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

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
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Footer Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary"
        >
          {showForm ? 'Batal' : 'Tambah Item'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('footer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'footer'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Footer Links
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'social'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Social Links
          </button>
        </nav>
      </div>

      {/* Footer Links Form */}
      {showForm && activeTab === 'footer' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editItem ? 'Edit Footer Link' : 'Tambah Footer Link'}
          </h2>
          <form onSubmit={handleFooterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <select
                value={footerFormData.category}
                onChange={(e) => setFooterFormData({ ...footerFormData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="naia">Naia</option>
                <option value="products">Products</option>
                <option value="resources">Resources</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <input
                type="text"
                value={footerFormData.label}
                onChange={(e) => setFooterFormData({ ...footerFormData, label: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
              <input
                type="text"
                value={footerFormData.href}
                onChange={(e) => setFooterFormData({ ...footerFormData, href: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posisi</label>
              <input
                type="number"
                value={footerFormData.position}
                onChange={(e) => setFooterFormData({ ...footerFormData, position: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={footerFormData.is_active}
                onChange={(e) => setFooterFormData({ ...footerFormData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Aktif</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Social Links Form */}
      {showForm && activeTab === 'social' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editItem ? 'Edit Social Link' : 'Tambah Social Link'}
          </h2>
          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
              <input
                type="text"
                value={socialFormData.name}
                onChange={(e) => setSocialFormData({ ...socialFormData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
              <input
                type="text"
                value={socialFormData.href}
                onChange={(e) => setSocialFormData({ ...socialFormData, href: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SVG Icon Code</label>
              <textarea
                value={socialFormData.icon_svg}
                onChange={(e) => setSocialFormData({ ...socialFormData, icon_svg: e.target.value })}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posisi</label>
              <input
                type="number"
                value={socialFormData.position}
                onChange={(e) => setSocialFormData({ ...socialFormData, position: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={socialFormData.is_active}
                onChange={(e) => setSocialFormData({ ...socialFormData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Aktif</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Footer Links Table */}
      {activeTab === 'footer' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posisi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {footerLinks.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.href}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(item, 'footer')} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(item.id, 'footer')} className="text-red-600 hover:text-red-900">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Social Links Table */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posisi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {socialLinks.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.href}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(item, 'social')} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(item.id, 'social')} className="text-red-600 hover:text-red-900">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}