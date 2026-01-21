'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';



export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Modal states
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [lastUpdateTime, setLastUpdateTime] = useState(0);
    const COOLDOWN_PERIOD = 5000;

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            setFormData(prev => ({
                ...prev,
                email: user.email,
                phone: user.phone || ''
            }));
        }
        setLoading(false);
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();

        const now = Date.now();
        if (now - lastUpdateTime < COOLDOWN_PERIOD) {
            const remainingTime = Math.ceil((COOLDOWN_PERIOD - (now - lastUpdateTime)) / 1000);
            showMessage(`Mohon tunggu ${remainingTime} detik sebelum mencoba lagi.`, 'error');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: formData.email });
            if (error) {
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                    throw new Error('Terlalu banyak permintaan. Silakan tunggu beberapa saat dan coba lagi.');
                }
                throw error;
            }
            setLastUpdateTime(Date.now());
            showMessage('Permintaan update email berhasil. Silakan cek email baru Anda untuk konfirmasi.');
            setIsEmailModalOpen(false);
            await fetchUser();
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePhone = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ phone: formData.phone });
            if (error) throw error;
            showMessage('Phone number updated successfully');
            setIsPhoneModalOpen(false);
            fetchUser(); // Refresh user data
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        if (formData.newPassword.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
            if (error) throw error;
            showMessage('Password updated successfully');
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
            setIsPasswordModalOpen(false);
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEmailModal = () => {
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
        setIsEmailModalOpen(true);
    };

    const openPhoneModal = () => {
        setFormData(prev => ({ ...prev, phone: user?.phone || '' }));
        setIsPhoneModalOpen(true);
    };

    const openPasswordModal = () => {
        setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setIsPasswordModalOpen(true);
    };

    // Get display name from user metadata
    const displayName = user?.user_metadata?.display_name || user?.raw_user_meta_data?.display_name || 'Admin';

    // Format phone number for display
    const formatPhone = (phone) => {
        if (!phone) return '-';
        return phone;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Breadcrumb />
                <h1 className="text-2xl font-bold text-slate-800 mt-2">Profile Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account settings and security</p>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-800">Account Information</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                            {displayName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{displayName}</p>
                            <p className="text-slate-500">{user?.email}</p>
                        </div>
                    </div>
                    <div className="grid gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Email</span>
                            <span className="text-slate-800">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Phone</span>
                            <span className="text-slate-800">{formatPhone(user?.phone)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">User ID</span>
                            <span className="text-slate-800 font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Last Sign In</span>
                            <span className="text-slate-800">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-slate-500">Account Created</span>
                            <span className="text-slate-800">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                        <button
                            onClick={openEmailModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Update Email
                        </button>
                        <button
                            onClick={openPhoneModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Update Phone
                        </button>
                        <button
                            onClick={openPasswordModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Update Email</h3>
                                <p className="text-sm text-slate-500 mt-1">Change your account email address</p>
                            </div>
                            <button onClick={() => setIsEmailModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateEmail} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">New Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                                    placeholder="Enter new email"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                A confirmation link will be sent to your new email address. You'll need to click the link to complete the change.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || formData.email === user?.email}
                                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Update Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Phone Modal */}
            {isPhoneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Update Phone</h3>
                                <p className="text-sm text-slate-500 mt-1">Change your phone number</p>
                            </div>
                            <button onClick={() => setIsPhoneModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdatePhone} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                                    placeholder="+6281234567890"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Enter your phone number with country code (e.g., +62 for Indonesia).
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPhoneModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || formData.phone === user?.phone}
                                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Update Phone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Change Password</h3>
                                <p className="text-sm text-slate-500 mt-1">Update your account password</p>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Password must be at least 6 characters long.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
