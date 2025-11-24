import React, { useState, useMemo } from 'react';
import type { StyleOption, ManualSettings } from '../types';
import { UploadIcon, ChevronDownIcon, InformationCircleIcon, SparklesIcon, BookOpenIcon, WrenchScrewdriverIcon, WandSparklesIcon } from './icons';
import { useTranslation } from '../hooks/useTranslation';

interface Step2StyleSelectionProps {
  styleOptions: StyleOption[];
  selectedStyle: StyleOption | null;
  onStyleSelect: (style: StyleOption) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  manualSettings: ManualSettings;
  onManualSettingsChange: (settings: ManualSettings) => void;
  referenceFile: File | null;
  onReferenceFileUpload: (file: File | null) => void;
  isRecommending: boolean;
  recommendedStyleIds: string[];
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
  onEnhancePrompt: () => void;
  isEnhancingPrompt: boolean;
}

const NegativePromptInput: React.FC<{ value: string; onChange: (value: string) => void; }> = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <div className="p-6 bg-white rounded-2xl border border-hype-gray-200 shadow-sm mt-4">
            <div className="flex items-center gap-2 mb-2">
                <label htmlFor="negative-prompt" className="block text-lg font-bold text-hype-black">
                    {t('step2.negativePrompt.title')}
                </label>
                <div className="group relative">
                    <InformationCircleIcon className="w-5 h-5 text-hype-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-hype-gray-800 p-3 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {t('step2.negativePrompt.tooltip')}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-hype-gray-800"></div>
                    </div>
                </div>
            </div>
            <input
                id="negative-prompt"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('step2.negativePrompt.placeholder')}
                className="w-full px-4 py-3 border border-hype-gray-300 rounded-lg focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow"
                aria-label="Negative Prompt"
            />
        </div>
    );
};

// Sub-komponen tetap sama, hanya akan dipanggil di lokasi yang berbeda
const CustomPromptInput: React.FC<{ 
    value: string; 
    onChange: (value: string) => void;
    onEnhance: () => void;
    isEnhancing: boolean;
}> = ({ value, onChange, onEnhance, isEnhancing }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white rounded-2xl border border-hype-gray-200 shadow-sm mt-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
            <label htmlFor="custom-prompt" className="block text-lg font-bold text-hype-black">
            {t('step2.custom.title')}
            </label>
            <div className="group relative">
                <InformationCircleIcon className="w-5 h-5 text-hype-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-hype-gray-800 p-3 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {t('step2.custom.tooltip')}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-hype-gray-800"></div>
                </div>
            </div>
        </div>
        <button 
            onClick={onEnhance}
            disabled={isEnhancing || !value.trim()}
            className="px-3 py-1.5 bg-hype-yellow text-hype-black font-semibold rounded-full text-sm flex items-center gap-1.5 hover:brightness-105 transition-all disabled:bg-hype-gray-200 disabled:text-hype-gray-500"
        >
             {isEnhancing ? (
                <div className="w-4 h-4 border-2 border-hype-gray-300 border-t-hype-black rounded-full animate-spin"></div>
             ) : (
                <WandSparklesIcon className="w-4 h-4" />
             )}
            <span>{t('step2.custom.enhancePrompt')}</span>
        </button>
      </div>
      <textarea
        id="custom-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('step2.custom.placeholder')}
        className="w-full h-32 px-4 py-3 border border-hype-gray-300 rounded-lg focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow"
        aria-label="Custom Prompt"
        disabled={isEnhancing}
      />
    </div>
  );
};

