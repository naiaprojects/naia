// app/dashboard/bank-accounts/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

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
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Bank Accounts Management</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                    {showForm ? 'Batal' : 'Tambah Bank Account'}
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editItem ? 'Edit Bank Account' : 'Tambah Bank Account'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                            <input
                                type="text"
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                required
                                placeholder="BCA, Mandiri, BNI, dll"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                            <input
                                type="text"
                                value={formData.account_number}
                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                required
                                placeholder="1234567890"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                            <input
                                type="text"
                                value={formData.account_holder}
                                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                required
                                placeholder="PT Naia Grafika"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
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
                            <label className="text-sm font-medium text-gray-700">Active</label>
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

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Holder</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bankAccounts.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.position}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.bank_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.account_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.account_holder}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}