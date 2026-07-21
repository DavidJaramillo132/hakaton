import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { getCurrentUser, requestVerificationEmail } from "./lib/auth";

vi.mock("./lib/auth", () => ({ getCurrentUser: vi.fn(), requestVerificationEmail: vi.fn() }));

const getCurrentUserMock = vi.mocked(getCurrentUser);
const requestVerificationEmailMock = vi.mocked(requestVerificationEmail);

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(null);
});

describe("Login", () => {
  it("envía un enlace de verificación y muestra la confirmación", async () => {
    requestVerificationEmailMock.mockResolvedValue(undefined);
    render(<Login onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: " Productor@OxiTech.dev " } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace de verificación/i }));

    await waitFor(() => expect(requestVerificationEmailMock).toHaveBeenCalledWith("productor@oxitech.dev"));
    expect(screen.getByRole("heading", { name: "Abre el enlace." })).toBeInTheDocument();
  });

  it("muestra un error si Supabase no puede enviar el enlace", async () => {
    requestVerificationEmailMock.mockRejectedValue(new Error("No se pudo enviar el correo de verificación."));
    render(<Login onAuthenticated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "productor@oxitech.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace de verificación/i }));

    expect(await screen.findByText("No se pudo enviar el correo de verificación.")).toBeInTheDocument();
  });

  it("abre el programa de inmediato si ya hay una sesión válida", async () => {
    const onAuthenticated = vi.fn();
    getCurrentUserMock.mockResolvedValue({ id: "user-1", email: "productor@oxitech.dev" } as never);
    render(<Login onAuthenticated={onAuthenticated} />);

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce());
  });
});