const ManualSettingsForm: React.FC<{ settings: ManualSettings; onChange: (settings: ManualSettings) => void }> = ({ settings, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white rounded-2xl border border-hype-gray-200 shadow-sm space-y-4 mt-4">
      <h3 className="text-lg font-bold text-hype-black">{t('step2.manual.title')}</h3>
      <div>
        <div className="flex items-center gap-2 mb-1">
            <label htmlFor="bg-desc" className="block text-sm font-semibold text-hype-gray-700">{t('step2.manual.background.label')}</label>
            <div className="group relative">
                <InformationCircleIcon className="w-4 h-4 text-hype-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-hype-gray-800 p-3 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {t('step2.manual.background.tooltip')}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-hype-gray-800"></div>
                </div>
            </div>
        </div>
        <input
          id="bg-desc"
          type="text"
          value={settings.background}
          onChange={(e) => onChange({ ...settings, background: e.target.value })}
          placeholder={t('step2.manual.background.placeholder')}
          className="w-full px-4 py-2 border border-hype-gray-300 rounded-md focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow"
        />
      </div>
      <div>
        <label htmlFor="lighting" className="block text-sm font-semibold text-hype-gray-700 mb-1">{t('step2.manual.lighting.label')}</label>
        <select
          id="lighting"
          value={settings.lighting}
          onChange={(e) => onChange({ ...settings, lighting: e.target.value })}
          className="w-full px-4 py-2 border border-hype-gray-300 rounded-md focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow bg-white"
        >
          <option>{t('step2.manual.lighting.option1')}</option>
          <option>{t('step2.manual.lighting.option2')}</option>
          <option>{t('step2.manual.lighting.option3')}</option>
        </select>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
            <label htmlFor="props" className="block text-sm font-semibold text-hype-gray-700">{t('step2.manual.props.label')}</label>
             <div className="group relative">
                <InformationCircleIcon className="w-4 h-4 text-hype-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-hype-gray-800 p-3 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {t('step2.manual.props.tooltip')}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-hype-gray-800"></div>
                </div>
            </div>
        </div>
        <input
          id="props"
          type="text"
          value={settings.props}
          onChange={(e) => onChange({ ...settings, props: e.target.value })}
          placeholder={t('step2.manual.props.placeholder')}
          className="w-full px-4 py-2 border border-hype-gray-300 rounded-md focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow"
        />
      </div>
    </div>
  );
};

const ReferenceImageUpload: React.FC<{ file: File | null; onUpload: (file: File | null) => void }> = ({ file, onUpload }) => {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-hype-gray-200 shadow-sm mt-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-hype-black">{t('step2.reference.title')}</h3>
          <p className="text-sm text-hype-gray-600 max-w-md">{t('step2.reference.prompt')}</p>
        </div>
        {file && (
          <button 
            onClick={() => onUpload(null)} 
            className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-full px-3 py-1 transition-colors shrink-0 ml-4"
          >
            {t('step2.reference.remove')}
          </button>
        )}
      </div>
      
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group w-full h-48 border-2 border-dashed border-hype-gray-300 rounded-lg flex items-center justify-center text-center cursor-pointer hover:border-hype-yellow transition-colors bg-hype-gray-50 overflow-hidden relative"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Reference Preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <UploadIcon className="w-8 h-8 text-white mb-2" />
              <span className="text-white font-semibold">{t('step2.reference.change')}</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-hype-gray-500 p-4">
            <UploadIcon className="w-10 h-10 mb-2" />
            <span className="font-semibold text-hype-black">{t('step2.reference.upload')}</span>
            <span className="text-sm">{t('step2.reference.uploadPrompt')}</span>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        aria-hidden="true"
      />
    </div>
  );
};

