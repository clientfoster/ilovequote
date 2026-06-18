import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react';
import StepWizard from '../components/StepWizard';
import { QuoteWizardStep } from './WizardState';

interface StepNavigationProps {
  currentStep: QuoteWizardStep;
  onStepClick?: (step: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onReset?: () => void;
  nextLabel?: string;
}

export default function StepNavigation({
  currentStep,
  onStepClick,
  onBack,
  onNext,
  onSaveDraft,
  onReset,
  nextLabel,
}: StepNavigationProps) {
  return (
    <div className="space-y-4">
      <StepWizard currentStep={currentStep} onStepClick={onStepClick} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <Save size={14} />
              Save Draft
            </button>
          )}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              <span>{nextLabel || 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
