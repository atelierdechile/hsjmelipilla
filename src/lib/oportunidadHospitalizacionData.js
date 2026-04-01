export const HOSPITALIZATION_TARGET = 85;

export const HOSPITALIZATION_INDICATOR = {
  name: "Porcentaje de pacientes con indicacion de hospitalizacion desde UEH que acceden a cama de dotacion en menos de 12 horas",
  meta: ">= 85%",
  numerator:
    "Total de pacientes con indicacion de hospitalizacion que espera en UEH adulta y pediatrica menos de 12 horas para acceder a cama de dotacion en el mes de evaluacion.",
  denominator:
    "Total de pacientes con indicacion de hospitalizacion en UEH adulta y pediatrica en el mes de evaluacion.",
  formula:
    "(Total de pacientes con indicacion de hospitalizacion que espera en UEH menos de 12 horas para acceder a cama de dotacion en el periodo / Total de pacientes con indicacion de hospitalizacion en UEH en el periodo) x 100.",
  establishment: "Hospital San Jose (Melipilla)",
  service: "UEH adulta y pediatrica",
};

export const HOSPITALIZATION_DATA = [
  { month: "01", year: "2023", p1: 314, p2: 343 },
  { month: "02", year: "2023", p1: 324, p2: 342 },
  { month: "03", year: "2023", p1: 317, p2: 325 },
  { month: "04", year: "2023", p1: 351, p2: 399 },
  { month: "05", year: "2023", p1: 417, p2: 478 },
  { month: "06", year: "2023", p1: 382, p2: 455 },
  { month: "07", year: "2023", p1: 242, p2: 270 },
  { month: "08", year: "2023", p1: 258, p2: 308 },
  { month: "09", year: "2023", p1: 324, p2: 397 },
  { month: "10", year: "2023", p1: 333, p2: 422 },
  { month: "11", year: "2023", p1: 313, p2: 373 },
  { month: "12", year: "2023", p1: 342, p2: 380 },
  { month: "01", year: "2024", p1: 371, p2: 447 },
  { month: "02", year: "2024", p1: 389, p2: 419 },
  { month: "03", year: "2024", p1: 422, p2: 487 },
  { month: "04", year: "2024", p1: 388, p2: 460 },
  { month: "05", year: "2024", p1: 400, p2: 475 },
  { month: "06", year: "2024", p1: 415, p2: 465 },
  { month: "07", year: "2024", p1: 431, p2: 534 },
  { month: "08", year: "2024", p1: 462, p2: 498 },
  { month: "09", year: "2024", p1: 395, p2: 474 },
  { month: "10", year: "2024", p1: 437, p2: 545 },
  { month: "11", year: "2024", p1: 365, p2: 472 },
  { month: "12", year: "2024", p1: 364, p2: 454 },
  { month: "01", year: "2025", p1: 303, p2: 438 },
  { month: "02", year: "2025", p1: 287, p2: 372 },
  { month: "03", year: "2025", p1: 334, p2: 404 },
  { month: "04", year: "2025", p1: 369, p2: 391 },
  { month: "05", year: "2025", p1: 373, p2: 395 },
  { month: "06", year: "2025", p1: 386, p2: 436 },
  { month: "07", year: "2025", p1: 357, p2: 435 },
  { month: "08", year: "2025", p1: 370, p2: 434 },
  { month: "09", year: "2025", p1: 264, p2: 388 },
  { month: "10", year: "2025", p1: 322, p2: 389 },
  { month: "11", year: "2025", p1: 271, p2: 372 },
  { month: "12", year: "2025", p1: 248, p2: 386 },
];
