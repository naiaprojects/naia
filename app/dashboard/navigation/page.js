// app/dashboard/navigation/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function NavigationPage() {
  const supabase = createClient();
  const router = useRouter();
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    label: '',
    href: '',
    position: 0,
    is_active: true
  });

  useEffect(() => {
    checkAuthAndFetchNav();
  }, []);

  const checkAuthAndFetchNav = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setMessage('Error: Session tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    await fetchNavItems();
  };

  const fetchNavItems = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setNavItems(data);
    } catch (error) {
      console.error('Error fetching navigation:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menyimpan perubahan');
        return;
      }

      if (editItem) {
        const { error } = await supabase
          .from('navigation_items')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editItem.id);

        if (error) throw error;
        setMessage('Navigation item berhasil diupdate!');
      } else {
        const { error } = await supabase
          .from('navigation_items')
          .insert([formData]);

        if (error) throw error;
        setMessage('Navigation item berhasil ditambahkan!');
      }

      resetForm();
      fetchNavItems();

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
      });

      router.refresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving navigation:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({
      label: item.label,
      href: item.href,
      position: item.position,
      is_active: item.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menghapus item');
        return;
      }

      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage('Navigation item berhasil dihapus!');
      fetchNavItems();

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
      });

      router.refresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting navigation:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      href: '',
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
        <h1 className="text-3xl font-bold">Navigation Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Batal' : 'Tambah Item'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editItem ? 'Edit Navigation Item' : 'Tambah Navigation Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link (href)
              </label>
              <input
                type="text"
                value={formData.href}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posisi
              </label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Aktif
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posisi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {navItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.href}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}