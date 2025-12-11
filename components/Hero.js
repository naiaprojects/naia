// components/Hero.js
import { createClient } from '@/lib/supabase-server';
import HeroLottie from './HeroLottie';

export const dynamic = 'force-dynamic';

export default async function Hero() {
  const supabase = createClient();

  // Fetch hero content
  const { data: heroData } = await supabase
    .from('hero_content')
    .select('*')
    .single();

  // Fetch hero features
  const { data: features } = await supabase
    .from('hero_features')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  const hero = heroData || {
    title: 'Transform Your Blogspot Into a Premium Website',
    background_image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQURFZv63UernQRlg8fAFzNp6fn7ugpbKDDhbothv6W-s6p8-CRV3YakUJkwfi07mfDcVJxTwYgf_5O88U5YByKEx1W-tE5z8Kkk8V5ExtcGbWgn0hFU6FTp5Eg1lFstjPp8aX33MgPs6XJd3TcysXZ5UIuLy2VtNq6aPAWakWe2BFcEL7Je0GkGI_744/s1920/19381187_6125995.webp',
    right_image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimRipe1eBeaGjLIafhSbzS2433hUKOOcMvH9WZwP7f6BpattbInLQaMu5u5ewGKwWF6T0EV_PkGOvGRvAefBXmIFVx3usVU62LHaQj7KQvXmMJwd9ipsOpLu80HFnqW8YsA9uryWc5ECGsTV3eETAuEFQDgShwZjC2-pVadbfpP2wjvyqjJ6HhLl3hBCU/s1600/HeroBg.webp'
  };

  const lottieSource = hero.background_image?.endsWith('.json')
    ? hero.background_image
    : (hero.right_image?.endsWith('.json') ? hero.right_image : null);

  return (
    <section
      id="hero-section"
      className="mx-4 rounded-b-3xl bg-primary min-h-screen relative overflow-hidden bg-center bg-cover" style={{ backgroundImage: `url('${hero.background_image}')` }}
    >
      <div className="pt-16 md:pt-32 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center">
        {/* Left Content */}
        <div className="w-full md:w-7/12 p-8 md:pb-24 sm:pb-8">
          <h1 className="font-bold text-3xl text-white mb-5 md:text-6xl leading-[50px]">
            {hero.title}
          </h1>

          <div className="mt-6 sm:mt-16 space-y-6">
            {features?.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-3 bg-primary rounded-full shadow-lg hover:scale-110 transform transition duration-300">
                  <img
                    alt={feature.title}
                    className="w-10 brightness-0 invert opacity-90"
                    src={feature.icon_url}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-700">{feature.title}</h3>
                  <p className="text-slate-700 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Image */}
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