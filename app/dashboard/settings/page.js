// app/dashboard/settings/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import HeroLottie from '@/components/HeroLottie';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // UI States
  const [activeTab, setActiveTab] = useState('site');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Site Settings State
  const [settings, setSettings] = useState({});

  // Hero State
  const [heroContent, setHeroContent] = useState(null);
  const [heroFormData, setHeroFormData] = useState({ title: '', background_image: '', right_image: '' });
  const [features, setFeatures] = useState([]);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editFeature, setEditFeature] = useState(null);
  const [featureFormData, setFeatureFormData] = useState({ title: '', description: '', icon_url: '', position: 0, is_active: true });

  // Navigation State
  const [navItems, setNavItems] = useState([]);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [editNavItem, setEditNavItem] = useState(null);
  const [navFormData, setNavFormData] = useState({ label: '', href: '', position: 0, is_active: true });

  const [footerLinks, setFooterLinks] = useState([]);
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);
  const [editFooterItem, setEditFooterItem] = useState(null);
  const [footerFormData, setFooterFormData] = useState({ category: 'naia', label: '', href: '', position: 0, is_active: true });

  const [socialLinks, setSocialLinks] = useState([]);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editSocialItem, setEditSocialItem] = useState(null);
  const [socialFormData, setSocialFormData] = useState({ name: '', href: '', icon_svg: '', position: 0, is_active: true });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [settingsRes, heroRes, featuresRes, navRes, footerRes, socialRes] = await Promise.all([
        supabase.from('site_settings').select('*'),
        supabase.from('hero_content').select('*').single(),
        supabase.from('hero_features').select('*').order('position'),
        supabase.from('navigation_items').select('*').order('position'),
        supabase.from('footer_links').select('*').order('category, position'),
        supabase.from('social_links').select('*').order('position')
      ]);

      // Process settings
      if (settingsRes.data) {
        const settingsObj = {};
        settingsRes.data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        setSettings(settingsObj);
      }

      // Hero
      if (heroRes.data) {
        setHeroContent(heroRes.data);
        setHeroFormData({
          title: heroRes.data.title,
          background_image: heroRes.data.background_image,
          right_image: heroRes.data.right_image
        });
      }
      if (featuresRes.data) setFeatures(featuresRes.data);

      // Navigation
      if (navRes.data) setNavItems(navRes.data);
      if (footerRes.data) setFooterLinks(footerRes.data);
      if (socialRes.data) setSocialLinks(socialRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Error loading data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Settings handlers
  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
      }
      await fetch('/api/revalidate', { method: 'POST' });
      showMessage('Settings saved!');
      router.refresh();
    } catch (error) {
      showMessage('Error: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Hero handlers
  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('hero_content').update({ ...heroFormData, updated_at: new Date().toISOString() }).eq('id', heroContent.id);
      if (error) throw error;
      showMessage('Hero content updated');
      router.refresh();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...featureFormData, updated_at: new Date().toISOString() };
      if (editFeature) await supabase.from('hero_features').update(dataToSave).eq('id', editFeature.id);
      else await supabase.from('hero_features').insert([dataToSave]);
      showMessage('Feature saved');
      closeFeatureModal();
      fetchAllData();
      router.refresh();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (id) => {
    if (!confirm('Delete feature?')) return;
    await supabase.from('hero_features').delete().eq('id', id);
    fetchAllData();
    showMessage('Feature deleted');
  };

  const openCreateFeatureModal = () => { setEditFeature(null); setFeatureFormData({ title: '', description: '', icon_url: '', position: features.length + 1, is_active: true }); setIsFeatureModalOpen(true); };
  const openEditFeatureModal = (item) => { setEditFeature(item); setFeatureFormData(item); setIsFeatureModalOpen(true); };
  const closeFeatureModal = () => setIsFeatureModalOpen(false);

  // Navigation handlers
  const handleNavSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...navFormData, updated_at: new Date().toISOString() };
      if (editNavItem) await supabase.from('navigation_items').update(dataToSave).eq('id', editNavItem.id);
      else await supabase.from('navigation_items').insert([dataToSave]);
      showMessage('Menu item saved!');
      closeNavModal();
      fetchAllData();
      await fetch('/api/revalidate', { method: 'POST' });
      router.refresh();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNav = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await supabase.from('navigation_items').delete().eq('id', id);
    fetchAllData();
    showMessage('Item deleted');
  };

  const openCreateNavModal = () => { setEditNavItem(null); setNavFormData({ label: '', href: '', position: navItems.length + 1, is_active: true }); setIsNavModalOpen(true); };
  const openEditNavModal = (item) => { setEditNavItem(item); setNavFormData(item); setIsNavModalOpen(true); };
  const closeNavModal = () => setIsNavModalOpen(false);

  // Footer handlers
  const handleFooterSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...footerFormData, updated_at: new Date().toISOString() };
      if (editFooterItem) await supabase.from('footer_links').update(dataToSave).eq('id', editFooterItem.id);
      else await supabase.from('footer_links').insert([dataToSave]);
      showMessage('Footer link saved!');
      closeFooterModal();
      fetchAllData();
      router.refresh();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFooter = async (id) => {
    if (!confirm('Delete this footer link?')) return;
    await supabase.from('footer_links').delete().eq('id', id);
    fetchAllData();
    showMessage('Item deleted');
  };

  const openCreateFooterModal = () => { setEditFooterItem(null); setFooterFormData({ category: 'naia', label: '', href: '', position: footerLinks.length + 1, is_active: true }); setIsFooterModalOpen(true); };
  const openEditFooterModal = (item) => { setEditFooterItem(item); setFooterFormData(item); setIsFooterModalOpen(true); };
  const closeFooterModal = () => setIsFooterModalOpen(false);

  // Social handlers
  const handleSocialSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...socialFormData, updated_at: new Date().toISOString() };
      if (editSocialItem) await supabase.from('social_links').update(dataToSave).eq('id', editSocialItem.id);
      else await supabase.from('social_links').insert([dataToSave]);
      showMessage('Social link saved!');
      closeSocialModal();
      fetchAllData();
      router.refresh();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSocial = async (id) => {
    if (!confirm('Delete this social link?')) return;
    await supabase.from('social_links').delete().eq('id', id);
    fetchAllData();
    showMessage('Item deleted');
  };

  const openCreateSocialModal = () => { setEditSocialItem(null); setSocialFormData({ name: '', href: '', icon_svg: '', position: socialLinks.length + 1, is_active: true }); setIsSocialModalOpen(true); };
  const openEditSocialModal = (item) => { setEditSocialItem(item); setSocialFormData(item); setIsSocialModalOpen(true); };
  const closeSocialModal = () => setIsSocialModalOpen(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LogoPathAnimation />
      </div>
    );
  }

  const tabs = [
    { id: 'site', label: 'Site Settings', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
    { id: 'cta', label: 'CTA & WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'meta', label: 'SEO & Meta', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'hero', label: 'Hero Section', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'features', label: 'Hero Features', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'menu', label: 'Main Menu', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'footer', label: 'Footer Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'social', label: 'Social Media', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb />
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-2">Website Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage all website configuration in one place</p>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1 sticky top-20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[500px] animate-fade-in-up">

          {/* Site Settings */}
          {activeTab === 'site' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Site Settings</h2>
              <div className="grid gap-5">
                <FormInput label="Site Title" value={settings.site_title || ''} onChange={(v) => handleChange('site_title', v)} />
                <FormTextarea label="Site Description" value={settings.site_description || ''} onChange={(v) => handleChange('site_description', v)} rows={3} />
                <FormInput label="Logo URL" value={settings.logo_url || ''} onChange={(v) => handleChange('logo_url', v)} />
                {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="h-12 object-contain" />}
                <FormInput label="Footer Text" value={settings.footer_text || ''} onChange={(v) => handleChange('footer_text', v)} />
                <FormInput label="Site URL" value={settings.site_url || ''} onChange={(v) => handleChange('site_url', v)} />
                <FormInput label="Company Phone" value={settings.company_phone || ''} onChange={(v) => handleChange('company_phone', v)} />
              </div>
              <SaveButton onClick={handleSaveSettings} saving={saving} />
            </div>
          )}

          {/* CTA Settings */}
          {activeTab === 'cta' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">CTA & WhatsApp Settings</h2>
              <div className="grid gap-5">
                <FormInput label="CTA Title" value={settings.cta_title || ''} onChange={(v) => handleChange('cta_title', v)} />
                <FormTextarea label="CTA Subtitle" value={settings.cta_subtitle || ''} onChange={(v) => handleChange('cta_subtitle', v)} rows={2} />
                <FormInput label="CTA Background Image URL" value={settings.cta_background_image || ''} onChange={(v) => handleChange('cta_background_image', v)} />
                {settings.cta_background_image && <img src={settings.cta_background_image} alt="CTA BG" className="h-24 rounded object-cover" />}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormInput label="WhatsApp Button Text" value={settings.cta_button_text || ''} onChange={(v) => handleChange('cta_button_text', v)} />
                  <FormInput label="Portfolio Button Text" value={settings.cta_button_portfolio_text || ''} onChange={(v) => handleChange('cta_button_portfolio_text', v)} />
                </div>
                <FormInput label="WhatsApp Number (with country code)" value={settings.whatsapp_number || ''} onChange={(v) => handleChange('whatsapp_number', v)} placeholder="6281234567890" />
                <FormTextarea label="WhatsApp Default Message" value={settings.whatsapp_message || ''} onChange={(v) => handleChange('whatsapp_message', v)} rows={2} />
              </div>
              <SaveButton onClick={handleSaveSettings} saving={saving} />
            </div>
          )}

          {/* Meta & SEO */}
          {activeTab === 'meta' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">SEO & Meta Settings</h2>
              <div className="grid gap-5">
                <FormTextarea label="Meta Keywords (comma separated)" value={settings.meta_keywords || ''} onChange={(v) => handleChange('meta_keywords', v)} rows={2} />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormInput label="Google Verification" value={settings.google_verification || ''} onChange={(v) => handleChange('google_verification', v)} />
                  <FormInput label="Ahrefs Verification" value={settings.meta_ahrefs_verification || ''} onChange={(v) => handleChange('meta_ahrefs_verification', v)} />
                  <FormInput label="Yandex Verification" value={settings.meta_yandex_verification || ''} onChange={(v) => handleChange('meta_yandex_verification', v)} />
                  <FormInput label="Bing Verification" value={settings.meta_bing_verification || ''} onChange={(v) => handleChange('meta_bing_verification', v)} />
                </div>
              </div>
              <SaveButton onClick={handleSaveSettings} saving={saving} />
            </div>
          )}

          {/* Hero Content */}
          {activeTab === 'hero' && (
            <form onSubmit={handleHeroSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Hero Banner Content</h2>
              <FormInput label="Headline Title" value={heroFormData.title} onChange={(v) => setHeroFormData({ ...heroFormData, title: v })} required />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <FormInput label="Background Image/Lottie" value={heroFormData.background_image} onChange={(v) => setHeroFormData({ ...heroFormData, background_image: v })} />
                  <div className="h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    {heroFormData.background_image ? (heroFormData.background_image.endsWith('.json') ? <HeroLottie src={heroFormData.background_image} className="w-full h-full object-cover" /> : <img src={heroFormData.background_image} className="w-full h-full object-cover" />) : <span className="text-slate-400">No Preview</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  <FormInput label="Right Image/Lottie" value={heroFormData.right_image} onChange={(v) => setHeroFormData({ ...heroFormData, right_image: v })} />
                  <div className="h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    {heroFormData.right_image ? (heroFormData.right_image.endsWith('.json') ? <HeroLottie src={heroFormData.right_image} className="w-full h-full object-contain p-4" /> : <img src={heroFormData.right_image} className="w-full h-full object-contain p-4" />) : <span className="text-slate-400">No Preview</span>}
                  </div>
                </div>
              </div>
              <SaveButton type="submit" saving={saving} />
            </form>
          )}

          {/* Hero Features */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Hero Feature Cards</h2>
                <button onClick={openCreateFeatureModal} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800">Add Feature</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map(item => (
                  <div key={item.id} className="p-5 rounded-xl border border-slate-100 hover:shadow-lg transition group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        {item.icon_url ? <img src={item.icon_url} className="w-6 h-6" /> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                      <span className="text-xs font-bold text-slate-400">Pos: {item.position}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => openEditFeatureModal(item)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteFeature(item.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg"><svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Menu */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Main Menu Items</h2>
                <button onClick={openCreateNavModal} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800">Add Menu</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {navItems.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-lg transition flex justify-between items-center group">
                    <div>
                      <h3 className="font-bold text-slate-800">{item.label}</h3>
                      <p className="text-sm text-slate-500">{item.href}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-2 inline-block ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEditNavModal(item)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDeleteNav(item.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg"><svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Links */}
          {activeTab === 'footer' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Footer Links</h2>
                <button onClick={openCreateFooterModal} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800">Add Link</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {footerLinks.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-lg transition group">
                    <span className="text-xs font-bold uppercase text-indigo-500 mb-1 block">{item.category}</span>
                    <h3 className="font-bold text-slate-800">{item.label}</h3>
                    <p className="text-sm text-slate-500 truncate">{item.href}</p>
                    <div className="flex justify-between items-end mt-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => openEditFooterModal(item)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteFooter(item.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg"><svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Social Media Links</h2>
                <button onClick={openCreateSocialModal} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800">Add Social</button>
              </div>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {socialLinks.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-lg transition flex flex-col items-center text-center group relative">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center mb-3" dangerouslySetInnerHTML={{ __html: item.icon_svg }} />
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline truncate w-full block mb-2">{item.href}</a>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEditSocialModal(item)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg"><svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDeleteSocial(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg"><svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Feature Modal */}
      {isFeatureModalOpen && (
        <Modal title={editFeature ? 'Edit Feature' : 'Add Feature'} onClose={closeFeatureModal}>
          <form onSubmit={handleFeatureSubmit} className="space-y-4">
            <FormInput label="Title" value={featureFormData.title} onChange={(v) => setFeatureFormData({ ...featureFormData, title: v })} required />
            <FormTextarea label="Description" value={featureFormData.description} onChange={(v) => setFeatureFormData({ ...featureFormData, description: v })} rows={3} required />
            <FormInput label="Icon URL" value={featureFormData.icon_url} onChange={(v) => setFeatureFormData({ ...featureFormData, icon_url: v })} placeholder="https://" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Position" type="number" value={featureFormData.position} onChange={(v) => setFeatureFormData({ ...featureFormData, position: parseInt(v) })} required />
              <div className="flex items-center pt-8">
                <input type="checkbox" id="feat-active" checked={featureFormData.is_active} onChange={(e) => setFeatureFormData({ ...featureFormData, is_active: e.target.checked })} className="w-5 h-5 text-slate-900 rounded" />
                <label htmlFor="feat-active" className="ml-2 text-sm font-bold text-slate-700">Active</label>
              </div>
            </div>
            <ModalSubmitButton saving={saving} label={editFeature ? 'Update' : 'Create'} />
          </form>
        </Modal>
      )}

      {/* Nav Modal */}
      {isNavModalOpen && (
        <Modal title={editNavItem ? 'Edit Menu' : 'Add Menu'} onClose={closeNavModal}>
          <form onSubmit={handleNavSubmit} className="space-y-4">
            <FormInput label="Label" value={navFormData.label} onChange={(v) => setNavFormData({ ...navFormData, label: v })} placeholder="Home" required />
            <FormInput label="Link (Href)" value={navFormData.href} onChange={(v) => setNavFormData({ ...navFormData, href: v })} placeholder="/" required />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Position" type="number" value={navFormData.position} onChange={(v) => setNavFormData({ ...navFormData, position: parseInt(v) })} required />
              <div className="flex items-center pt-8">
                <input type="checkbox" id="nav-active" checked={navFormData.is_active} onChange={(e) => setNavFormData({ ...navFormData, is_active: e.target.checked })} className="w-5 h-5 text-slate-900 rounded" />
                <label htmlFor="nav-active" className="ml-2 text-sm font-bold text-slate-700">Active</label>
              </div>
            </div>
            <ModalSubmitButton saving={saving} label={editNavItem ? 'Update' : 'Create'} />
          </form>
        </Modal>
      )}

      {/* Footer Modal */}
      {isFooterModalOpen && (
        <Modal title={editFooterItem ? 'Edit Footer Link' : 'Add Footer Link'} onClose={closeFooterModal}>
          <form onSubmit={handleFooterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select value={footerFormData.category} onChange={(e) => setFooterFormData({ ...footerFormData, category: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="naia">Naia</option>
                <option value="products">Products</option>
                <option value="resources">Resources</option>
                <option value="support">Support</option>
              </select>
            </div>
            <FormInput label="Label" value={footerFormData.label} onChange={(v) => setFooterFormData({ ...footerFormData, label: v })} required />
            <FormInput label="Link (Href)" value={footerFormData.href} onChange={(v) => setFooterFormData({ ...footerFormData, href: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Position" type="number" value={footerFormData.position} onChange={(v) => setFooterFormData({ ...footerFormData, position: parseInt(v) })} required />
              <div className="flex items-center pt-8">
                <input type="checkbox" id="footer-active" checked={footerFormData.is_active} onChange={(e) => setFooterFormData({ ...footerFormData, is_active: e.target.checked })} className="w-5 h-5 text-slate-900 rounded" />
                <label htmlFor="footer-active" className="ml-2 text-sm font-bold text-slate-700">Active</label>
              </div>
            </div>
            <ModalSubmitButton saving={saving} label={editFooterItem ? 'Update' : 'Create'} />
          </form>
        </Modal>
      )}

      {/* Social Modal */}
      {isSocialModalOpen && (
        <Modal title={editSocialItem ? 'Edit Social Link' : 'Add Social Link'} onClose={closeSocialModal}>
          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <FormInput label="Name" value={socialFormData.name} onChange={(v) => setSocialFormData({ ...socialFormData, name: v })} placeholder="Facebook" required />
            <FormInput label="Link (Href)" value={socialFormData.href} onChange={(v) => setSocialFormData({ ...socialFormData, href: v })} required />
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">SVG Icon</label>
              <textarea value={socialFormData.icon_svg} onChange={(e) => setSocialFormData({ ...socialFormData, icon_svg: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50 font-mono text-xs" rows={3} placeholder="<svg>...</svg>"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Position" type="number" value={socialFormData.position} onChange={(v) => setSocialFormData({ ...socialFormData, position: parseInt(v) })} required />
              <div className="flex items-center pt-8">
                <input type="checkbox" id="social-active" checked={socialFormData.is_active} onChange={(e) => setSocialFormData({ ...socialFormData, is_active: e.target.checked })} className="w-5 h-5 text-slate-900 rounded" />
                <label htmlFor="social-active" className="ml-2 text-sm font-bold text-slate-700">Active</label>
              </div>
            </div>
            <ModalSubmitButton saving={saving} label={editSocialItem ? 'Update' : 'Create'} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// Helper Components
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const FormInput = ({ label, value, onChange, type = "text", placeholder, required = false }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" placeholder={placeholder} required={required} />
  </div>
);

const FormTextarea = ({ label, value, onChange, rows = 3, required = false }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" required={required}></textarea>
  </div>
);

const SaveButton = ({ onClick, saving, type = "button" }) => (
  <div className="pt-4 border-t border-slate-100">
    <button type={type} onClick={type === "button" ? onClick : undefined} disabled={saving} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 transition shadow-lg shadow-slate-200">
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
);

const ModalSubmitButton = ({ saving, label }) => (
  <div className="pt-4 border-t border-slate-100">
    <button type="submit" disabled={saving} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 transition shadow-lg shadow-slate-200">
      {saving ? 'Saving...' : label}
    </button>
  </div>
);