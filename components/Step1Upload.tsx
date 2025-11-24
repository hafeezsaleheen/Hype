import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { UploadIcon, EditIcon, WandSparklesIcon, TagIcon } from './icons';
import { useTranslation } from '../hooks/useTranslation';

interface Step1UploadProps {
  onImageUpload: (file: File) => void;
  onDescriptionSubmit: (description: string) => void;
  uploadedFile: File | null;
  onRemoveBackground: () => void;
  isProcessing: boolean;
  error: string | null;
  onEnhanceImage: () => void;
  isEnhancing: boolean;
  enhancedFile: File | null;
  productCategory: string;
  isCategorizing: boolean;
}

const Step1Upload: React.FC<Step1UploadProps> = ({ 
    onImageUpload, 
    onDescriptionSubmit, 
    uploadedFile, 
    onRemoveBackground, 
    isProcessing, 
    error,
    onEnhanceImage,
    isEnhancing,
    enhancedFile,
    productCategory,
    isCategorizing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  const previewUrl = useMemo(() => {
    const fileToPreview = enhancedFile || uploadedFile;
    if (fileToPreview) {
      return URL.createObjectURL(fileToPreview);
    }
    return null;
  }, [uploadedFile, enhancedFile]);

  // Clean up the object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    if (isProcessing || isEnhancing) return;
    fileInputRef.current?.click();
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isProcessing && !uploadedFile && !isEnhancing) setIsDragging(true);
  }, [isProcessing, uploadedFile, isEnhancing]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isProcessing || uploadedFile || isEnhancing) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload, isProcessing, uploadedFile, isEnhancing]);

  const handleSubmitDescription = (event: React.FormEvent) => {
    event.preventDefault();
    if (description.trim()) {
      onDescriptionSubmit(description.trim());
    }
  };

  const isAnyLoading = isProcessing || isEnhancing;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-hype-gray-200">
      <div className="text-left mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-hype-black">{t('step1.greeting')}</h2>
        <p className="text-hype-gray-600 mt-1">{t('step1.prompt')}</p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side: Upload */}
        <div className="flex flex-col">
          <div 
            onClick={!uploadedFile ? handleClick : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden flex-grow ${
              !uploadedFile && !isAnyLoading ? 'cursor-pointer' : ''
            } ${
              isDragging ? 'bg-hype-yellow/20 border-hype-yellow' : 'border-hype-gray-300'
            } ${
              !uploadedFile && 'hover:border-hype-yellow'
            } ${uploadedFile ? 'p-0' : 'p-6 bg-white'}`}
            style={{ minHeight: '250px' }}
          >
            {previewUrl && (
              <>
                <img src={previewUrl} alt={t('step1.upload.previewAlt')} className={`w-full h-full object-contain transition-opacity ${isAnyLoading ? 'opacity-50' : ''}`} />
                 {isAnyLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
                    <div className="w-8 h-8 border-2 border-hype-gray-200 border-t-hype-black rounded-full animate-spin mb-4"></div>
                    <h3 className="font-semibold text-hype-black">
                        {isEnhancing ? t('step1.enhance.enhancing') : t('step1.upload.removingBackground')}
                    </h3>
                  </div>
                )}
              </>
            )}

            {!previewUrl && (
               <>
                <div className="w-14 h-14 rounded-full bg-hype-yellow/20 flex items-center justify-center mb-4">
                  <UploadIcon className="w-8 h-8 text-hype-yellow" />
                </div>
                <h3 className="font-semibold text-hype-black">{t('step1.upload.title')}</h3>
                <p className="text-sm text-hype-gray-500 mt-1">{t('step1.upload.prompt')}</p>
              </>
            )}
          </div>
          {uploadedFile && (
            <div className="mt-4 text-center space-y-2">
                <div className="h-6">
                    {(isCategorizing || productCategory) && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-hype-gray-100 text-hype-gray-700 rounded-full text-sm">
                            {isCategorizing ? (
                                <>
                                    <div className="w-3 h-3 border border-hype-gray-300 border-t-hype-gray-500 rounded-full animate-spin"></div>
                                    <span>{t('step1.category.categorizing')}</span>
                                </>
                            ) : (
                                <>
                                    <TagIcon className="w-4 h-4" />
                                    <span>{t('step1.category.title')}: <b>{productCategory}</b></span>
                                </>
                            )}
                        </div>
                    )}
                </div>
              <div className="flex items-center gap-2">
                 <button
                    onClick={onEnhanceImage}
                    disabled={isAnyLoading || !!enhancedFile}
                    className="flex-1 px-4 py-3 bg-white text-hype-black font-bold rounded-lg border-2 border-hype-gray-800 hover:bg-hype-gray-100 transition-colors transform disabled:bg-hype-gray-200 disabled:border-hype-gray-200 disabled:text-hype-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                     <WandSparklesIcon className="w-5 h-5"/>
                     {enhancedFile ? t('step1.enhance.enhanced') : t('step1.enhance.enhance')}
                 </button>
                 <button
                    onClick={onRemoveBackground}
                    disabled={isAnyLoading}
                    className="flex-1 px-4 py-3 bg-hype-black text-white font-bold rounded-lg shadow-lg hover:bg-hype-gray-800 transition-colors transform hover:scale-105 disabled:bg-hype-gray-300 disabled:cursor-not-allowed"
                 >
                    {t('step1.upload.removeAndContinue')}
                 </button>
              </div>

              <button
                onClick={handleClick}
                className="mt-2 text-sm text-hype-gray-600 hover:text-hype-black font-semibold"
                disabled={isAnyLoading}
              >
                {t('step1.upload.change')}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Text Input */}
        <form onSubmit={handleSubmitDescription} className="p-6 bg-hype-gray-100 rounded-xl flex flex-col">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-white rounded-full border border-hype-gray-200">
                <EditIcon className="w-5 h-5 text-hype-gray-800" />
            </div>
            <h3 className="text-lg font-bold text-hype-black">{t('step1.text.title')}</h3>
          </div>
          <p className="text-sm text-hype-gray-600 mb-4 flex-grow">{t('step1.text.prompt')}</p>
          <input 
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('step1.text.placeholder')}
            className="w-full px-4 py-2 border border-hype-gray-300 rounded-md focus:ring-2 focus:ring-hype-yellow focus:border-hype-yellow outline-none transition-shadow mb-4"
            aria-label="Deskripsi Produk"
            disabled={!!uploadedFile || isAnyLoading}
          />
          <button
            type="submit"
            disabled={!description.trim() || !!uploadedFile || isAnyLoading}
            className="w-full px-4 py-3 bg-hype-gray-800 text-white font-semibold rounded-lg shadow-sm hover:bg-hype-black transition-colors disabled:bg-hype-gray-300 disabled:cursor-not-allowed"
          >
            {t('step1.text.button')}
          </button>
        </form>
      </div>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        aria-hidden="true"
        disabled={isAnyLoading}
      />
    </div>
  );
};

export default Step1Upload;