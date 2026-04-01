export async function fetchHospitalData() {
  const response = await fetch("/data/rem.json");
  if (!response.ok) throw new Error("No se pudo cargar rem.json");
  return response.json();
}

export const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export function monthLabel(value, format = "short") {
  const month = value.includes("-") ? value.split("-")[1] : value;
  const found = MONTH_OPTIONS.find((item) => item.value === month);

  if (!found) {
    return value;
  }

  if (format === "long") {
    return found.label;
  }

  return found.label.slice(0, 3);
}

export function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}
