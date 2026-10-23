export type SalesGroupBy = 'day' | 'week' | 'month';

// Totales crudos de ventas en un periodo
export interface SalesTotals {
  total: number;
  count: number;
}

export interface SalesPeriodSummary extends SalesTotals {
  averageTicket: number;
}

// Totales de hoy, semana (lunes a domingo), mes y año en curso
export interface SalesSummaryRaw {
  today: SalesTotals;
  week: SalesTotals;
  month: SalesTotals;
  year: SalesTotals;
}

export interface SalesSummary {
  timezone: string;
  generatedAt: Date;
  today: SalesPeriodSummary;
  week: SalesPeriodSummary;
  month: SalesPeriodSummary;
  year: SalesPeriodSummary;
}

export interface EmployeeSalesRaw extends SalesTotals {
  employeeId: number;
  name: string;
  available: boolean;
}

export interface EmployeeSales extends EmployeeSalesRaw {
  averageTicket: number;
  percentage: number; // % del total de ventas del rango
}

export interface SalesByEmployee {
  from: string;
  to: string;
  total: number;
  count: number;
  employees: EmployeeSales[];
}

// Ventas de un empleado dentro de un periodo (segmentos de la barra apilada)
export interface EmployeeSalesPoint extends SalesTotals {
  employeeId: number;
}

export interface SalesTimePoint extends SalesTotals {
  period: string; // Fecha de inicio del periodo (YYYY-MM-DD)
  byEmployee: EmployeeSalesPoint[]; // Solo empleados con ventas en el periodo
}

export interface SalesOverTime {
  from: string;
  to: string;
  groupBy: SalesGroupBy;
  employeeIds: number[] | null;
  total: number;
  count: number;
  data: SalesTimePoint[];
}
