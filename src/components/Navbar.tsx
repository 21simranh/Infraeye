import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 h-20 bg-gradient-to-r from-[#4A6FA5] to-[#6B8FBF] backdrop-blur-[12px] flex items-center justify-between px-8">
      {/* LEFT: Navigation Links */}
      <div className="flex gap-4 items-center flex-1">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `font-inter text-sm font-medium transition-all ${
              isActive
                ? 'text-[#E6E39B]'
                : 'text-white/80 hover:text-[#E6E39B]'
            }`
          }
        >
          About
        </NavLink>

        <NavLink
          to="/data-analysis"
          className={({ isActive }) =>
            `font-inter text-sm font-medium transition-all ${
              isActive
                ? 'text-[#E6E39B]'
                : 'text-white/80 hover:text-[#E6E39B]'
            }`
          }
        >
          Features
        </NavLink>

        <NavLink
          to="/3d-view"
          className={({ isActive }) =>
            `font-inter text-sm font-medium transition-all ${
              isActive
                ? 'text-[#E6E39B]'
                : 'text-white/80 hover:text-[#E6E39B]'
            }`
          }
        >
          Technology
        </NavLink>
      </div>

      {/* CENTER: Logo/Title */}
      <div className="flex-1 text-center">
        <NavLink
          to="/home"
          className="font-playfair text-2xl font-bold text-[#E6E39B] tracking-tight"
        >
          INFRAEYE
        </NavLink>
      </div>

      {/* RIGHT: Login Button */}
      <div className="flex-1 flex justify-end">
        <NavLink
          to="/login"
          className="font-inter text-sm font-semibold px-6 py-2 bg-[#E6E39B] text-[#1A1A1A] rounded-full hover:shadow-lg transition-all hover:shadow-[#E6E39B]/30"
        >
          Sign In
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
