// app/components/layouts/nav-bar.tsx
import { Calculator, Menu, Bell, User, LogOut } from "lucide-react";
import { useState } from "react";
import { GradientButton } from "./gradient-button";
import { Link } from "@remix-run/react";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Only the logo uses color for branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-semibold text-gray-900">
                FinanceFlow
              </h1>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.role}</p>
                  </div>
                </div>

                <Link to="/logout">
                  <GradientButton variant="ghost" size="sm">
                    <LogOut className="w-4 h-4" />
                  </GradientButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>

                <Link to="/logout">
                  <GradientButton variant="ghost" size="sm" className="w-full justify-start">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </GradientButton>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}