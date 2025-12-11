'use client';

import { useState } from 'react';
import DashboardNav from '@/components/dashboard-nav';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardLayoutClient({ children, user }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar - Full height, fixed position, overlaps header */}
            <DashboardNav
                user={user}
                isCollapsed={isCollapsed}
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={closeMobileMenu}
            />

            {/* Main content area with header */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                {/* Header - Only in content area, not full width */}
                <DashboardHeader
                    user={user}
                    isCollapsed={isCollapsed}
                    onToggleSidebar={toggleSidebar}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onToggleMobileMenu={toggleMobileMenu}
                />

                {/* Main Content */}
                <main className="flex-1">
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
