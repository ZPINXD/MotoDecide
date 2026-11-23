/**
 * Stepper — Alur pengisian SPK Motor Bekas
 * activeStep: 1 (Kuesioner), 2 (Filter), 3 (Hasil)
 */
export default function Stepper({ activeStep = 1 }) {
  const steps = [
    { number: 1, title: 'Preferensi', desc: 'Kuesioner AHP' },
    { number: 2, title: 'Filter Spesifikasi', desc: 'Budget & Kriteria' },
    { number: 3, title: 'Hasil Rekomendasi', desc: 'Peringkat Motor' },
  ];

  return (
    <div className="stepper-wrapper">
      <div className="stepper">
        {steps.map((step, index) => {
          const isDone = activeStep > step.number;
          const isActive = activeStep === step.number;
          return (
            <div
              key={step.number}
              className={`stepper-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            >
              <div className="stepper-circle">
                {isDone ? '✓' : step.number}
              </div>
              <div className="stepper-content">
                <div className="stepper-title">{step.title}</div>
                <div className="stepper-desc">{step.desc}</div>
              </div>
              {index < steps.length - 1 && <div className="stepper-line" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

