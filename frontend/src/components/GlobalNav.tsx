import React from 'react';
import { FileCheck, Home, Settings, User } from 'lucide-react';
import clsx from 'clsx';

export const GlobalNav: React.FC = () => {
    return (
        <nav className="w-[60px] bg-gray-900 flex flex-col items-center py-6 h-full shrink-0 z-20">
            <div className="mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    A
                </div>
            </div>

            <div className="flex-1 space-y-4 w-full flex flex-col items-center">
                <NavIcon icon={Home} label="Home" />
                <NavIcon icon={FileCheck} label="Review" active />
            </div>

            <div className="space-y-4 w-full flex flex-col items-center mb-4">
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
    <button
        className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
            active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"
        )}
        title={label}
    >
        <Icon size={20} />
    </button>
);
