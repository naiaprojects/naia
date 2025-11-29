// Tambahkan 'use client' karena komponen ini menggunakan interaktivitas klien (animasi CSS)
'use client';

const LogoSpinner = () => {
  return (
    <svg
      className="animate-spin w-16 h-16" // Tambahkan kelas untuk animasi dan ukuran
      id="Layer_1"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 1080 1080"
    >
      <defs>
        <style>
          {`
            .cls-1 {
              fill: url(#linear-gradient);
              stroke-width: 0px;
            }
          `}
        </style>
        <linearGradient id="linear-gradient" x1="108.27" y1="540" x2="971.73" y2="540" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbb040" />
          <stop offset="1" stopColor="#f57c00" />
        </linearGradient>
      </defs>
      <path
        className="cls-1"
        d="M772.05,52.44h0c-43.7,11.66-81.24,50.64-96.2,98.11l-78.42,248.81c-12.4,39.36,21.05,74.66,52.44,53.68h0c48.46-32.4,112.09-24.36,153.49,24.11,63.6,74.46,87.46,187.9,49.93,287.93h0c-50.82,135.45-185.48,175.08-290.21,103.73l-347.36-236.63c-55.31-37.68-83.28-137.44-65.94-226.9l.06-.32c19.48-100.49,87.06-166.47,155.63-141.42l150.65,55.03c30.06,10.98,65.21-14.14,77.99-57.4l31.85-107.85c7.02-23.77-5.95-44.29-24.53-39.33l-355.31,94.83c-44.24,11.81-77.85,77.7-77.85,147.91v366.56c0,70.21,33.61,136.1,77.85,147.91l585.93,156.38c105.14,28.06,199.69-45.88,199.69-168.22V220.66c0-122.34-94.55-196.28-199.69-168.22Z"
      />
    </svg>
  );
};

export default LogoSpinner;