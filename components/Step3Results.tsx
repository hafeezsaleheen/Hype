import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon, RefreshIcon, XMarkIcon, ClipboardIcon, ClipboardDocumentCheckIcon, DocumentTextIcon, ScissorsIcon, CubeIcon, BuildingOfficeIcon, DevicePhoneMobileIcon, TshirtIcon, ArrowLeftIcon, BookmarkIcon, CheckIcon } from './icons';
import { GeneratedImage, GeneratedCaption } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { generateMockup } from '../services/geminiService';

interface Step3ResultsProps {
  isLoading: boolean;
  isRegenerating: boolean[];
  images: (GeneratedImage | null)[];
  error: string | null;
  onRegenerate: () => void;
  onRegenerateOne: (index: number) => void;
  onChangeStyle: () => void;
  isGeneratingCaptions: boolean;
  generatedCaptions: GeneratedCaption[];
  onGenerateCaptions: () => void;
  isolatedFile: File | null;
  onSaveSession: () => Promise<void>;
}

const downloadImage = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const handleDownload = (image: GeneratedImage, index: number, isMockup = false) => {
    const mimeType = image.src.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    const baseName = isMockup ? `hype-ai-mockup-${index + 1}` : `hype-ai-image-${index + 1}`;
    downloadImage(image.src, `${baseName}.${extension}`);
};

const ASPECT_RATIOS = [
    { value: 1 / 1, text: '1:1' },
    { value: 4 / 3, text: '4:3' },
    { value: 3 / 4, text: '3:4' },
    { value: 4 / 5, text: '4:5' },
    { value: 5 / 4, text: '5:4' },
    { value: 16 / 9, text: '16:9' },
    { value: 9 / 16, text: '9:16' },
];

const ImageCropper: React.FC<{ imageSrc: string; baseFilename: string }> = ({ imageSrc, baseFilename }) => {
    const { t } = useTranslation();
    const [aspect, setAspect] = useState(ASPECT_RATIOS[0].value);

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0 });
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

    const resetCrop = useCallback(() => {
        if (!containerRef.current || !naturalSize.width || !imageRef.current) return;

        const containerWidth = imageRef.current.offsetWidth;
        const containerHeight = imageRef.current.offsetHeight;

        let newWidth, newHeight;
        if (containerWidth / containerHeight > aspect) {
            newHeight = containerHeight;
            newWidth = newHeight * aspect;
        } else {
            newWidth = containerWidth;
            newHeight = newWidth / aspect;
        }

        setCrop({
            width: newWidth,
            height: newHeight,
            x: (containerWidth - newWidth) / 2,
            y: (containerHeight - newHeight) / 2,
        });
    }, [aspect, naturalSize.width]);

    useEffect(() => {
        resetCrop();
        window.addEventListener('resize', resetCrop);
        return () => window.removeEventListener('resize', resetCrop);
    }, [aspect, resetCrop]);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
        resetCrop();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            mouseX: e.clientX,
            mouseY: e.clientY,
            cropX: crop.x,
            cropY: crop.y,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !imageRef.current) return;
        const dx = e.clientX - dragStart.mouseX;
        const dy = e.clientY - dragStart.mouseY;
        const newX = Math.max(0, Math.min(dragStart.cropX + dx, imageRef.current.offsetWidth - crop.width));
        const newY = Math.max(0, Math.min(dragStart.cropY + dy, imageRef.current.offsetHeight - crop.height));
        setCrop(c => ({ ...c, x: newX, y: newY }));
    }, [isDragging, dragStart, crop.width, crop.height]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleDownload = () => {
        if (!imageRef.current) return;
        const image = imageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const scaleX = naturalSize.width / image.width;
        const scaleY = naturalSize.height / image.height;
        
        const sx = crop.x * scaleX;
        const sy = crop.y * scaleY;
        const sWidth = crop.width * scaleX;
        const sHeight = crop.height * scaleY;

        canvas.width = sWidth;
        canvas.height = sHeight;

        ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl, `${baseFilename}-cropped.png`);
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-4">
            <h3 className="text-2xl font-bold text-center mb-4">{t('step3.cropper.title')}</h3>
            <div className="w-full flex-grow flex items-center justify-center mb-4 overflow-hidden">
                <div ref={containerRef} className="relative select-none" style={{ touchAction: 'none' }}>
                    <img ref={imageRef} src={imageSrc} onLoad={onImageLoad} crossOrigin="anonymous" className="max-w-full max-h-[50vh] object-contain" alt="Cropping preview" />
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            position: 'absolute',
                            top: crop.y,
                            left: crop.x,
                            width: crop.width,
                            height: crop.height,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            border: '1px solid rgba(255, 255, 255, 0.8)',
                        }}
                    >
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 border-t border-l border-r border-b border-white opacity-40"></div>
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                    <label className="text-sm font-semibold text-hype-gray-600 mr-2">{t('step3.cropper.aspectRatio')}:</label>
                    <select value={aspect} onChange={e => setAspect(Number(e.target.value))} className="px-3 py-2 border border-hype-gray-300 rounded-md bg-white focus:ring-2 focus:ring-hype-yellow">
                        {ASPECT_RATIOS.map(ar => <option key={ar.text} value={ar.value}>{ar.text}</option>)}
                    </select>
                </div>
                <button onClick={handleDownload} className="w-full sm:w-auto px-6 py-3 bg-hype-yellow text-hype-black font-bold rounded-full shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 text-base">
                    <DownloadIcon className="w-5 h-5" />
                    {t('step3.cropper.download')}
                </button>
            </div>
        </div>
    );
};


