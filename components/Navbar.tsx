import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../constants";
import { Menu, X } from "lucide-react";
import Button from "./Button";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock/unlock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleJoinClick = () => {
    navigate("/join");
    setIsOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled || isOpen
            ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 max-w-7xl flex items-center justify-between h-16 sm:h-20">
          {/* Header content stays within consistent height */}
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <img
              src="/brand.png"
              alt="GIVA"
              className="h-6 sm:h-7 w-auto object-contain"
            />
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              GIVA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`text-sm font-semibold transition-all hover:text-slate-900 ${
                    isActive
                      ? "text-slate-900 underline underline-offset-4"
                      : "text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="primary" size="sm" onClick={handleJoinClick}>
              Join GIVA
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2.5 sm:p-3 -mr-2.5 sm:-mr-3 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X size={24} strokeWidth={2.5} />
            ) : (
              <Menu size={24} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 sm:top-20 bg-white z-40 lg:hidden overflow-y-auto border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 min-h-screen">
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-2.5 mb-2"
              onClick={() => setIsOpen(false)}
            >
              <img
                src="/brand.png"
                alt="GIVA"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                GIVA
              </span>
            </Link>
            <nav className="flex flex-col gap-0">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-100 py-4 sm:py-5 block hover:text-slate-600 active:text-slate-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 sm:mt-8">
              <Button variant="primary" fullWidth onClick={handleJoinClick}>
                Join GIVA
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
