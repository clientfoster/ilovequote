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
    <div className="mb-4 w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:px-6 md:py-4" id="wizard-container">
      <div className="hidden min-h-[28px] items-center md:flex" id="wizard-desktop">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isUpcoming = step.status === 'upcoming';
          const isClickable = !isUpcoming && !!onStepClick;

          return (
            <React.Fragment key={step.id}>
              <button
                id={`step-btn-${step.id}`}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={!isClickable}
                className="group flex shrink-0 items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 disabled:cursor-default"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-200 ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-100'
                      : isCurrent
                        ? 'border-[#7C9BF2] bg-white text-[#2563EB] shadow-sm shadow-blue-100'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.75]" /> : step.id}
                </span>

                <span className={`whitespace-nowrap text-[12px] font-semibold leading-none ${isCompleted ? 'text-[#2563EB]' : isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </button>

              {index < steps.length - 1 ? (
                <div
                  className={`mx-3 h-0.5 min-w-5 flex-1 rounded-full transition-colors duration-200 ${index < currentStep - 1 ? 'bg-[#8EA7F5]' : 'bg-slate-100'}`}
                  aria-hidden="true"
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className="space-y-3 md:hidden" id="wizard-mobile">
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
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-semibold transition-all ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-md shadow-blue-100'
                          : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.id}
                  </span>
                  <span
                    className={`text-[11px] font-medium leading-tight ${
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