const StyleCard: React.FC<{
  option: StyleOption;
  optionName: string;
  optionDescription: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ option, optionName, optionDescription, isSelected, onClick }) => {
  const Icon = option.icon;
  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 rounded-xl text-left transition-all duration-200 w-full flex items-center space-x-4 ${
        isSelected
          ? 'border-hype-black bg-hype-gray-100 shadow-lg'
          : 'border-hype-gray-200 bg-white hover:border-hype-black hover:shadow-md'
      }`}
      aria-pressed={isSelected}
    >
      <div className={`p-3 rounded-lg border transition-colors shrink-0 ${isSelected ? 'bg-white border-hype-gray-300' : 'bg-hype-gray-100 border-hype-gray-200'}`}>
        <Icon className="w-6 h-6 text-hype-black" />
      </div>
      <div className="overflow-hidden">
        <h4 className="font-bold text-base truncate">{optionName}</h4>
        <p className="text-sm text-hype-gray-600 truncate" title={optionDescription}>{optionDescription}</p>
      </div>
    </button>
  );
};

const TabButton: React.FC<{
  icon: React.ElementType,
  label: string,
  isActive: boolean,
  onClick: () => void
}> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 flex-1 flex items-center justify-center gap-2 rounded-full font-semibold transition-colors text-sm sm:text-base ${
        isActive ? 'bg-hype-black text-white shadow-md' : 'bg-hype-gray-200 text-hype-gray-700 hover:bg-hype-gray-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
};

// Main Component Refactor
const Step2StyleSelection: React.FC<Step2StyleSelectionProps> = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'recommended' | 'library' | 'creative'>('recommended');

  const recommendedStyles = useMemo(() => {
    return props.recommendedStyleIds
      .map(id => props.styleOptions.find(style => style.id === id))
      .filter((style): style is StyleOption => style !== undefined);
  }, [props.recommendedStyleIds, props.styleOptions]);

  // If recommendations are loading or exist, stay on the recommended tab.
  // If not, switch to library. This handles cases where a user comes back to this step.
  React.useEffect(() => {
    if (props.isRecommending || recommendedStyles.length > 0) {
      setActiveTab('recommended');
    }
  }, [props.isRecommending, recommendedStyles.length]);


  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      <div className="text-center mb-10">
        <p className="text-hype-gray-500 font-semibold">{t('step2.step')}</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">{t('step2.title')}</h2>
        <p className="mt-2 text-hype-gray-600">{t('step2.prompt')}</p>
      </div>

      <div className="w-full max-w-lg mx-auto p-1 bg-hype-gray-200 rounded-full grid grid-cols-3 gap-1 mb-8">
        <TabButton icon={SparklesIcon} label={t('step2.tabs.recommended')} isActive={activeTab === 'recommended'} onClick={() => setActiveTab('recommended')} />
        <TabButton icon={BookOpenIcon} label={t('step2.tabs.library')} isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
        <TabButton icon={WrenchScrewdriverIcon} label={t('step2.tabs.creative')} isActive={activeTab === 'creative'} onClick={() => setActiveTab('creative')} />
      </div>

      <div className="w-full">
        {activeTab === 'recommended' && <RecommendedTab {...props} recommendedStyles={recommendedStyles} />}
        {activeTab === 'library' && <LibraryTab {...props} />}
        {activeTab === 'creative' && <CreativeTab {...props} />}
      </div>
    </div>
  );
};


const RecommendedTab: React.FC<Step2StyleSelectionProps & { recommendedStyles: StyleOption[] }> = ({
  isRecommending,
  recommendedStyles,
  selectedStyle,
  onStyleSelect,
}) => {
  // FIX: Use the useTranslation hook to get the 't' function instead of relying on props.
  const { t } = useTranslation();
  if (isRecommending) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-hype-gray-200">
        <div className="flex items-center space-x-3 text-hype-gray-600">
          <div className="w-6 h-6 border-2 border-hype-gray-200 border-t-hype-black rounded-full animate-spin"></div>
          <span>{t('step2.recommendations.loading')}</span>
        </div>
      </div>
    );
  }

  if (recommendedStyles.length === 0) {
    return (
        <div className="text-center p-8 bg-white rounded-2xl border border-hype-gray-200">
            <h3 className="text-lg font-bold">{t('step2.recommendations.noResultsTitle')}</h3>
            <p className="text-hype-gray-600 mt-1">{t('step2.recommendations.noResultsDescription')}</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {recommendedStyles.map(option => (
        <StyleCard
          key={`rec-${option.id}`}
          option={option}
          optionName={t(option.nameKey)}
          optionDescription={t(option.descriptionKey)}
          isSelected={selectedStyle?.id === option.id}
          onClick={() => onStyleSelect(option)}
        />
      ))}
    </div>
  );
};

const LibraryTab: React.FC<Step2StyleSelectionProps> = ({ styleOptions, selectedStyle, onStyleSelect }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState('');
    const [activeCategory, setActiveCategory] = useState('studio_lifestyle');

    const presets = useMemo(() => styleOptions.filter(opt => !['custom', 'manual', 'reference'].includes(opt.id)), [styleOptions]);

    const categories: Record<string, { name: string; ids: string[] }> = useMemo(() => {
        const muslimFashionIds = [
            'preset_gamis_elegan_studio',
            'preset_koko_modern_studio',
            'preset_syari_fashion_lookbook',
            'preset_casual_hijab_street_style'
        ];
        const mainCategoryIds = ['studio', 'pro_studio', 'social_lifestyle', 'snack_social', 'flat_lay', 'dark_moody'];

        return {
            'studio_lifestyle': {
                name: t('step2.library.categories.studio_lifestyle'),
                ids: ['studio', 'pro_studio', 'social_lifestyle', 'snack_social']
            },
            'artistic_moody': {
                name: t('step2.library.categories.artistic_moody'),
                ids: ['flat_lay', 'dark_moody']
            },
            'muslim_fashion': {
                name: t('step2.library.categories.muslim_fashion'),
                ids: muslimFashionIds
            },
            'themes_concepts': {
                name: t('step2.library.categories.themes_concepts'),
                ids: presets.filter(p => ![...mainCategoryIds, ...muslimFashionIds].includes(p.id)).map(p => p.id)
            }
        };
    }, [presets, t]);

    const filteredPresets = useMemo(() => {
        const stylesInCategory = presets.filter(p => categories[activeCategory].ids.includes(p.id));
        if (!filter.trim()) {
            return stylesInCategory;
        }
        return presets.filter(option =>
            (t(option.nameKey) + t(option.descriptionKey)).toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter, presets, t, activeCategory, categories]);

    return (
        <div className="w-full bg-white p-6 rounded-2xl border border-hype-gray-200">
            <input
                type="text"
                placeholder={t('step2.library.searchPlaceholder')}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-hype-gray-300 rounded-lg focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow mb-4"
            />
             {!filter.trim() && (
                <div className="flex items-center gap-2 border-b border-hype-gray-200 mb-4 overflow-x-auto">
                    {Object.entries(categories).map(([key, value]) => (
                        <button key={key} onClick={() => setActiveCategory(key)} className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeCategory === key ? 'border-b-2 border-hype-black text-hype-black' : 'text-hype-gray-500 hover:text-hype-black'}`}>
                            {value.name}
                        </button>
                    ))}
                </div>
            )}
            <div className="max-h-[50vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPresets.map(option => (
                        <StyleCard
                            key={option.id}
                            option={option}
                            optionName={t(option.nameKey)}
                            optionDescription={t(option.descriptionKey)}
                            isSelected={selectedStyle?.id === option.id}
                            onClick={() => onStyleSelect(option)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
};

