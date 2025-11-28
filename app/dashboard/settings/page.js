// app/dashboard/settings/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('site');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuthAndFetchSettings();
  }, []);

  const checkAuthAndFetchSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setMessage('Error: Session tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    await fetchSettings();
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      const settingsObj = {};
      data.forEach(item => {
        settingsObj[item.key] = item.value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage('Error: Anda harus login untuk menyimpan pengaturan');
        setSaving(false);
        return;
      }

      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) {
          console.error('Upsert error:', error);
          throw error;
        }
      }

      await fetch('/api/revalidate', { method: 'POST' });

      setMessage('Settings berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);

      router.refresh();

    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-full">
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('site')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'site'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Site Settings
          </button>
          <button
            onClick={() => setActiveTab('cta')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cta'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            CTA Settings
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'meta'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Meta & SEO
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Site Settings Tab */}
        {activeTab === 'site' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
              <input
                type="text"
                value={settings.site_title || ''}
                onChange={(e) => handleChange('site_title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
              <textarea
                value={settings.site_description || ''}
                onChange={(e) => handleChange('site_description', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input
                type="text"
                value={settings.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo Preview" className="mt-2 h-12" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
              <input
                type="text"
                value={settings.footer_text || ''}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
              <input
                type="text"
                value={settings.site_url || ''}
                onChange={(e) => handleChange('site_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
              <input
                type="text"
                value={settings.company_phone || ''}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* CTA Settings Tab */}
        {activeTab === 'cta' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Title</label>
              <input
                type="text"
                value={settings.cta_title || ''}
                onChange={(e) => handleChange('cta_title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Subtitle</label>
              <textarea
                value={settings.cta_subtitle || ''}
                onChange={(e) => handleChange('cta_subtitle', e.target.value)}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Background Image URL</label>
              <input
                type="text"
                value={settings.cta_background_image || ''}
                onChange={(e) => handleChange('cta_background_image', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {settings.cta_background_image && (
                <img src={settings.cta_background_image} alt="CTA BG Preview" className="mt-2 h-24 rounded" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text (WhatsApp)</label>
              <input
                type="text"
                value={settings.cta_button_text || ''}
                onChange={(e) => handleChange('cta_button_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text (Portfolio)</label>
              <input
                type="text"
                value={settings.cta_button_portfolio_text || ''}
                onChange={(e) => handleChange('cta_button_portfolio_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number (with country code)</label>
              <input
                type="text"
                value={settings.whatsapp_number || ''}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                placeholder="6281234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Default Message</label>
              <textarea
                value={settings.whatsapp_message || ''}
                onChange={(e) => handleChange('whatsapp_message', e.target.value)}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Meta & SEO Tab */}
        {activeTab === 'meta' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords (pisahkan dengan koma)</label>
              <textarea
                value={settings.meta_keywords || ''}
                onChange={(e) => handleChange('meta_keywords', e.target.value)}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Search Engine Verification</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Verification Code</label>
                  <input
                    type="text"
                    value={settings.google_verification || ''}
                    onChange={(e) => handleChange('google_verification', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ahrefs Verification</label>
                  <input
                    type="text"
                    value={settings.meta_ahrefs_verification || ''}
                    onChange={(e) => handleChange('meta_ahrefs_verification', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yandex Verification</label>
                  <input
                    type="text"
                    value={settings.meta_yandex_verification || ''}
                    onChange={(e) => handleChange('meta_yandex_verification', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bing/MSN Verification</label>
                  <input
                    type="text"
                    value={settings.meta_bing_verification || ''}
                    onChange={(e) => handleChange('meta_bing_verification', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-6 mt-6 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}