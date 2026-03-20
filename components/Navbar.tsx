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

  const handleJoinClick = () => {
    navigate("/join");
    setIsOpen(false);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled || isOpen
          ? "bg-white/95 backdrop-blur-md border-slate-200 py-3 shadow-sm"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 z-50 relative"
          onClick={() => setIsOpen(false)}
        >
          <img
            src="/brand.png"
            alt="GIVA"
            className="h-7 w-auto object-contain"
          />
          <span className="text-lg font-black text-slate-900 tracking-tight">
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
          className="lg:hidden p-2 text-slate-900"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[65px] bg-white z-40 lg:hidden overflow-y-auto border-t border-slate-200">
          <div className="p-6 flex flex-col gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              onClick={() => setIsOpen(false)}
            >
              <img
                src="/brand.png"
                alt="GIVA"
                className="h-7 w-auto object-contain"
              />
              <span className="text-lg font-black text-slate-900 tracking-tight">
                GIVA
              </span>
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 block hover:text-slate-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4">
              <Button variant="primary" fullWidth onClick={handleJoinClick}>
                Join GIVA
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