const LoadingSpinner: React.FC<{ small?: boolean, text?: string }> = ({ small = false, text }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`border-hype-gray-200 border-t-hype-black rounded-full animate-spin ${small ? 'w-8 h-8 border-2' : 'w-12 h-12 border-4'}`}></div>
      {text && !small && <p className="text-hype-gray-600">{text}</p>}
    </div>
  );
};


const ImagePreviewModal: React.FC<{ 
    image: GeneratedImage; 
    index: number; 
    onClose: () => void; 
    isolatedFile: File | null;
}> = ({ image, index, onClose, isolatedFile }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'details' | 'cropping' | 'mockup_select' | 'mockup_loading' | 'mockup_result'>('details');
    const [mockupResult, setMockupResult] = useState<GeneratedImage | null>(null);
    const [mockupError, setMockupError] = useState<string | null>(null);

    const [copied, setCopied] = useState(false);
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(image.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const baseFilename = `hype-ai-image-${index + 1}`;
    
    const mockupOptions = [
        { id: 'tshirt', nameKey: 'step3.mockups.tshirt', icon: TshirtIcon, prompt: 'Place the provided product image realistically onto the front of a plain white t-shirt worn by a young adult model in a bright, outdoor urban setting. The product image should look like a high-quality print. The model should have a neutral expression.' },
        { id: 'billboard', nameKey: 'step3.mockups.billboard', icon: BuildingOfficeIcon, prompt: 'Place the provided product image onto a large billboard on the side of a modern skyscraper in a bustling city like Tokyo or New York at dusk. The billboard should be illuminated, and the scene should have a cinematic, slightly futuristic feel.' },
        { id: 'phone', nameKey: 'step3.mockups.phone', icon: DevicePhoneMobileIcon, prompt: 'Show the provided product image on the screen of a modern, sleek smartphone. The phone is being held by a person\'s hand against a blurred background of a trendy cafe. The screen should be bright and clear.' },
    ];

    const handleGenerateMockup = async (prompt: string) => {
        if (!isolatedFile) return;
        setView('mockup_loading');
        setMockupError(null);
        try {
            const result = await generateMockup(isolatedFile, prompt);
            setMockupResult(result);
            setView('mockup_result');
        } catch (err) {
            console.error("Mockup generation failed:", err);
            setMockupError(t('errors.generic'));
            setView('mockup_select'); // Go back to selection on error
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'cropping':
                return <ImageCropper imageSrc={image.src} baseFilename={baseFilename} />;
            case 'mockup_loading':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8">
                        <LoadingSpinner />
                        <h3 className="text-xl font-bold mt-4">{t('step3.mockups.generating')}</h3>
                    </div>
                );
            case 'mockup_result':
                return (
                    <div className="flex-grow md:w-2/3 flex flex-col items-center p-4">
                        <h3 className="text-2xl font-bold text-center mb-4">{t('step3.mockups.resultTitle')}</h3>
                        {mockupResult && <img src={mockupResult.src} alt="Generated mockup" className="w-full h-auto max-h-[60vh] object-contain rounded-lg bg-hype-gray-100" />}
                        <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button onClick={() => setView('mockup_select')} className="px-6 py-3 bg-hype-gray-100 text-hype-black font-semibold rounded-full shadow-sm hover:bg-hype-gray-200 transition-colors flex-1">{t('step3.mockups.createAnother')}</button>
                            <button onClick={() => handleDownload(mockupResult!, index, true)} className="px-6 py-3 bg-hype-yellow text-hype-black font-bold rounded-full shadow-lg hover:brightness-105 transition-all flex-1 flex items-center justify-center gap-2"><DownloadIcon className="w-5 h-5"/>{t('step3.modal.download')}</button>
                        </div>
                    </div>
                );
            case 'mockup_select':
                return (
                    <div className="w-full flex flex-col items-center p-4">
                         <h3 className="text-2xl font-bold text-center">{t('step3.mockups.title')}</h3>
                         <p className="text-hype-gray-600 mb-6">{t('step3.mockups.prompt')}</p>
                         {mockupError && <p className="text-red-500 text-sm mb-4">{mockupError}</p>}
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                            {mockupOptions.map(opt => (
                                <button key={opt.id} onClick={() => handleGenerateMockup(opt.prompt)} className="p-4 bg-hype-gray-100 rounded-xl hover:bg-hype-gray-200 transition-colors flex flex-col items-center justify-center gap-2">
                                    <opt.icon className="w-10 h-10 text-hype-black" />
                                    <span className="font-semibold">{t(opt.nameKey)}</span>
                                </button>
                            ))}
                         </div>
                    </div>
                );
            case 'details':
            default:
                return (
                    <>
                        <div className="flex-grow md:w-2/3 overflow-auto">
                            <img src={image.src} alt={`Preview of generated image ${index + 1}`} className="w-full h-auto object-contain rounded-lg bg-hype-gray-100" />
                        </div>
                        <div className="flex-shrink-0 md:w-1/3 flex flex-col gap-4">
                            <div className="relative p-3 bg-hype-gray-100 rounded-lg max-h-28 overflow-y-auto">
                                <p className="text-xs text-hype-gray-700 font-mono pr-10" title={image.prompt}>{image.prompt}</p>
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-hype-gray-500 hover:text-hype-black transition-colors"
                                    title={copied ? t('step3.card.copied') : t('step3.card.copyPrompt')}
                                >
                                    {copied ? <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg">{t('step3.modal.downloadTitle')}</h4>
                                <div className="group relative w-full">
                                    <button
                                        onClick={() => setView('mockup_select')}
                                        disabled={!isolatedFile}
                                        className="w-full px-6 py-3 bg-hype-black text-white font-bold rounded-full shadow-lg hover:bg-hype-gray-800 transition-all flex items-center justify-center gap-2 text-base disabled:bg-hype-gray-300 disabled:cursor-not-allowed"
                                    >
                                        <CubeIcon className="w-5 h-5" />
                                        {t('step3.card.createMockup')}
                                    </button>
                                    {!isolatedFile && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-hype-gray-800 p-3 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            {t('step3.mockups.noProductImage')}
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-hype-gray-800"></div>
                                        </div>
                                    )}
                                </div>
                                
                                 <button
                                    onClick={() => setView('cropping')}
                                    className="w-full px-6 py-3 bg-white border-2 border-hype-gray-800 text-hype-black font-bold rounded-full hover:bg-hype-gray-100 transition-all flex items-center justify-center gap-2 text-base"
                                >
                                    <ScissorsIcon className="w-5 h-5" />
                                    {t('step3.modal.cropImage')}
                                </button>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-hype-gray-200"></div>
                                    <span className="flex-shrink mx-4 text-xs text-hype-gray-400 font-medium">OR</span>
                                    <div className="flex-grow border-t border-hype-gray-200"></div>
                                </div>

                                <button onClick={() => handleDownload(image, index)} className="w-full px-6 py-3 bg-hype-yellow text-hype-black font-bold rounded-full shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 text-base">
                                    <DownloadIcon className="w-5 h-5" />
                                    {t('step3.modal.download')}
                                </button>

                            </div>
                        </div>
                    </>
                );
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] p-4 flex flex-col md:flex-row gap-4 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute -top-4 -right-4 bg-hype-black text-white rounded-full p-2 z-20 hover:scale-110 transition-transform"
                    aria-label={t('step3.modal.close')}
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                {view !== 'details' && (
                     <button 
                        onClick={() => setView('details')}
                        className="absolute top-4 left-4 bg-hype-gray-100 text-hype-black rounded-full p-2 z-20 hover:bg-hype-gray-200 transition-colors"
                        aria-label={t('step3.mockups.backToOriginal')}
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}
                {renderContent()}
            </div>
        </div>
    );
};

const ImageCard: React.FC<{
    image: GeneratedImage;
    index: number;
    isRegenerating: boolean;
    onRegenerateOne: (index: number) => void;
    onImageClick: (image: GeneratedImage, index: number) => void;
}> = ({ image, index, isRegenerating, onRegenerateOne, onImageClick }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            <div className="relative group bg-hype-gray-100 rounded-xl overflow-hidden shadow-sm aspect-square">
                <img 
                    src={image.src} 
                    alt={`Generated image ${index + 1}`} 
                    className={`w-full h-full object-cover transition-opacity duration-300 cursor-pointer ${isRegenerating ? 'opacity-30' : 'opacity-100'}`} 
                    onClick={() => !isRegenerating && onImageClick(image, index)}
                />
                 {isRegenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <LoadingSpinner small />
                    </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onImageClick(image, index); }}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                        title={t('step3.card.crop')}
                    >
                        <ScissorsIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRegenerateOne(index); }}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                        title={t('step3.card.regenerate')}
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoadingCard: React.FC = () => (
    <div className="aspect-square bg-hype-gray-200 rounded-xl animate-pulse">
    </div>
);

