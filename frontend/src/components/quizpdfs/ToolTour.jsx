import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const ToolTour = ({ steps, toolName, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementRect, setElementRect] = useState(null);
  const [maskId] = useState(`spotlight-mask-${Math.random().toString(36).substr(2, 9)}`);

  const currentStep_data = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    const updateElementPosition = () => {
      const element = document.querySelector(currentStep_data.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateElementPosition();
    const timer = setTimeout(updateElementPosition, 500);
    window.addEventListener('resize', updateElementPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateElementPosition);
    };
  }, [currentStep_data.selector]);

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(`${toolName}_tourSeen`, 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(`${toolName}_tourSeen`, 'true');
    onClose();
  };

  return (
    <>
      {/* Overlay with spotlight */}
      <div className="fixed inset-0 z-[9999]" style={{ background: 'rgba(26, 46, 35, 0.75)' }}>
        {/* SVG for spotlight effect */}
        {elementRect && (
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={elementRect.left - 12}
                  y={elementRect.top - 12}
                  width={elementRect.width + 24}
                  height={elementRect.height + 24}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(26, 46, 35, 0.4)"
              mask={`url(#${maskId})`}
            />
          </svg>
        )}
      </div>

      {/* Highlight border around element */}
      {elementRect && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: elementRect.top - 12,
            left: elementRect.left - 12,
            width: elementRect.width + 24,
            height: elementRect.height + 24,
            border: '2px solid ' + currentStep_data.arrowColor,
            borderRadius: '16px',
            boxShadow: `0 0 0 3px rgba(232, 130, 12, 0.1), inset 0 0 20px ${currentStep_data.arrowColor}22`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Tooltip with info */}
      {elementRect && (
        <div
          className="fixed z-[9999] bg-white rounded-2xl shadow-2xl p-6 max-w-sm"
          style={{
            top: (() => {
              const tooltipHeight = 280; // Approximate height of tooltip
              const bottomPosition = elementRect.top + elementRect.height + 20;
              
              // If tooltip would go below viewport, position it above instead
              if (bottomPosition + tooltipHeight > window.innerHeight - 20) {
                return Math.max(20, elementRect.top - tooltipHeight - 20);
              }
              return bottomPosition;
            })(),
            left: (() => {
              const tooltipWidth = 400;
              const idealLeft = elementRect.left + elementRect.width / 2 - tooltipWidth / 2;
              const minLeft = 20;
              const maxLeft = Math.max(20, window.innerWidth - tooltipWidth - 20);
              return Math.max(minLeft, Math.min(maxLeft, idealLeft));
            })()
          }}
        >
          {/* Arrow pointing to element */}
          <div
            className="absolute w-3 h-3 bg-white transform rotate-45"
            style={{
              ...((() => {
                const tooltipHeight = 280;
                const bottomPosition = elementRect.top + elementRect.height + 20;
                const isBelow = bottomPosition + tooltipHeight <= window.innerHeight - 20;
                
                return isBelow
                  ? {
                      top: '-6px',
                      left: '50%',
                      marginLeft: '-6px'
                    }
                  : {
                      bottom: '-6px',
                      left: '50%',
                      marginLeft: '-6px'
                    };
              })())
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Step counter */}
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#1E4D35' }}>
              Step {currentStep + 1} of {steps.length}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1A2E23' }}>
              {currentStep_data.title}
            </h3>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#3D5246' }}>
              {currentStep_data.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: idx === currentStep ? '24px' : '6px',
                      background: idx === currentStep ? '#E8820C' : '#D8E8DC'
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(232, 130, 12, 0.1)',
                    color: '#E8820C',
                    border: '1px solid rgba(232, 130, 12, 0.3)'
                  }}
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg font-medium text-white transition-all"
                  style={{ background: '#E8820C' }}
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 p-1 rounded-lg transition-colors"
              style={{ color: '#7A9080' }}
              title="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(232, 130, 12, 0.1), inset 0 0 20px ${currentStep_data?.arrowColor}22;
          }
          50% {
            box-shadow: 0 0 0 6px rgba(232, 130, 12, 0.15), inset 0 0 30px ${currentStep_data?.arrowColor}33;
          }
        }
      `}</style>
    </>
  );
};

export default ToolTour;
