import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
    showControls: boolean;
    onReset: () => void;
}

const LanguageSwitcher: React.FC = () => {
    const { locale, setLocale } = useTranslation();

    const inactiveStyle = "px-3 py-1 text-sm font-medium text-hype-gray-500 hover:text-hype-black";
    const activeStyle = "px-3 py-1 text-sm font-bold text-hype-black bg-hype-gray-200 rounded-full";

    return (
        <div className="flex items-center space-x-1 bg-hype-gray-100 p-1 rounded-full border border-hype-gray-200">
            <button
                onClick={() => setLocale('id')}
                className={locale === 'id' ? activeStyle : inactiveStyle}
            >
                ID
            </button>
            <button
                onClick={() => setLocale('en')}
                className={locale === 'en' ? activeStyle : inactiveStyle}
            >
                EN
            </button>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ showControls, onReset }) => {
  const { t } = useTranslation();
  return (
    <header className="w-full p-4 border-b border-hype-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <div className="bg-hype-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xl">
                h
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">hype.</h1>
        </div>
        <div className="flex items-center gap-4">
             <LanguageSwitcher />
            {showControls && (
                <button 
                    onClick={onReset}
                    className="px-4 py-2 text-sm font-medium border border-hype-gray-300 rounded-full hover:bg-hype-gray-100 transition-colors"
                >
                    {t('header.newSession')}
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
