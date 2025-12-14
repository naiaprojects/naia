// Tambahkan 'use client' karena komponen ini menggunakan interaktivitas klien (animasi CSS)
'use client';

const LogoSpinner = () => {
  return (
    <svg
      className="animate-spin w-16 h-16"
      id="Layer_1"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1080"
    >
      <defs>
        <style>
          {`
            .cls-spinner {
              fill: url(#linear-gradient-spinner);
              stroke-width: 0px;
            }
          `}
        </style>
        <linearGradient id="linear-gradient-spinner" x1="197.01" y1="945.71" x2="943.88" y2="154.58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3ebded" />
          <stop offset="1" stopColor="#00f0f5" />
        </linearGradient>
      </defs>
      <path
        className="cls-spinner"
        d="M798.81,983.82l-54.2-62.55c-29.02-33.49-30.87-82.64-4.46-118.23l136.3-183.62c27.1-36.51,27.1-94.8,0-131.03l-104.88-140.22-195.36,238.79c-32.58,39.82-86.7,41.76-120.91,3.01l-63.61-72.06L771.57,86.2l198.05,280.49c73.84,104.58,73.84,268.14,0,373.47l-170.81,243.65ZM455.27,960.39c33.62-43.19,33.62-106.85,0-143.52l-167.23-182.39c-38.71-42.22-38.71-112.52,0-155.14l257.61-283.6-120.84-156.43L148.58,321.51c-124.77,127.46-124.77,346.03,0,472.22l244.19,246.96,62.51-80.3Z"
      />
    </svg>
  );
};

export default LogoSpinner;
