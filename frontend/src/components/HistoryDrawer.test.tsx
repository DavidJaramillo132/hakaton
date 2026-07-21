import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryDrawer } from "./HistoryDrawer";
import { loadHistory } from "../lib/api";

vi.mock("../lib/api", () => ({ loadHistory: vi.fn() }));
const loadHistoryMock = vi.mocked(loadHistory);
const field = { id: "field-1", user_id: "user-1", nombre: "Finca Esperanza", cultivo: "cacao" as const, geojson: "{}", created_at: "2026-07-20T10:00:00Z" };
const analysis = { id: "analysis-1", campo_id: "field-1", clima_json: { daily: { time: ["2026-07-20"], temperature_2m_max: [30], temperature_2m_min: [21], precipitation_probability_max: [70], relative_humidity_2m_mean: [85] } }, nivel_riesgo: "alto" as const, tipo_riesgo: "exceso de humedad", recomendaciones: ["Revisar drenaje"], created_at: "2026-07-21T10:00:00Z" };

beforeEach(() => { vi.clearAllMocks(); loadHistoryMock.mockResolvedValue({ fields: [field], analyses: [analysis] }); });

describe("HistoryDrawer", () => {
  it("loads and displays analysis cards", async () => {
    render(<HistoryDrawer open onClose={() => undefined} />);
    expect(screen.getByText("Cargando historial…")).toBeInTheDocument();
    expect(await screen.findByText("Finca Esperanza")).toBeInTheDocument();
    expect(screen.getByText("Riesgo alto")).toBeInTheDocument();
  });

  it("opens the complete detail and returns to the list", async () => {
    render(<HistoryDrawer open onClose={() => undefined} />);
    fireEvent.click(await screen.findByRole("button", { name: /ver detalle/i }));
    expect(screen.getByText("Detalle del análisis")).toBeInTheDocument();
    expect(screen.getByText("Resumen climático")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /volver al historial/i }));
    expect(screen.getByText("Historial")).toBeInTheDocument();
  });

  it("closes with Escape", async () => {
    const onClose = vi.fn();
    render(<HistoryDrawer open onClose={onClose} />);
    await waitFor(() => expect(loadHistoryMock).toHaveBeenCalledOnce());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
