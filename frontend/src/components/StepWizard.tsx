import React from 'react';
import { Check } from 'lucide-react';
import { StepItem } from '../types';

interface StepWizardProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export default function StepWizard({ currentStep, onStepClick }: StepWizardProps) {
  const steps: StepItem[] = [
    { id: 1, name: 'Business', label: 'Business info', status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming' },
    { id: 2, name: 'Client', label: 'Client details', status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming' },
    { id: 3, name: 'Items', label: 'Line items', status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming' },
    { id: 4, name: 'Preview', label: 'Review & Send', status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming' },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs mb-6" id="wizard-container">
      <div className="hidden md:flex items-center justify-between" id="wizard-desktop">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed' || (step.id === 1 && currentStep >= 1);
          const isCurrent = step.status === 'current';
          const isClickable = !!onStepClick;

          return (
            <React.Fragment key={step.id}>
              <button
                id={`step-btn-${step.id}`}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={!isClickable}
                className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer shrink-0"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                        ? 'border-2 border-[#2563EB] bg-white text-[#2563EB]'
                        : 'border-2 border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.id}
                </span>

                <span
                  className={`text-xs font-bold ${
                    isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 px-3">
                  <div className="h-px bg-slate-200 w-full" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="md:hidden space-y-3" id="wizard-mobile">
        <div className="relative px-1 pt-1">
          <div className="absolute left-4 right-4 top-[18px] h-px bg-slate-200" />
          <div className="absolute left-4 top-[18px] h-px bg-[#2563EB] transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />

          <div className="relative flex items-start justify-between">
            {steps.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isUpcoming = currentStep < step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className="flex flex-col items-center gap-2 min-w-0 flex-1"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-bold transition-all ${
                      isCompleted
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : isCurrent
                          ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.id}
                  </span>
                  <span
                    className={`text-[11px] font-semibold leading-tight ${
                      isCurrent ? 'text-slate-900' : isUpcoming ? 'text-slate-400' : 'text-[#2563EB]'
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {steps[currentStep - 1]?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
