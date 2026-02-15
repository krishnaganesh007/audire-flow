import React from 'react';
import { FileCheck, Home, Settings, User } from 'lucide-react';
import clsx from 'clsx';

export const GlobalNav: React.FC = () => {
    return (
        <nav className="w-[60px] bg-gray-950 flex flex-col items-center py-5 h-full shrink-0 z-20">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-transform duration-200 hover:scale-105">
                    A
                </div>
            </div>

            {/* Main nav */}
            <div className="flex-1 space-y-1.5 w-full flex flex-col items-center">
                <NavIcon icon={Home} label="Home" />
                <NavIcon icon={FileCheck} label="Review" active />
            </div>

            {/* Bottom nav */}
            <div className="space-y-1.5 w-full flex flex-col items-center mb-2">
                <NavIcon icon={Settings} label="Settings" />
                <NavIcon icon={User} label="Profile" />
            </div>
        </nav>
    );
};

interface NavIconProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
}

const NavIcon: React.FC<NavIconProps> = ({ icon: Icon, label, active }) => (
    <div className="relative group">
        <button
            className={clsx(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
                active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"
            )}
        >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
        </button>
        {/* Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 group-hover:translate-x-0 -translate-x-1">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
        {/* Active indicator bar */}
        {active && (
            <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />
        )}
    </div>
);
