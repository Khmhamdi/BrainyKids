// Calcul de la paie selon le droit tunisien
// CNSS salarié : 9,68 %  |  CNSS patronal : 16,57 %  |  CSS : 0,45 % du brut imposable
// IRPP : barème progressif annualisé (annuel ÷ 12)
// Brut imposable = brut − CNSS
// Net = brut − CNSS − IRPP − CSS
//
// reversePayroll : calcul inverse — donne le brut à partir du net voulu

export interface PayrollBreakdown {
  gross:             number;
  cnssEmployee:      number;   // 9.68% × gross
  cnssEmployer:      number;   // 16.57% × gross
  brutImposable:     number;   // gross − cnssEmployee
  irpp:              number;   // retenue à la source mensuelle
  css:               number;   // 0.45% × brutImposable
  net:               number;   // gross − cnssEmployee − irpp − css
  totalEmployerCost: number;   // gross + cnssEmployer
}

// Rates used in calculation — editable via localStorage key "payroll_settings"
export function getPayrollRates() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("payroll_settings");
      if (saved) {
        const s = JSON.parse(saved);
        return {
          CNSS_EMP: (s.cnssEmployee ?? 9.68) / 100,
          CNSS_PAT: (s.cnssEmployer ?? 16.57) / 100,
          CSS_RATE: (s.cssRate ?? 0.45) / 100,
        };
      }
    } catch {}
  }
  return { CNSS_EMP: 0.0968, CNSS_PAT: 0.1657, CSS_RATE: 0.0045 };
}

export function calculatePayroll(
  grossMonthly: number,
  rates?: { CNSS_EMP: number; CNSS_PAT: number; CSS_RATE: number },
): PayrollBreakdown {
  const { CNSS_EMP, CNSS_PAT, CSS_RATE } = rates ?? { CNSS_EMP: 0.0968, CNSS_PAT: 0.1657, CSS_RATE: 0.0045 };

  const cnssEmployee  = grossMonthly * CNSS_EMP;
  const cnssEmployer  = grossMonthly * CNSS_PAT;
  const brutImposable = grossMonthly - cnssEmployee;

  // IRPP — annualisé puis ramené au mois
  const annualBrutImp = brutImposable * 12;
  const abattement    = Math.min(annualBrutImp * 0.10, 2000); // 10 %, plafond 2 000 DT/an
  const annualTaxable = Math.max(0, annualBrutImp - abattement);

  let annualIRPP = 0;
  if      (annualTaxable > 50000) annualIRPP = 15000*0.15 + 10000*0.25 + 20000*0.30 + (annualTaxable - 50000)*0.35;
  else if (annualTaxable > 30000) annualIRPP = 15000*0.15 + 10000*0.25 + (annualTaxable - 30000)*0.30;
  else if (annualTaxable > 20000) annualIRPP = 15000*0.15 + (annualTaxable - 20000)*0.25;
  else if (annualTaxable > 5000)  annualIRPP = (annualTaxable - 5000) * 0.15;

  const monthlyIRPP = annualIRPP / 12;
  const css         = brutImposable * CSS_RATE;
  const net         = grossMonthly - cnssEmployee - monthlyIRPP - css;

  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    gross:             r(grossMonthly),
    cnssEmployee:      r(cnssEmployee),
    cnssEmployer:      r(cnssEmployer),
    brutImposable:     r(brutImposable),
    irpp:              r(monthlyIRPP),
    css:               r(css),
    net:               r(net),
    totalEmployerCost: r(grossMonthly + cnssEmployer),
  };
}

/**
 * Calcul inverse : trouve le brut mensuel qui produit exactement `targetNet` DT net.
 * Résolution par dichotomie (60 itérations → précision < 0,001 DT).
 */
export function reversePayroll(targetNet: number): PayrollBreakdown {
  if (targetNet <= 0) return calculatePayroll(0);

  const rates = getPayrollRates();

  let lo = targetNet;
  let hi = targetNet * 2;

  while (calculatePayroll(hi, rates).net < targetNet) hi *= 2;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (calculatePayroll(mid, rates).net < targetNet) lo = mid;
    else hi = mid;
    if (hi - lo < 0.0001) break;
  }

  // Borne supérieure arrondie au millime supérieur → net affiché ≥ net demandé
  const gross = Math.ceil(hi * 1000) / 1000;
  return calculatePayroll(gross, rates);
}
