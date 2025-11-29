// app/dashboard/packages/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function PackagesManagementPage() {
    const supabase = createClient();
    const router = useRouter();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editPackage, setEditPackage] = useState(null);
    const [message, setMessage] = useState('');
    const [features, setFeatures] = useState(['']);

    const [formData, setFormData] = useState({
        package_id: '',
        name: '',
        description: '',
        price: 0,
        is_popular: false,
        is_special: false,
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
            // Fetch packages
            const { data: packagesData, error: packagesError } = await supabase
                .from('price_packages')
                .select('*')
                .order('position', { ascending: true });

            if (packagesError) throw packagesError;

            // Fetch all features
            const packageIds = packagesData.map(pkg => pkg.id);
            const { data: featuresData, error: featuresError } = await supabase
                .from('package_features')
                .select('*')
                .in('package_id', packageIds)
                .order('position', { ascending: true });

            if (featuresError) throw featuresError;

            // Combine packages with features
            const packagesWithFeatures = packagesData.map(pkg => ({
                ...pkg,
                features: featuresData.filter(f => f.package_id === pkg.id)
            }));

            setPackages(packagesWithFeatures);
        } catch (error) {
            console.error('Error fetching packages:', error);
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

            let packageId;

            if (editPackage) {
                // Update package
                const { error } = await supabase
                    .from('price_packages')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editPackage.id);

                if (error) throw error;
                packageId = editPackage.id;

                // Delete old features
                await supabase
                    .from('package_features')
                    .delete()
                    .eq('package_id', packageId);

                setMessage('Package berhasil diupdate!');
            } else {
                // Insert new package
                const { data: newPackage, error } = await supabase
                    .from('price_packages')
                    .insert([formData])
                    .select()
                    .single();

                if (error) throw error;
                packageId = newPackage.id;
                setMessage('Package berhasil ditambahkan!');
            }

            // Insert features
            const featuresToInsert = features
                .filter(f => f.trim() !== '')
                .map((feature, index) => ({
                    package_id: packageId,
                    feature_text: feature,
                    position: index + 1
                }));

            if (featuresToInsert.length > 0) {
                const { error: featuresError } = await supabase
                    .from('package_features')
                    .insert(featuresToInsert);

                if (featuresError) throw featuresError;
            }

            resetForm();
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving package:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const handleEdit = (pkg) => {
        setEditPackage(pkg);
        setFormData({
            package_id: pkg.package_id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            is_popular: pkg.is_popular,
            is_special: pkg.is_special,
            position: pkg.position,
            is_active: pkg.is_active
        });
        setFeatures(pkg.features.map(f => f.feature_text));
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus package ini? Features juga akan terhapus.')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menghapus item');
                return;
            }

            const { error } = await supabase
                .from('price_packages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessage('Package berhasil dihapus!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting package:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            package_id: '',
            name: '',
            description: '',
            price: 0,
            is_popular: false,
            is_special: false,
            position: 0,
            is_active: true
        });
        setFeatures(['']);
        setEditPackage(null);
        setShowForm(false);
    };

    const addFeature = () => {
        setFeatures([...features, '']);
    };

    const removeFeature = (index) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const updateFeature = (index, value) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
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
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Packages Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola paket harga dan fitur</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
                    >
                        {showForm ? 'Batal' : 'Tambah Package'}
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
                        {editPackage ? 'Edit Package' : 'Tambah Package'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Package ID (unique)</label>
                                <input
                                    type="text"
                                    value={formData.package_id}
                                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                                    required
                                    disabled={editPackage}
                                    placeholder="blog-portfolio"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                rows="2"
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Price (IDR)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    required
                                    min="0"
                                    step="1000"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                                <input
                                    type="number"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateFeature(index, e.target.value)}
                                        placeholder="Feature description"
                                        className="flex-1 px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="px-3 lg:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addFeature}
                                className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary text-sm"
                            >
                                + Tambah Feature
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_popular}
                                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                />
                                <span className="text-sm font-medium text-slate-700">Popular</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_special}
                                    onChange={(e) => setFormData({ ...formData, is_special: e.target.checked })}
                                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                />
                                <span className="text-sm font-medium text-slate-700">Special (Full Width)</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                />
                                <span className="text-sm font-medium text-slate-700">Active</span>
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary"
                            >
                                {editPackage ? 'Update' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 sm:px-6 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Position</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Features</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Tags</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {packages.map((pkg) => (
                                <tr key={pkg.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{pkg.position}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-700">{pkg.name}</div>
                                        <div className="text-sm text-slate-700">{pkg.description}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-700">
                                        {formatPrice(pkg.price)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        <ul className="list-disc list-inside">
                                            {pkg.features.slice(0, 3).map((f, i) => (
                                                <li key={i}>{f.feature_text}</li>
                                            ))}
                                            {pkg.features.length > 3 && <li>+{pkg.features.length - 3} more...</li>}
                                        </ul>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {pkg.is_popular && <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 mr-1">Popular</span>}
                                        {pkg.is_special && <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Special</span>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(pkg)} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                                        <button onClick={() => handleDelete(pkg.id)} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-700 mb-1">{pkg.name}</p>
                                <p className="text-xs text-slate-500">Posisi: {pkg.position}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                                <div className="flex gap-1">
                                    {pkg.is_popular && <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Popular</span>}
                                    {pkg.is_special && <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Special</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <p className="text-sm text-slate-700 mb-2">{pkg.description}</p>
                            <p className="text-lg font-bold text-slate-700">{formatPrice(pkg.price)}</p>
                        </div>

                        <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Features:</p>
                            <ul className="list-disc list-inside text-sm text-slate-700">
                                {pkg.features.slice(0, 2).map((f, i) => (
                                    <li key={i}>{f.feature_text}</li>
                                ))}
                                {pkg.features.length > 2 && <li>+{pkg.features.length - 2} more...</li>}
                            </ul>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(pkg)} 
                                className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(pkg.id)} 
                                className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {packages.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-slate-700">Tidak ada package yang tersedia</p>
                </div>
            )}
        </div>
    );
}