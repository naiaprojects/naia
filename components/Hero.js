// components/Hero.js
import { createClient } from '@/lib/supabase-server';

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
    title: 'Ubah Blogspot Anda Jadi Website Premium',
    background_image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQURFZv63UernQRlg8fAFzNp6fn7ugpbKDDhbothv6W-s6p8-CRV3YakUJkwfi07mfDcVJxTwYgf_5O88U5YByKEx1W-tE5z8Kkk8V5ExtcGbWgn0hFU6FTp5Eg1lFstjPp8aX33MgPs6XJd3TcysXZ5UIuLy2VtNq6aPAWakWe2BFcEL7Je0GkGI_744/s1920/19381187_6125995.webp',
    right_image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimRipe1eBeaGjLIafhSbzS2433hUKOOcMvH9WZwP7f6BpattbInLQaMu5u5ewGKwWF6T0EV_PkGOvGRvAefBXmIFVx3usVU62LHaQj7KQvXmMJwd9ipsOpLu80HFnqW8YsA9uryWc5ECGsTV3eETAuEFQDgShwZjC2-pVadbfpP2wjvyqjJ6HhLl3hBCU/s1600/HeroBg.webp'
  };

  return (
    <section
      className="bg-white min-h-screen relative overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url('${hero.background_image}')` }}
    >
      <div className="pt-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="p-8 pb-24 sm:pb-8">
          <h1 className="font-bold text-3xl text-white mb-5 md:text-5xl leading-[50px]">
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
                  <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden sm:block relative p-4">
          <div className="absolute inset-0 transform hover:scale-105 transition-transform duration-300"></div>
          <img
            alt="Desain Orisinil"
            className="relative object-cover w-full h-full transition duration-500 hover:rotate-2 hover:scale-110 rounded-lg"
            src={hero.right_image}
          />
        </div>
      </div>

      {/* Wave SVG Bottom */}
      <svg
        className="transform rotate-180 absolute bottom-0 fill-white h-[90px] w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 37"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#fff">
          <path d="M0 0h1000v1.48H0z"></path>
          <path d="M0 0h1000v29.896S550 37 500 37 0 29.896 0 29.896V0Z" opacity=".2"></path>
          <path d="M0 0h1000v22.792S600 37 500 37 0 22.792 0 22.792V0Z" opacity=".3"></path>
          <path d="M0 0h1000v15.688S650 37 500 37 0 15.688 0 15.688V0Z" opacity=".4"></path>
          <path d="M0 0h1000v8.584S700 37 500 37 0 8.584 0 8.584V0Z" opacity=".5"></path>
          <path d="M0 0v1.48s250 35.52 500 35.52 500-35.52 500-35.52V0H0Z"></path>
        </g>
      </svg>
    </section>
  );
}