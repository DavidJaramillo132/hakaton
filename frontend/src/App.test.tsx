import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { getCurrentUser } from "./lib/auth";

vi.mock("./Program", () => ({ Program: () => <div>Programa de análisis</div> }));
vi.mock("./Login", () => ({ Login: () => <div>Inicio de sesión</div> }));
vi.mock("./lib/auth", () => ({ getCurrentUser: vi.fn() }));

const getCurrentUserMock = vi.mocked(getCurrentUser);

beforeEach(() => getCurrentUserMock.mockResolvedValue(null));
afterEach(() => { window.history.replaceState({}, "", "/"); vi.clearAllMocks(); });

describe("App", () => {
  it("muestra la landing y enlaza al inicio de sesión desde la raíz", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Protege tu cultivo antes de que cambie el clima." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analizar mi cultivo/i })).toHaveAttribute("href", "/login");
  });

  it("muestra el inicio de sesión en /login", () => {
    window.history.replaceState({}, "", "/login");
    render(<App />);

    expect(screen.getByText("Inicio de sesión")).toBeInTheDocument();
  });

  it("muestra el programa en /app con una sesión activa", async () => {
    window.history.replaceState({}, "", "/app");
    getCurrentUserMock.mockResolvedValue({ id: "user-1", email: "productor@oxitech.dev" } as never);
    render(<App />);

    await waitFor(() => expect(screen.getByText("Programa de análisis")).toBeInTheDocument());
  });

  it("redirige /app a /login sin sesión", async () => {
    window.history.replaceState({}, "", "/app");
    render(<App />);

    await waitFor(() => expect(screen.getByText("Inicio de sesión")).toBeInTheDocument());
    expect(window.location.pathname).toBe("/login");
  });
});
