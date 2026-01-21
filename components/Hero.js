'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useLanguage } from '@/lib/LanguageContext';
import HeroLottie from './HeroLottie';

export default function Hero() {
  const supabase = createClient();
  const { language } = useLanguage();
  const [heroData, setHeroData] = useState(null);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: heroRes } = await supabase
        .from('hero_content')
        .select('*')
        .single();

      const { data: featuresRes } = await supabase
        .from('hero_features')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      setHeroData(heroRes);
      setFeatures(featuresRes || []);
    };

    fetchData();
  }, []);

  const hero = heroData || {
    title_id: 'Transformasi Blogspot Anda Menjadi Website Premium',
    title_en: 'Transform Your Blogspot Into a Premium Website',
    background_image: '',
    right_image: ''
  };

  const heroTitle = language === 'id'
    ? (hero.title_id || hero.title || hero.title_en)
    : (hero.title_en || hero.title || hero.title_id);

  const lottieSource = hero.background_image?.endsWith('.json')
    ? hero.background_image
    : (hero.right_image?.endsWith('.json') ? hero.right_image : null);

  return (
    <section
      id="hero-section"
      className="mx-4 rounded-b-3xl bg-primary md:min-h-screen relative overflow-hidden bg-center bg-cover"
      style={{ backgroundImage: `url('${hero.background_image}')` }}
    >
      <div className="pt-16 md:pt-32 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center">
        <div className="w-full md:w-7/12 p-8 md:pb-24 sm:pb-8">
          <h1 className="font-bold text-3xl text-white mb-5 md:text-6xl leading-[50px]">
            {heroTitle}
          </h1>

          <div className="hidden md:block mt-6 sm:mt-16 space-y-6">
            {features.map((feature) => {
              const featureTitle = language === 'id'
                ? (feature.title_id || feature.title || feature.title_en)
                : (feature.title_en || feature.title || feature.title_id);
              const featureDesc = language === 'id'
                ? (feature.description_id || feature.description || feature.description_en)
                : (feature.description_en || feature.description || feature.description_id);

              return (
                <div
                  key={feature.id}
                  className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-3 bg-primary rounded-full shadow-lg hover:scale-110 transform transition duration-300">
                    <img
                      alt={featureTitle}
                      className="w-10 brightness-0 invert opacity-90"
                      src={feature.icon_url}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-700">{featureTitle}</h3>
                    <p className="text-slate-700 text-sm">{featureDesc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-5/12 relative p-4">
          <div className="absolute inset-0 transform hover:scale-105 transition-transform duration-300"></div>
          {lottieSource ? (
            <HeroLottie src={lottieSource} className="w-full h-full" />
          ) : (
            <img
              alt="Desain Orisinil"
              className="relative object-cover w-full h-full transition duration-500 hover:rotate-2 hover:scale-110 rounded-lg"
              src={hero.right_image}
            />
          )}
        </div>
      </div>
    </section>
  );
}

