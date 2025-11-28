// app/briefing/BriefingForm.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const packages = {
  // ... (salin seluruh objek packages dari kode Anda)
};

const BriefingForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  const [selectedPackage, setSelectedPackage] = useState(null);
  // ... (salin seluruh state dan fungsi lainnya dari kode Anda)

  useEffect(() => {
    if (packageId && packages[packageId]) {
      setSelectedPackage(packages[packageId]);
    }
  }, [packageId]);

  // ... (salin seluruh fungsi handleChange, validateForm, dll)

  if (!selectedPackage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Paket tidak ditemukan</h2>
          <button 
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primarys transition"
            onClick={() => router.push('/')}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ... (salin seluruh return JSX dari kode Anda)
};

export default BriefingForm;