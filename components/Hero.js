export default function Hero() {
  return (
    <section className="bg-white min-h-screen relative overflow-hidden bg-[url('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQURFZv63UernQRlg8fAFzNp6fn7ugpbKDDhbothv6W-s6p8-CRV3YakUJkwfi07mfDcVJxTwYgf_5O88U5YByKEx1W-tE5z8Kkk8V5ExtcGbWgn0hFU6FTp5Eg1lFstjPp8aX33MgPs6XJd3TcysXZ5UIuLy2VtNq6aPAWakWe2BFcEL7Je0GkGI_744/s1920/19381187_6125995.webp')] bg-no-repeat bg-cover bg-center">
      <div className="pt-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="p-8 pb-24 sm:pb-8">
          <h1 className="font-bold text-3xl text-white mb-5 md:text-5xl leading-[50px]">
            Ubah Blogspot Anda Jadi Website Premium
          </h1>

          <div className="mt-6 sm:mt-16 space-y-6">
            {/* Feature 1 */}
            <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="p-3 bg-primary rounded-full shadow-lg hover:scale-110 transform transition duration-300">
                <img
                  alt="Profesional"
                  className="w-10 brightness-0 invert opacity-90"
                  src="https://www.svgrepo.com/show/425602/rocket-launch-launch-marketing.svg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Profesional</h3>
                <p className="text-slate-600 text-sm">
                  Desain eksklusif, bukan template pasaran. Dibuat oleh desainer berpengalaman khusus untuk Blogspot Anda.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="p-3 bg-primary rounded-full shadow-lg hover:scale-110 transform transition duration-300">
                <img
                  alt="Harga Terjangkau"
                  className="w-10 brightness-0 invert opacity-90"
                  src="https://www.svgrepo.com/show/390201/wallet-money-cash.svg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Harga Terjangkau</h3>
                <p className="text-slate-600 text-sm">
                  Tampilan premium tanpa biaya berlebihan. Desain sekelas website mahal dengan budget hemat.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-4 p-3 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="p-3 bg-primary rounded-full shadow-lg hover:scale-110 transform transition duration-300">
                <img
                  alt="Instant Support"
                  className="w-10 brightness-0 invert opacity-90"
                  src="https://www.svgrepo.com/show/385097/chat-message-sms-bell-ring-notification.svg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Instant Support</h3>
                <p className="text-slate-600 text-sm">
                  Respon cepat dan dukungan penuh. Kami siap bantu 24/7 dari instalasi hingga penyesuaian website blogspot anda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden sm:block relative p-4">
          <div className="absolute inset-0 transform hover:scale-105 transition-transform duration-300"></div>
          <img
            alt="Desain Orisinil"
            className="relative object-cover w-full h-full transition duration-500 hover:rotate-2 hover:scale-110 rounded-lg"
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimRipe1eBeaGjLIafhSbzS2433hUKOOcMvH9WZwP7f6BpattbInLQaMu5u5ewGKwWF6T0EV_PkGOvGRvAefBXmIFVx3usVU62LHaQj7KQvXmMJwd9ipsOpLu80HFnqW8YsA9uryWc5ECGsTV3eETAuEFQDgShwZjC2-pVadbfpP2wjvyqjJ6HhLl3hBCU/s1600/HeroBg.webp"
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