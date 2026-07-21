import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { getCurrentUser, requestMagicLink, signInWithPassword, signUp } from "./lib/auth";

vi.mock("./lib/auth", () => ({ getCurrentUser: vi.fn(), requestMagicLink: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn() }));
const getCurrentUserMock = vi.mocked(getCurrentUser); const requestMagicLinkMock = vi.mocked(requestMagicLink); const signInMock = vi.mocked(signInWithPassword); const signUpMock = vi.mocked(signUp);
beforeEach(() => { vi.clearAllMocks(); getCurrentUserMock.mockResolvedValue(null); });

describe("Login", () => {
  it("inicia sesión directamente con correo y contraseña", async () => {
    signInMock.mockResolvedValue({ id: "user-1" } as never); const onAuthenticated = vi.fn(); render(<Login onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: " Productor@OxiTech.dev " } }); fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto" } }); fireEvent.click(screen.getByRole("button", { name: /^ingresar$/i }));
    await waitFor(() => expect(signInMock).toHaveBeenCalledWith("productor@oxitech.dev", "secreto")); expect(onAuthenticated).toHaveBeenCalledOnce();
  });
  it("no expone el detalle de un error de credenciales", async () => {
    signInMock.mockRejectedValue(new Error("User not found")); render(<Login onAuthenticated={vi.fn()} />); fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "usuario@oxitech.dev" } }); fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto" } }); fireEvent.click(screen.getByRole("button", { name: /^ingresar$/i }));
    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument(); expect(screen.queryByText("User not found")).not.toBeInTheDocument();
  });
  it("crea una cuenta y pide confirmación por correo", async () => {
    signUpMock.mockResolvedValue(undefined); render(<Login onAuthenticated={vi.fn()} />); fireEvent.click(screen.getByRole("tab", { name: "Crear cuenta" })); fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "nuevo@oxitech.dev" } }); fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto" } }); fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "secreto" } }); fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    await waitFor(() => expect(signUpMock).toHaveBeenCalledWith("nuevo@oxitech.dev", "secreto")); expect(screen.getByRole("heading", { name: "Confirma tu cuenta." })).toBeInTheDocument();
  });
  it("rechaza contraseñas que no coinciden", async () => {
    render(<Login onAuthenticated={vi.fn()} />); fireEvent.click(screen.getByRole("tab", { name: "Crear cuenta" })); fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "nuevo@oxitech.dev" } }); fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "uno" } }); fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "dos" } }); fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i })); expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument(); expect(signUpMock).not.toHaveBeenCalled();
  });
  it("mantiene enlace mágico para cuentas antiguas sin crear usuarios", async () => {
    requestMagicLinkMock.mockResolvedValue(undefined); render(<Login onAuthenticated={vi.fn()} />); fireEvent.click(screen.getByRole("button", { name: /cuenta no tiene contraseña/i })); fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "anterior@oxitech.dev" } }); fireEvent.click(screen.getByRole("button", { name: /enviar enlace de acceso/i })); await waitFor(() => expect(requestMagicLinkMock).toHaveBeenCalledWith("anterior@oxitech.dev")); expect(screen.getByRole("heading", { name: "Abre el enlace." })).toBeInTheDocument();
  });
});
