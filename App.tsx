import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppStep, StyleOption, ManualSettings, GeneratedImage, GeneratedCaption } from './types';
import Header from './components/Header';
import Step1Upload from './components/Step1Upload';
import Step2StyleSelection from './components/Step2StyleSelection';
import Step3Results from './components/Step3Results';
import { 
  generateProductImages, 
  generateProductImagesFromText, 
  generateProductImagesWithReference, 
  generateProductImagesFromTextWithReference,
  generateSingleImageWithFile,
  generateSingleImageFromText,
  generateSingleImageWithReference,
  generateSingleImageFromTextWithReference,
  recommendStyles,
  removeBackground,
  generateCaptions,
  enhanceImage,
  categorizeProduct,
  enhancePrompt,
} from './services/geminiService';
import { STYLE_OPTIONS } from './constants';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslation } from './hooks/useTranslation';
import { fileToDataUrl, dataUrlToFile } from './utils/fileUtils';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false); // Flag to prevent saving during initial load

  // Load synchronous state from localStorage on initial render
  const [initialState] = useState(() => {
    try {
      const savedResults = localStorage.getItem('hype-ai-saved-results');
      if (savedResults) {
          const parsed = JSON.parse(savedResults);
          return {
              ...parsed,
              step: AppStep.RESULTS,
              isLoadedFromSave: true, // Flag to indicate we are loading a completed session
          };
      }

      const savedSession = localStorage.getItem('hype-ai-session');
      if (!savedSession) return {};
      const parsed = JSON.parse(savedSession);
      
      // Re-find the style object from its ID
      if (parsed.selectedStyleId) {
        parsed.selectedStyle = STYLE_OPTIONS.find(s => s.id === parsed.selectedStyleId) || null;
      }
      return parsed;
    } catch (error) {
      console.error("Failed to load session:", error);
      localStorage.removeItem('hype-ai-session');
      localStorage.removeItem('hype-ai-saved-results');
      return {};
    }
  });

  const [step, setStep] = useState<AppStep>(initialState.step || AppStep.UPLOAD);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [productDescription, setProductDescription] = useState<string>(initialState.productDescription || '');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(initialState.selectedStyle || null);
  const [generatedImages, setGeneratedImages] = useState<(GeneratedImage | null)[]>(initialState.generatedImages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  // State for new interactive styles
  const [customPrompt, setCustomPrompt] = useState<string>(initialState.customPrompt || '');
  const [manualSettings, setManualSettings] = useState<ManualSettings>(initialState.manualSettings || { background: '', lighting: t('step2.manual.lighting.option1'), props: '' });
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  
  // State for AI style recommendations
  const [recommendedStyleIds, setRecommendedStyleIds] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  // State for new features
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isolatedFile, setIsolatedFile] = useState<File | null>(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>(initialState.generatedCaptions || []);
  const [negativePrompt, setNegativePrompt] = useState<string>(initialState.negativePrompt || '');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedFile, setEnhancedFile] = useState<File | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [productCategory, setProductCategory] = useState<string>(initialState.productCategory || '');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Hydrate file states from data URLs on mount
  useEffect(() => {
    const hydrateFiles = async () => {
      try {
        if (initialState.isLoadedFromSave) {
            if (initialState.isolatedFileDataUrl) {
                const file = await dataUrlToFile(initialState.isolatedFileDataUrl, 'isolated-product.png');
                setIsolatedFile(file);
            }
        } else {
            // Hydrate original uploaded file first
            if (initialState.uploadedFileDataUrl) {
              const file = await dataUrlToFile(initialState.uploadedFileDataUrl, initialState.uploadedFileName || 'uploaded-image.png');
              setUploadedFile(file);
            }
            // Then hydrate isolated file if it exists
            if (initialState.isolatedFileDataUrl) {
              const file = await dataUrlToFile(initialState.isolatedFileDataUrl, initialState.isolatedFileName || 'isolated-product.png');
              setIsolatedFile(file);
            }
            // Then hydrate reference file
            if (initialState.referenceFileDataUrl) {
               const file = await dataUrlToFile(initialState.referenceFileDataUrl, initialState.referenceFileName || 'reference-image.png');
               setReferenceFile(file);
            }
             // Then hydrate enhanced file
            if (initialState.enhancedFileDataUrl) {
               const file = await dataUrlToFile(initialState.enhancedFileDataUrl, initialState.enhancedFileName || 'enhanced-image.png');
               setEnhancedFile(file);
            }
        }
      } catch (err) {
        console.error("Failed to hydrate files from session, clearing session.", err);
        localStorage.removeItem('hype-ai-session');
        localStorage.removeItem('hype-ai-saved-results');
      } finally {
        setIsLoaded(true); // Mark loading as complete
      }
    };
    hydrateFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    // Clear in-progress session once results are generated
    if (step === AppStep.RESULTS) {
        localStorage.removeItem('hype-ai-session');
        return;
    }

    const saveSession = async () => {
      try {
        const session: any = {
          step,
          productDescription,
          selectedStyleId: selectedStyle?.id,
          customPrompt,
          manualSettings,
          negativePrompt,
          productCategory,
        };

        // Save original uploaded file if it exists
        if (uploadedFile) {
          session.uploadedFileDataUrl = await fileToDataUrl(uploadedFile);
          session.uploadedFileName = uploadedFile.name;
        }

        // Save isolated file if it exists
        if (isolatedFile) {
          session.isolatedFileDataUrl = await fileToDataUrl(isolatedFile);
          session.isolatedFileName = isolatedFile.name;
        }

        if (referenceFile) {
          session.referenceFileDataUrl = await fileToDataUrl(referenceFile);
          session.referenceFileName = referenceFile.name;
        }
        
        if (enhancedFile) {
          session.enhancedFileDataUrl = await fileToDataUrl(enhancedFile);
          session.enhancedFileName = enhancedFile.name;
        }

        localStorage.setItem('hype-ai-session', JSON.stringify(session));
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    };
    
    saveSession();
  }, [isLoaded, step, productDescription, selectedStyle, customPrompt, manualSettings, uploadedFile, isolatedFile, referenceFile, negativePrompt, enhancedFile, productCategory]);

  useEffect(() => {
    if (step === AppStep.STYLE_SELECTION && (isolatedFile || productDescription)) {
      const fetchRecommendations = async () => {
        setIsRecommending(true);
        setRecommendedStyleIds([]);
        try {
          const styleListForModel = STYLE_OPTIONS
            .filter(style => !['custom', 'manual', 'reference'].includes(style.id))
            .map(style => ({
              id: style.id,
              name: t(style.nameKey),
            }));
          
          const recommendations = await recommendStyles(isolatedFile, productDescription, styleListForModel);
          setRecommendedStyleIds(recommendations);
        } catch (err) {
          console.error("Failed to fetch style recommendations:", err);
        } finally {
          setIsRecommending(false);
        }
      };
      fetchRecommendations();
    }
  }, [step, isolatedFile, productDescription, t]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('hype-ai-session');
    localStorage.removeItem('hype-ai-saved-results');
    setStep(AppStep.UPLOAD);
    setUploadedFile(null);
    setIsolatedFile(null);
    setProductDescription('');
    setSelectedStyle(null);
    setGeneratedImages([]);
    setIsLoading(false);
    setIsRegenerating([]);
    setError(null);
    setCustomPrompt('');
    setManualSettings({ background: '', lighting: t('step2.manual.lighting.option1'), props: '' });
    setReferenceFile(null);
    setRecommendedStyleIds([]);
    setIsRecommending(false);
    setGeneratedCaptions([]);
    setNegativePrompt('');
    setEnhancedFile(null);
    setProductCategory('');
  }, [t]);

  const handleImageUpload = useCallback((file: File) => {
    setUploadedFile(file);
    // Reset states derived from the previous image
    setEnhancedFile(null);
    setProductCategory('');
    setProductDescription('');
    setIsolatedFile(null);
    setError(null);
    
    // Automatically categorize the new product image
    const categorize = async () => {
        setIsCategorizing(true);
        try {
            const category = await categorizeProduct(file);
            setProductCategory(category);
        } catch (err) {
            console.error("Product categorization failed:", err);
        } finally {
            setIsCategorizing(false);
        }
    };
    categorize();
  }, []);
  
  const handleEnhanceImage = useCallback(async () => {
      if (!uploadedFile) return;
      
      setIsEnhancing(true);
      setError(null);
      try {
          const enhanced = await enhanceImage(uploadedFile);
          setEnhancedFile(enhanced);
      } catch(err) {
          setError(t('errors.enhancementFailed'));
      } finally {
          setIsEnhancing(false);
      }
  }, [uploadedFile, t]);

  const handleRemoveBackground = useCallback(async () => {
    const fileToProcess = enhancedFile || uploadedFile;
    if (!fileToProcess) return;
    
    setIsRemovingBackground(true);
    setError(null);
    try {
      const isolated = await removeBackground(fileToProcess);
      setIsolatedFile(isolated);
      setStep(AppStep.STYLE_SELECTION);
    } catch(err) {
      setError(t('errors.backgroundRemoval'));
    } finally {
      setIsRemovingBackground(false);
    }
  }, [uploadedFile, enhancedFile, t]);
  
  const handleDescriptionSubmit = useCallback((description: string) => {
    setProductDescription(description);
    setUploadedFile(null);
    setIsolatedFile(null);
    setEnhancedFile(null);
    setProductCategory('');
    setStep(AppStep.STYLE_SELECTION);
  }, []);

  const handleGenerate = useCallback(async () => {
    const productInput = isolatedFile || productDescription;
    if (!productInput || !selectedStyle) {
      setError(t('errors.missingProduct'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages(new Array(4).fill(null)); // Initialize with placeholders
    setGeneratedCaptions([]);
    setStep(AppStep.RESULTS);

    try {
      let imagePromises: Promise<GeneratedImage>[];
      let promptToUse = selectedStyle.prompt;
      const lightingText = manualSettings.lighting === t('step2.manual.lighting.option1') ? "Soft studio light" 
                         : manualSettings.lighting === t('step2.manual.lighting.option2') ? "Natural sunlight" 
                         : "Dramatic cinematic lighting";

      switch(selectedStyle.id) {
        case 'custom':
          if (!customPrompt.trim()) throw new Error('errors.customPrompt');
          promptToUse = customPrompt;
          break;
        case 'manual':
          promptToUse = `Professional product photo. Background: ${manualSettings.background || 'neutral'}. Lighting: ${lightingText}. Props: ${manualSettings.props || 'minimalist'}.`;
          break;
        case 'reference': {
          if (!referenceFile) throw new Error('errors.referenceFile');
          const refPrompt = isolatedFile 
            ? "Take the product from the first image and place it in an environment with the same style, lighting, and composition as the second image. The product from the first image must be the main subject."
            : "Create a product photo from the given description in an environment with the same style, lighting, and composition as the reference image.";

          if (isolatedFile) {
            imagePromises = generateProductImagesWithReference(isolatedFile, referenceFile, refPrompt, negativePrompt);
          } else {
            imagePromises = generateProductImagesFromTextWithReference(productDescription, referenceFile, refPrompt, negativePrompt);
          }
          break;
        }
        default: {
            if (isolatedFile) {
                imagePromises = generateProductImages(isolatedFile, promptToUse, negativePrompt);
            } else {
                imagePromises = generateProductImagesFromText(productDescription, promptToUse, negativePrompt);
            }
        }
      }
      
      imagePromises.forEach((promise, index) => {
        promise.then(image => {
            setGeneratedImages(prev => {
                const next = [...prev];
                if (index < next.length) {
                    next[index] = image;
                }
                return next;
            });
        }).catch(err => {
            console.error(`Image ${index} failed to generate:`, err);
        });
      });
      
      await Promise.all(imagePromises);
      setIsRegenerating(new Array(imagePromises.length).fill(false));

    } catch (err: any) {
      console.error(err);
      
      setError(t(err.message) || t('errors.generic'));
      setStep(AppStep.STYLE_SELECTION);
    } finally {
      setIsLoading(false);
    }
  }, [isolatedFile, productDescription, selectedStyle, customPrompt, manualSettings, referenceFile, t, negativePrompt]);

  const handleRegenerateOne = useCallback(async (index: number) => {
    const productInput = isolatedFile || productDescription;
    if (!productInput || !selectedStyle) {
      setError(t('errors.contextLost'));
      return;
    }

    setIsRegenerating(prev => {
        const next = [...prev];
        next[index] = true;
        return next;
    });

    try {
        let newImage: GeneratedImage;
        let promptToUse = selectedStyle.prompt;
        const lightingText = manualSettings.lighting === t('step2.manual.lighting.option1') ? "Soft studio light" 
                         : manualSettings.lighting === t('step2.manual.lighting.option2') ? "Natural sunlight" 
                         : "Dramatic cinematic lighting";

        switch(selectedStyle.id) {
            case 'custom':
                promptToUse = customPrompt;
                break;
            case 'manual':
                promptToUse = `Professional product photo. Background: ${manualSettings.background || 'neutral'}. Lighting: ${lightingText}. Props: ${manualSettings.props || 'minimalist'}.`;
                break;
            case 'reference':
                if (!referenceFile) throw new Error('errors.referenceNotFound');
                const refPrompt = isolatedFile 
                    ? "Take the product from the first image and place it in an environment with the same style, lighting, and composition as the second image. The product from the first image must be the main subject."
                    : "Create a product photo from the given description in an environment with the same style, lighting, and composition as the reference image.";
                
                if (isolatedFile) {
                    newImage = await generateSingleImageWithReference(isolatedFile, referenceFile, refPrompt, negativePrompt);
                } else {
                    newImage = await generateSingleImageFromTextWithReference(productDescription, referenceFile, refPrompt, negativePrompt);
                }
                setGeneratedImages(prev => {
                    const next = [...prev];
                    next[index] = newImage;
                    return next;
                });
                return;
        }

        if (isolatedFile) {
            newImage = await generateSingleImageWithFile(isolatedFile, promptToUse, negativePrompt);
        } else {
             const fullPrompt = `A professional product photograph of ${productDescription}. Style: ${promptToUse}`;
            newImage = await generateSingleImageFromText(fullPrompt, negativePrompt);
        }
        
        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = newImage;
            return next;
        });

    } catch (err: any) {
        console.error("Single image regeneration failed:", err);
    } finally {
        setIsRegenerating(prev => {
            const next = [...prev];
            next[index] = false;
            return next;
        });
    }
  }, [isolatedFile, productDescription, selectedStyle, customPrompt, manualSettings, referenceFile, t, negativePrompt]);

  const handleGenerateCaptions = useCallback(async () => {
    if (!selectedStyle) return;
    
    let info = productDescription;
    if (!info && (productCategory)) {
        info = productCategory;
    }
    // If we have an image but no description, create a basic description.
    if (!info && (uploadedFile || isolatedFile)) {
      info = uploadedFile?.name.split('.')[0].replace(/[-_]/g, ' ') || 'this product';
    }
    if (!info) return; // Can't generate captions with no context

    setIsGeneratingCaptions(true);
    try {
      const captions = await generateCaptions(info, t(selectedStyle.nameKey));
      setGeneratedCaptions(captions.map((text, index) => ({ id: index, text })));
    } catch(err) {
      console.error("Caption generation failed:", err);
    } finally {
      setIsGeneratingCaptions(false);
    }
  }, [productDescription, isolatedFile, uploadedFile, selectedStyle, t, productCategory]);
  
  const handleEnhancePrompt = useCallback(async () => {
      if (!customPrompt.trim()) return;
      
      const context = productDescription || productCategory || "a product";

      setIsEnhancingPrompt(true);
      try {
          const enhanced = await enhancePrompt(customPrompt, context);
          setCustomPrompt(enhanced);
      } catch (err) {
          console.error("Prompt enhancement failed:", err);
      } finally {
          setIsEnhancingPrompt(false);
      }
  }, [customPrompt, productDescription, productCategory]);

  const handleSaveSession = useCallback(async () => {
    if (generatedImages.length === 0) return;

    // Convert blob URLs to data URLs for persistent storage
    const imagesToSave = await Promise.all(
        generatedImages.map(async (img) => {
            if (!img || !img.src.startsWith('blob:')) return img;
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                const dataUrl = await fileToDataUrl(new File([blob], "generated.png", { type: blob.type }));
                return { ...img, src: dataUrl };
            } catch (e) {
                console.error("Failed to convert blob to data URL", e);
                return null; // Skip images that fail to convert
            }
        })
    );
    
    const sessionData: any = {
        generatedImages: imagesToSave.filter(Boolean),
        generatedCaptions,
    };

    if (isolatedFile) {
        sessionData.isolatedFileDataUrl = await fileToDataUrl(isolatedFile);
    }

    localStorage.setItem('hype-ai-saved-results', JSON.stringify(sessionData));
  }, [generatedImages, generatedCaptions, isolatedFile]);
  
  const isContinueDisabled = () => {
    if (isRemovingBackground || isEnhancing) return true;
    if (step === AppStep.STYLE_SELECTION) {
      if (!selectedStyle || isLoading) return true;
      if (selectedStyle.id === 'custom' && !customPrompt.trim()) return true;
      if (selectedStyle.id === 'manual' && !manualSettings.background.trim() && !manualSettings.props.trim()) return true;
      if (selectedStyle.id === 'reference' && !referenceFile) return true;
    }
    return false;
  }

  const renderStep = () => {
    switch (step) {
      case AppStep.UPLOAD:
        return <Step1Upload 
                  onImageUpload={handleImageUpload} 
                  onDescriptionSubmit={handleDescriptionSubmit} 
                  uploadedFile={uploadedFile}
                  onRemoveBackground={handleRemoveBackground}
                  isProcessing={isRemovingBackground}
                  error={error}
                  onEnhanceImage={handleEnhanceImage}
                  isEnhancing={isEnhancing}
                  enhancedFile={enhancedFile}
                  productCategory={productCategory}
                  isCategorizing={isCategorizing}
               />;
      case AppStep.STYLE_SELECTION:
        return (
          <Step2StyleSelection
            styleOptions={STYLE_OPTIONS}
            selectedStyle={selectedStyle}
            onStyleSelect={setSelectedStyle}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            manualSettings={manualSettings}
            onManualSettingsChange={setManualSettings}
            referenceFile={referenceFile}
            onReferenceFileUpload={setReferenceFile}
            isRecommending={isRecommending}
            recommendedStyleIds={recommendedStyleIds}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            onEnhancePrompt={handleEnhancePrompt}
            isEnhancingPrompt={isEnhancingPrompt}
          />
        );
      case AppStep.RESULTS:
        return <Step3Results 
          isLoading={isLoading} 
          isRegenerating={isRegenerating}
          images={generatedImages} 
          error={error} 
          onRegenerate={handleGenerate}
          onRegenerateOne={handleRegenerateOne}
          onChangeStyle={() => { setGeneratedCaptions([]); setStep(AppStep.STYLE_SELECTION); }}
          isGeneratingCaptions={isGeneratingCaptions}
          generatedCaptions={generatedCaptions}
          onGenerateCaptions={handleGenerateCaptions}
          isolatedFile={isolatedFile}
          onSaveSession={handleSaveSession}
        />;
      default:
        return <Step1Upload 
                  onImageUpload={handleImageUpload} 
                  onDescriptionSubmit={handleDescriptionSubmit} 
                  uploadedFile={uploadedFile}
                  onRemoveBackground={handleRemoveBackground}
                  isProcessing={isRemovingBackground}
                  error={error}
                  onEnhanceImage={handleEnhanceImage}
                  isEnhancing={isEnhancing}
                  enhancedFile={enhancedFile}
                  productCategory={productCategory}
                  isCategorizing={isCategorizing}
               />;
    }
  };
  
  const getFooterButtonText = () => {
      if (isRemovingBackground) return t('step1.upload.removingBackground');
      if (isLoading) return t('footer.generating');

      switch (step) {
        case AppStep.STYLE_SELECTION:
          return t('footer.continue');
        case AppStep.RESULTS:
          return t('footer.startOver');
        default:
          return t('footer.continue');
      }
  }

  return (
    <div className="min-h-screen bg-hype-gray-100 font-sans text-hype-black flex flex-col items-center antialiased">
      <Header showControls={step > AppStep.UPLOAD} onReset={handleReset} />
      <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col items-center p-4 md:p-8">
        {step === AppStep.UPLOAD && (
            <div className="text-center pb-8 md:pb-12 px-4">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-hype-black leading-tight">
                    <div className="flex items-center justify-center gap-x-3 mb-1">
                        <div className="bg-hype-black text-white rounded-full flex items-center justify-center font-bold w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-3xl sm:text-4xl md:text-5xl shrink-0">
                            h
                        </div>
                        hype.
                    </div>
                    AI Pocket<br/>Photography Studio
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-hype-gray-600">
                    {t('app.description')}
                </p>
            </div>
        )}
        {renderStep()}
      </main>
      {/* Footer is only shown after an initial action (upload/description) or on later steps */}
      {(step === AppStep.STYLE_SELECTION || step === AppStep.RESULTS) ? (
        <footer className="w-full p-4 sticky bottom-0 bg-white border-t border-hype-gray-200 flex justify-center">
           <div className="flex items-center gap-4">
              {step > AppStep.UPLOAD && !isLoading && (
                  <button
                  onClick={() => {
                    if (step === AppStep.RESULTS) { setGeneratedCaptions([]); setStep(AppStep.STYLE_SELECTION); }
                    else if (step === AppStep.STYLE_SELECTION) { handleReset(); } // Go back to start from style selection
                    else setStep(step - 1)
                  }}
                  className="px-6 sm:px-8 py-3 bg-hype-gray-100 text-hype-black font-semibold rounded-full shadow-sm hover:bg-hype-gray-200 transition-colors"
                  >
                  {t('footer.back')}
                  </button>
              )}
              <button
                  onClick={() => {
                      if (step === AppStep.STYLE_SELECTION) handleGenerate();
                      else if (step === AppStep.RESULTS) handleReset();
                  }}
                  disabled={isContinueDisabled()}
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-hype-black text-white font-bold rounded-full shadow-lg hover:bg-hype-gray-800 transition-transform transform hover:scale-105 disabled:bg-hype-gray-300 disabled:cursor-not-allowed disabled:scale-100"
              >
                  {getFooterButtonText()}
              </button>
          </div>
        </footer>
      ) : null}
      <footer className="w-full p-4 text-center text-sm text-hype-gray-500">
        <p>{t('footer.copyright')}</p>
        <p>{t('footer.developer')}</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);


export default App;