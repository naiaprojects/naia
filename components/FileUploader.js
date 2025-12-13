// components/FileUploader.js
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function FileUploader({
    bucket = 'settings',
    folder = '',
    label,
    value,
    onChange,
    accept = "image/*",
    helperText
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const supabase = createClient();

    const handleUpload = async (event) => {
        try {
            setUploading(true);
            setError(null);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            onChange(data.publicUrl);

        } catch (error) {
            setError(error.message);
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
                {label}
            </label>

            <div className="flex items-start gap-4">
                {/* Preview Area */}
                <div className="shrink-0">
                    {value ? (
                        <div className="relative group w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-full object-contain p-2"
                            />
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                            <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold">No Image</span>
                        </div>
                    )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                    <input
                        type="file"
                        id={`file-${label}`}
                        accept={accept}
                        onChange={handleUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-bold
              file:bg-slate-900 file:text-white
              hover:file:bg-slate-700
              disabled:opacity-50 cursor-pointer"
                    />
                    {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
                    {uploading && <p className="text-xs text-indigo-500 font-bold animate-pulse">Uploading...</p>}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
}
