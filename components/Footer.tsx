import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer grid */}
      <div className="container mx-auto px-6 lg:px-20 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img
                src="/brand.png"
                alt="GIVA"
                className="h-7 w-auto object-contain"
              />
              <span
                className="text-lg font-black text-white
                tracking-tight"
              >
                GIVA
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              The Global Innovation & Venture Accelerator. Turning curiosity
              into real-world impact.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest
              text-slate-500 mb-4"
            >
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Programs", to: "/programs" },
                { label: "Events", to: "/events" },
                { label: "Community", to: "/join" },
                { label: "Dashboard", to: "/dashboard" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-white
                      transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For links */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest
              text-slate-500 mb-4"
            >
              For
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Students", to: "/join" },
                { label: "Mentors", to: "/join" },
                { label: "Institutions", to: "/join" },
                { label: "Investors", to: "/join" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-white
                      transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest
              text-slate-500 mb-4"
            >
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", to: "#" },
                { label: "Terms of Service", to: "#" },
                { label: "Cookie Policy", to: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-white
                      transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div
          className="container mx-auto px-6 lg:px-20 py-6
          flex flex-col sm:flex-row items-center
          justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <img
              src="/brand.png"
              alt="GIVA"
              className="h-5 w-auto object-contain opacity-60"
            />
            <span
              className="text-sm font-bold text-slate-500
              tracking-tight"
            >
              GIVA
            </span>
          </div>

          <p
            className="text-xs text-slate-600 text-center
            sm:text-right"
          >
            © {new Date().getFullYear()} GIVA — Science & Innovation Ecosystem.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
