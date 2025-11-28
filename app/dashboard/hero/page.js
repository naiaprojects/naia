// app/dashboard/hero/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function HeroManagementPage() {
    const supabase = createClient();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('content');
    const [heroContent, setHeroContent] = useState(null);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editFeature, setEditFeature] = useState(null);
    const [message, setMessage] = useState('');

    const [heroFormData, setHeroFormData] = useState({
        title: '',
        background_image: '',
        right_image: ''
    });

    const [featureFormData, setFeatureFormData] = useState({
        title: '',
        description: '',
        icon_url: '',
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
            const [heroResponse, featuresResponse] = await Promise.all([
                supabase.from('hero_content').select('*').single(),
                supabase.from('hero_features').select('*').order('position')
            ]);

            if (heroResponse.data) {
                setHeroContent(heroResponse.data);
                setHeroFormData({
                    title: heroResponse.data.title,
                    background_image: heroResponse.data.background_image,
                    right_image: heroResponse.data.right_image
                });
            }

            if (featuresResponse.data) {
                setFeatures(featuresResponse.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHeroSubmit = async (e) => {
        e.preventDefault();

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menyimpan perubahan');
                return;
            }

            const { error } = await supabase
                .from('hero_content')
                .update({
                    ...heroFormData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', heroContent.id);

            if (error) throw error;

            setMessage('Hero content berhasil diupdate!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving hero:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const handleFeatureSubmit = async (e) => {
        e.preventDefault();

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menyimpan perubahan');
                return;
            }

            if (editFeature) {
                const { error } = await supabase
                    .from('hero_features')
                    .update({ ...featureFormData, updated_at: new Date().toISOString() })
                    .eq('id', editFeature.id);
                if (error) throw error;
                setMessage('Feature berhasil diupdate!');
            } else {
                const { error } = await supabase
                    .from('hero_features')
                    .insert([featureFormData]);
                if (error) throw error;
                setMessage('Feature berhasil ditambahkan!');
            }

            resetFeatureForm();
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving feature:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const handleEditFeature = (feature) => {
        setEditFeature(feature);
        setFeatureFormData({
            title: feature.title,
            description: feature.description,
            icon_url: feature.icon_url,
            position: feature.position,
            is_active: feature.is_active
        });
        setActiveTab('features');
        setShowForm(true);
    };

    const handleDeleteFeature = async (id) => {
        if (!confirm('Yakin ingin menghapus feature ini?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menghapus item');
                return;
            }

            const { error } = await supabase
                .from('hero_features')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessage('Feature berhasil dihapus!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting feature:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const resetFeatureForm = () => {
        setFeatureFormData({
            title: '',
            description: '',
            icon_url: '',
            position: 0,
            is_active: true
        });
        setEditFeature(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Hero Management</h1>
                {activeTab === 'features' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary"
                    >
                        {showForm ? 'Batal' : 'Tambah Feature'}
                    </button>
                )}
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
                        onClick={() => setActiveTab('content')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Hero Content
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'features'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Features
                    </button>
                </nav>
            </div>

            {/* Hero Content Form */}
            {activeTab === 'content' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Edit Hero Content</h2>
                    <form onSubmit={handleHeroSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={heroFormData.title}
                                onChange={(e) => setHeroFormData({ ...heroFormData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
                            <input
                                type="text"
                                value={heroFormData.background_image}
                                onChange={(e) => setHeroFormData({ ...heroFormData, background_image: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {heroFormData.background_image && (
                                <img src={heroFormData.background_image} alt="Background Preview" className="mt-2 h-32 rounded" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Right Image URL</label>
                            <input
                                type="text"
                                value={heroFormData.right_image}
                                onChange={(e) => setHeroFormData({ ...heroFormData, right_image: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {heroFormData.right_image && (
                                <img src={heroFormData.right_image} alt="Right Image Preview" className="mt-2 h-32 rounded" />
                            )}
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                            Update Hero Content
                        </button>
                    </form>
                </div>
            )}

            {/* Features Form */}
            {activeTab === 'features' && showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editFeature ? 'Edit Feature' : 'Tambah Feature'}
                    </h2>
                    <form onSubmit={handleFeatureSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={featureFormData.title}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={featureFormData.description}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, description: e.target.value })}
                                required
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL</label>
                            <input
                                type="text"
                                value={featureFormData.icon_url}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, icon_url: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {featureFormData.icon_url && (
                                <img src={featureFormData.icon_url} alt="Icon Preview" className="mt-2 h-12" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                            <input
                                type="number"
                                value={featureFormData.position}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, position: parseInt(e.target.value) })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={featureFormData.is_active}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, is_active: e.target.checked })}
                                className="mr-2"
                            />
                            <label className="text-sm font-medium text-gray-700">Aktif</label>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                                {editFeature ? 'Update' : 'Simpan'}
                            </button>
                            <button type="button" onClick={resetFeatureForm} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Features Table */}
            {activeTab === 'features' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {features.map((feature) => (
                                <tr key={feature.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{feature.position}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{feature.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {feature.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEditFeature(feature)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                                        <button onClick={() => handleDeleteFeature(feature.id)} className="text-red-600 hover:text-red-900">Hapus</button>
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