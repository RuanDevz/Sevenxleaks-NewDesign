import React, { useEffect, useState } from "react";

type TimeLeft = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const BlackFridayBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  type TimeKey = keyof TimeLeft;

  useEffect(() => {
    const endDate = new Date("2025-11-30T23:59:59");

    const updateTimer = () => {
      const now = new Date();
      now.setHours(now.getHours() + 3); // AQUI: adiciona +3 horas
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-600 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 p-1 rounded-full hover:bg-white/10 transition-colors duration-200 group"
        aria-label="Close banner"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative py-1.5 sm:py-2 px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 lg:gap-4">
        {/* Title Section */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-br from-red-500 to-orange-600 rounded-full shadow-lg animate-pulse">
            <span className="text-xs sm:text-sm">🔥</span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[11px] sm:text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 tracking-wide uppercase leading-tight">
              Black Friday <span className="hidden sm:inline">Sale</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium hidden sm:block leading-tight">
              Save <span className="text-red-400 font-bold">60%</span>
            </p>
          </div>
        </div>

        {/* Timer Section */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {(Object.keys(timeLeft) as TimeKey[]).map((key, index) => (
            <React.Fragment key={key}>
              <div className="flex flex-col items-center group">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 to-orange-500/40 rounded blur-sm group-hover:blur-md transition-all duration-300"></div>

                  {/* Timer box */}
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-xl backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-red-100 to-orange-200 tabular-nums">
                      {timeLeft[key]}
                    </span>
                  </div>
                </div>

                <span className="text-[7px] sm:text-[8px] uppercase text-gray-500 mt-0.5 tracking-wider font-semibold">
                  {key}
                </span>
              </div>

              {/* Separator */}
              {index < 3 && (
                <div className="text-red-400 text-sm sm:text-base font-bold mb-2.5 sm:mb-3 animate-pulse">:</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => window.location.href = "/plans"}
          className="group relative px-3 sm:px-5 py-1 sm:py-1.5 font-bold text-[10px] sm:text-xs rounded-md overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
        >
          {/* Button gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 group-hover:from-red-500 group-hover:via-orange-500 group-hover:to-red-500 transition-all duration-300"></div>

          {/* Button shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"></div>
          </div>

          <span className="relative text-white tracking-wide uppercase flex items-center gap-1">
            Claim
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default BlackFridayBanner;