const ImageGrid: React.FC<{ 
    images: (GeneratedImage | null)[]; 
    isRegenerating: boolean[];
    onRegenerateOne: (index: number) => void;
    onImageClick: (image: GeneratedImage, index: number) => void;
}> = ({ images, isRegenerating, onRegenerateOne, onImageClick }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            {images.map((image, index) => (
                image ? (
                    <ImageCard
                        key={index}
                        image={image}
                        index={index}
                        isRegenerating={isRegenerating[index]}
                        onRegenerateOne={onRegenerateOne}
                        onImageClick={onImageClick}
                    />
                ) : (
                    <LoadingCard key={`loading-${index}`} />
                )
            ))}
        </div>
    );
};

const CaptionGenerator: React.FC<{
    isGenerating: boolean,
    captions: GeneratedCaption[],
    onGenerate: () => void,
}> = ({ isGenerating, captions, onGenerate }) => {
    const { t } = useTranslation();
    const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

    const handleCopy = (caption: GeneratedCaption) => {
        navigator.clipboard.writeText(caption.text);
        setCopiedStates(prev => ({...prev, [caption.id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({...prev, [caption.id]: false }));
        }, 2000);
    }

    return (
        <div className="w-full mt-12 p-6 bg-white rounded-2xl shadow-lg border border-hype-gray-200">
            <div className="flex items-center gap-3 mb-2">
                <DocumentTextIcon className="w-6 h-6 text-hype-black"/>
                <h3 className="text-xl font-bold">{t('step3.captions.title')}</h3>
            </div>
            <p className="text-hype-gray-600 mb-6">{t('step3.captions.prompt')}</p>
            
            {isGenerating ? (
                <div className="h-24 flex items-center justify-center">
                    <LoadingSpinner small text={t('step3.captions.loading')} />
                </div>
            ) : captions.length === 0 ? (
                <button 
                    onClick={onGenerate}
                    className="w-full py-3 bg-hype-black text-white font-bold rounded-lg shadow-sm hover:bg-hype-gray-800 transition-colors"
                >
                    {t('step3.captions.button')}
                </button>
            ) : (
                <div className="space-y-3">
                    {captions.map(caption => (
                        <div key={caption.id} className="relative p-3 bg-hype-gray-100 rounded-lg pr-12">
                            <p className="text-sm text-hype-gray-800">{caption.text}</p>
                            <button
                                onClick={() => handleCopy(caption)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-hype-gray-500 hover:text-hype-black transition-colors"
                                title={copiedStates[caption.id] ? t('step3.card.copied') : t('step3.card.copyPrompt')}
                            >
                                {copiedStates[caption.id] ? (
                                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <ClipboardIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const Step3Results: React.FC<Step3ResultsProps> = ({ 
    isLoading, 
    isRegenerating,
    images, 
    error, 
    onRegenerate, 
    onRegenerateOne,
    onChangeStyle,
    isGeneratingCaptions,
    generatedCaptions,
    onGenerateCaptions,
    isolatedFile,
    onSaveSession,
}) => {
    const [selectedImage, setSelectedImage] = useState<{image: GeneratedImage, index: number} | null>(null);
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveSession();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500); // Show success message for 2.5s
        } catch (err) {
            console.error("Failed to save session:", err);
            // Optionally show an error toast to the user
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return (
            <div className="w-full max-w-lg mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200">
                <h2 className="text-2xl font-bold text-red-600">{t('step3.error.title')}</h2>
                <p className="text-hype-gray-600 mt-2 mb-6">{error}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onChangeStyle} className="px-6 py-2 bg-hype-gray-100 text-hype-black font-semibold rounded-full hover:bg-hype-gray-200 transition-colors">
                        {t('step3.error.changeStyle')}
                    </button>
                    <button onClick={onRegenerate} className="px-6 py-2 bg-hype-black text-white font-semibold rounded-full hover:bg-hype-gray-800 transition-colors">
                        {t('step3.error.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    if (images.length === 0 && !isLoading) {
         return (
             <div className="w-full max-w-lg mx-auto text-center p-8">
                <h2 className="text-2xl font-bold">{t('step3.noImages.title')}</h2>
                <p className="text-hype-gray-600 mt-2">{t('step3.noImages.prompt')}</p>
             </div>
         )
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
            <div className="text-center mb-10">
                <p className="text-hype-gray-500 font-semibold">{t('step3.step')}</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
                    {isLoading ? t('step3.loadingTitle') : t('step3.title')}
                </h2>
                <p className="mt-2 text-hype-gray-600">
                     {isLoading ? t('step3.loadingPrompt') : t('step3.prompt')}
                </p>
            </div>

            <ImageGrid 
                images={images}
                isRegenerating={isRegenerating}
                onRegenerateOne={onRegenerateOne}
                onImageClick={(image, index) => setSelectedImage({image, index})}
            />

            {!isLoading && (
                <>
                    <div className="mt-8 flex items-center justify-center flex-wrap gap-4">
                        <button
                            onClick={onChangeStyle}
                            className="px-8 py-3 bg-hype-gray-100 text-hype-black font-semibold rounded-full shadow-sm hover:bg-hype-gray-200 transition-colors"
                        >
                            {t('step3.changeStyle')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || saveSuccess}
                            className="px-8 py-3 bg-white text-hype-black font-semibold rounded-full shadow-sm border border-hype-gray-300 hover:bg-hype-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-hype-gray-200 border-t-hype-black rounded-full animate-spin"></div>
                            ) : saveSuccess ? (
                                <CheckIcon className="w-5 h-5 text-green-500" />
                            ) : (
                                <BookmarkIcon className="w-5 h-5"/>
                            )}
                            {isSaving ? t('step3.session.saving') : saveSuccess ? t('step3.session.saved') : t('step3.session.save')}
                        </button>
                        <button
                            onClick={onRegenerate}
                            className="px-8 py-3 bg-hype-black text-white font-semibold rounded-full shadow-sm hover:bg-hype-gray-800 transition-colors flex items-center gap-2"
                        >
                            <RefreshIcon className="w-5 h-5"/>
                            {t('step3.regenerateAll')}
                        </button>
                    </div>

                    <CaptionGenerator
                        isGenerating={isGeneratingCaptions}
                        captions={generatedCaptions}
                        onGenerate={onGenerateCaptions}
                    />
                </>
            )}
            
            {selectedImage && (
                <ImagePreviewModal 
                    image={selectedImage.image}
                    index={selectedImage.index}
                    onClose={() => setSelectedImage(null)}
                    isolatedFile={isolatedFile}
                />
            )}
        </div>
    );
};

export default Step3Results;