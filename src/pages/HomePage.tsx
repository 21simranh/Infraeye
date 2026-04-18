import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div
        className="relative w-full min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/home-bg.jpeg)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 z-0"></div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
          {/* Hero Section */}
          <div className="text-center max-w-4xl">
            {/* Main Heading with highlighted words */}
            <h1 className="font-playfair text-6xl md:text-7xl lg:text-8xl font-bold text-[#E6E39B] leading-tight tracking-tight mb-8">
              AI-POWERED
              <br />
              INFRASTRUCTURE RISK
              <br />
              DETECTION WITH AR
            </h1>

            {/* Subheading */}
            <p className="font-inter text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-12 leading-relaxed">
              Real-time 3D scanning. Predictive risk modeling. Augmented reality overlays for field engineers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate('/3d-view')}
                className="font-inter font-semibold px-10 py-3 rounded-full bg-[#E6E39B] text-[#1A1A1A] transition-all hover:shadow-xl hover:shadow-[#E6E39B]/40 hover:scale-105"
              >
                Launch 3D View
              </button>
              <button
                onClick={() => navigate('/data-analysis')}
                className="font-inter font-semibold px-10 py-3 rounded-full bg-transparent text-[#E6E39B] border-2 border-[#E6E39B] transition-all hover:bg-[#E6E39B]/10 hover:shadow-lg hover:shadow-[#E6E39B]/20"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
