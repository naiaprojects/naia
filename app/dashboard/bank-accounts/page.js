// app/dashboard/bank-accounts/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function BankAccountsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        account_holder: '',
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
            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;
            setBankAccounts(data || []);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
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

            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString()
            };

            if (editItem) {
                const { error } = await supabase
                    .from('bank_accounts')
                    .update(dataToSave)
                    .eq('id', editItem.id);

                if (error) throw error;
                setMessage('Bank account berhasil diupdate!');
            } else {
                const { error } = await supabase
                    .from('bank_accounts')
                    .insert([dataToSave]);

                if (error) throw error;
                setMessage('Bank account berhasil ditambahkan!');
            }

            resetForm();
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving bank account:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            bank_name: item.bank_name,
            account_number: item.account_number,
            account_holder: item.account_holder,
            position: item.position,
            is_active: item.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus bank account ini?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menghapus item');
                return;
            }

            const { error } = await supabase
                .from('bank_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessage('Bank account berhasil dihapus!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting bank account:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            bank_name: '',
            account_number: '',
            account_holder: '',
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
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Bank Accounts Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola informasi rekening bank untuk pembayaran</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
                    >
                        {showForm ? 'Batal' : 'Tambah Bank Account'}
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
                        {editItem ? 'Edit Bank Account' : 'Tambah Bank Account'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    required
                                    placeholder="BCA, Mandiri, BNI, dll"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    required
                                    placeholder="1234567890"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Account Holder</label>
                                <input
                                    type="text"
                                    value={formData.account_holder}
                                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                    required
                                    placeholder="PT Naia Grafika"
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

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                            />
                            <label className="text-sm font-medium text-slate-700">Active</label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary"
                            >
                                {editItem ? 'Update' : 'Simpan'}
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Bank Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Account Number</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Account Holder</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {bankAccounts.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.position}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.bank_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.account_number}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.account_holder}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(item)} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {bankAccounts.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="font-semibold text-slate-700">{item.bank_name}</p>
                                <p className="text-sm text-slate-700">No. Rekening: {item.account_number}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Pemegang Rekening:</span>
                                <span className="font-medium text-slate-700">{item.account_holder}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Posisi:</span>
                                <span className="font-medium text-slate-700">{item.position}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(item)} 
                                className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)} 
                                className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {bankAccounts.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-slate-700">Tidak ada bank account yang tersedia</p>
                </div>
            )}
        </div>
    );
}