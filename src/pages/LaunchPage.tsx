import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show button after 2.5 seconds
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    // Auto-navigate to home after 4.5 seconds
    const navigationTimer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 4500);

    return () => {
      clearTimeout(buttonTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigate]);

  const handleLaunchDashboard = () => {
    navigate('/home');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-infraeye-surface">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ opacity: 0.8 }}
      >
        <source src="/grid-scan.webm" type="video/webm" />
      </video>

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Title with staggered animation */}
        <div className="flex gap-2">
          {['I', 'N', 'F', 'R', 'A', 'E', 'Y', 'E'].map((letter, index) => (
            <span
              key={index}
              className="font-space-grotesk text-8xl md:text-9xl font-bold text-infraeye-primary tracking-widest"
              style={{
                animation: `fadeInLetter 0.3s ease-out forwards, titleGlow 1.5s ease-in-out ${1.96 + index * 0.3}s infinite`,
                animationDelay: `${0.12 * index}s, ${1.96 + index * 0.3}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Launch Dashboard Button */}
        <button
          onClick={handleLaunchDashboard}
          className="mt-12 font-space-grotesk font-semibold px-8 py-3 rounded-lg bg-infraeye-primary text-infraeye-surface transition-all hover:bg-[#00deec] hover:scale-105 active:scale-95"
          style={{
            animation: showButton ? `fadeInUp 0.6s ease-out forwards` : `fadeInUp 0.6s ease-out ${2.5}s forwards`,
          }}
        >
          Launch Dashboard
        </button>

        {/* Glow effect using text-shadow */}
        <style>{`
          @keyframes fadeInLetter {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes titleGlow {
            0%, 100% {
              text-shadow:
                0 0 20px #8ff5ff,
                0 0 40px rgba(143, 245, 255, 0.5);
            }
            50% {
              text-shadow:
                0 0 30px #8ff5ff,
                0 0 60px rgba(143, 245, 255, 0.8);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LaunchPage;
