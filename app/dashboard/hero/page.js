// app/dashboard/hero/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

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
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Hero Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola konten hero dan fitur utama</p>
                    </div>
                    {activeTab === 'features' && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
                        >
                            {showForm ? 'Batal' : 'Tambah Feature'}
                        </button>
                    )}
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'content'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Hero Content
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'features'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Features
                    </button>
                </nav>
            </div>

            {/* Hero Content Form */}
            {activeTab === 'content' && (
                <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">Edit Hero Content</h2>
                    <form onSubmit={handleHeroSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={heroFormData.title}
                                onChange={(e) => setHeroFormData({ ...heroFormData, title: e.target.value })}
                                required
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Background Image URL</label>
                            <input
                                type="text"
                                value={heroFormData.background_image}
                                onChange={(e) => setHeroFormData({ ...heroFormData, background_image: e.target.value })}
                                required
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            {heroFormData.background_image && (
                                <img src={heroFormData.background_image} alt="Background Preview" className="mt-2 h-24 sm:h-32 rounded object-cover w-full sm:w-auto" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Right Image URL</label>
                            <input
                                type="text"
                                value={heroFormData.right_image}
                                onChange={(e) => setHeroFormData({ ...heroFormData, right_image: e.target.value })}
                                required
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            {heroFormData.right_image && (
                                <img src={heroFormData.right_image} alt="Right Image Preview" className="mt-2 h-24 sm:h-32 rounded object-cover w-full sm:w-auto" />
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
                <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
                        {editFeature ? 'Edit Feature' : 'Tambah Feature'}
                    </h2>
                    <form onSubmit={handleFeatureSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={featureFormData.title}
                                    onChange={(e) => setFeatureFormData({ ...featureFormData, title: e.target.value })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                                <input
                                    type="number"
                                    value={featureFormData.position}
                                    onChange={(e) => setFeatureFormData({ ...featureFormData, position: parseInt(e.target.value) })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                value={featureFormData.description}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, description: e.target.value })}
                                required
                                rows="3"
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Icon URL</label>
                            <input
                                type="text"
                                value={featureFormData.icon_url}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, icon_url: e.target.value })}
                                required
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            {featureFormData.icon_url && (
                                <img src={featureFormData.icon_url} alt="Icon Preview" className="mt-2 h-12 rounded" />
                            )}
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={featureFormData.is_active}
                                onChange={(e) => setFeatureFormData({ ...featureFormData, is_active: e.target.checked })}
                                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                            />
                            <label className="text-sm font-medium text-slate-700">Aktif</label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary">
                                {editFeature ? 'Update' : 'Simpan'}
                            </button>
                            <button type="button" onClick={resetFeatureForm} className="px-4 sm:px-6 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Desktop Table View - Features */}
            {activeTab === 'features' && (
                <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Position</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {features.map((feature) => (
                                    <tr key={feature.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{feature.position}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{feature.title}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{feature.description}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {feature.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEditFeature(feature)} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                                            <button onClick={() => handleDeleteFeature(feature.id)} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg hover:bg-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile Card View - Features */}
            {activeTab === 'features' && (
                <div className="lg:hidden space-y-4">
                    {features.map((feature) => (
                        <div key={feature.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-700 mb-1">{feature.title}</p>
                                    <p className="text-xs text-slate-500">Posisi: {feature.position}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {feature.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            
                            <div className="mb-3">
                                <p className="text-sm text-slate-700">{feature.description}</p>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditFeature(feature)} 
                                    className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteFeature(feature.id)} 
                                    className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State - Features */}
            {activeTab === 'features' && features.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-slate-700">Tidak ada feature yang tersedia</p>
                </div>
            )}
        </div>
    );
}