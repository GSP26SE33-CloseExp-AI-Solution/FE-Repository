import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div>
            <header style={{ padding: '16px', background: '#222', color: '#fff' }}>
                <h2>Close Exp AI Solution</h2>
            </header>

            <main style={{ padding: '24px' }}>
                {children}
            </main>

            <footer style={{ padding: '16px', textAlign: 'center' }}>
                © 2026 CloseExp AI
            </footer>
        </div>
    );
};

export default MainLayout;
