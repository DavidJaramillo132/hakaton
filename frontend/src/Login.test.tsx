import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { getCurrentUser, requestEmailOtp, verifyEmailOtp } from "./lib/auth";

vi.mock("./lib/auth", () => ({ getCurrentUser: vi.fn(), requestEmailOtp: vi.fn(), verifyEmailOtp: vi.fn() }));

const getCurrentUserMock = vi.mocked(getCurrentUser);
const requestEmailOtpMock = vi.mocked(requestEmailOtp);
const verifyEmailOtpMock = vi.mocked(verifyEmailOtp);

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(null);
});

describe("Login", () => {
  it("solicita un OTP y muestra el formulario para verificarlo", async () => {
    requestEmailOtpMock.mockResolvedValue(undefined);
    render(<Login onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: " Productor@OxiTech.dev " } });
    fireEvent.click(screen.getByRole("button", { name: /enviar código/i }));

    await waitFor(() => expect(requestEmailOtpMock).toHaveBeenCalledWith("productor@oxitech.dev"));
    expect(screen.getByLabelText("Código de seis dígitos")).toBeInTheDocument();
  });

  it("muestra el error cuando el código OTP no es válido", async () => {
    requestEmailOtpMock.mockResolvedValue(undefined);
    verifyEmailOtpMock.mockRejectedValue(new Error("El código no es válido o venció."));
    render(<Login onAuthenticated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "productor@oxitech.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar código/i }));
    await screen.findByLabelText("Código de seis dígitos");

    fireEvent.change(screen.getByLabelText("Código de seis dígitos"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar al programa/i }));

    expect(await screen.findByText("El código no es válido o venció.")).toBeInTheDocument();
  });

  it("abre el programa cuando Supabase valida el OTP", async () => {
    const onAuthenticated = vi.fn();
    requestEmailOtpMock.mockResolvedValue(undefined);
    verifyEmailOtpMock.mockResolvedValue({ id: "user-1", email: "productor@oxitech.dev" } as never);
    render(<Login onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "productor@oxitech.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar código/i }));
    await screen.findByLabelText("Código de seis dígitos");

    fireEvent.change(screen.getByLabelText("Código de seis dígitos"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar al programa/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce());
  });
});
