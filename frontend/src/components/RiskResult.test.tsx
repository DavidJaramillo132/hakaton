import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskResult } from "./RiskResult";

describe("RiskResult", () => {
  it.each(["bajo", "medio", "alto"] as const)("renders the %s risk card", (nivel_riesgo) => {
    render(<RiskResult campo={{ nombre: "Campo Uno", cultivo: "cacao" }} climate={{ temp_max: 29, temp_min: 22, prob_lluvia: 78, humedad: 88 }} onNew={() => undefined} response={{ resultado: { nivel_riesgo, tipo_riesgo: "exceso de humedad", recomendaciones: ["Revisar drenaje"] }, analisis: { id: "a", campo_id: "c", clima_json: {}, nivel_riesgo, tipo_riesgo: "exceso de humedad", recomendaciones: ["Revisar drenaje"], created_at: "2026-07-21" } }} />);
    expect(screen.getByText(`Riesgo ${nivel_riesgo}`)).toBeInTheDocument();
    expect(screen.getByText("29°C")).toBeInTheDocument();
  });
});
