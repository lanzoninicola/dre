// components/layout/Navbar.tsx
import { Calculator, Sparkles, Menu, Bell, User, LogOut } from "lucide-react";
import { useState } from "react";
import { GradientButton } from "./gradient-button";

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
    <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-1.5 h-1.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                FinanceFlow
              </h1>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200">
                  <Bell className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-gray-500">{user.role}</p>
                  </div>
                </div>

                <GradientButton variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </GradientButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-white/20">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>

                <GradientButton variant="ghost" size="sm" className="w-full justify-start">
                  <LogOut className="w-4 h-4" />
                  Sair
                </GradientButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}