const CreativeTab: React.FC<Step2StyleSelectionProps> = (props) => {
    const { onStyleSelect, selectedStyle, styleOptions } = props;
    const { t } = useTranslation();
    const creativeTools = useMemo(() => styleOptions.filter(opt => ['custom', 'manual', 'reference'].includes(opt.id)), [styleOptions]);

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {creativeTools.map(tool => (
                    <button key={tool.id} onClick={() => onStyleSelect(tool)} className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 flex flex-col items-start space-y-3 ${selectedStyle?.id === tool.id ? 'border-hype-black bg-hype-gray-100 shadow-lg' : 'border-hype-gray-200 bg-white hover:border-hype-black'}`}>
                        <div className={`p-3 rounded-full border transition-colors ${selectedStyle?.id === tool.id ? 'bg-white border-hype-gray-300' : 'bg-hype-gray-100 border-hype-gray-200'}`}>
                            <tool.icon className="w-6 h-6 text-hype-black" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">{t(tool.nameKey)}</h4>
                            <p className="text-sm text-hype-gray-600">{t(tool.descriptionKey)}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="w-full mt-4 transition-all duration-300 ease-in-out">
                {selectedStyle?.id === 'custom' && (
                    <CustomPromptInput 
                        value={props.customPrompt} 
                        onChange={props.onCustomPromptChange} 
                        onEnhance={props.onEnhancePrompt}
                        isEnhancing={props.isEnhancingPrompt}
                    />
                )}
                {selectedStyle?.id === 'manual' && <ManualSettingsForm settings={props.manualSettings} onChange={props.onManualSettingsChange} />}
                {selectedStyle?.id === 'reference' && <ReferenceImageUpload file={props.referenceFile} onUpload={props.onReferenceFileUpload} />}
                {(selectedStyle?.id === 'custom' || selectedStyle?.id === 'manual') && (
                    <NegativePromptInput value={props.negativePrompt} onChange={props.onNegativePromptChange} />
                )}
            </div>
        </div>
    )
};


export default Step2StyleSelection;