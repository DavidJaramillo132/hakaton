import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Program } from "./Program";
import { signOut } from "./lib/auth";

vi.mock("./lib/auth", () => ({ signOut: vi.fn() }));
vi.mock("./components/MapEditor", () => ({ MapEditor: () => <div>Mapa</div> }));
vi.mock("./components/CropListbox", () => ({ CropListbox: () => <div>Cultivo</div> }));
vi.mock("./components/PhotoPicker", () => ({ PhotoPicker: () => <div>Fotos</div> }));

const signOutMock = vi.mocked(signOut);

beforeEach(() => { vi.clearAllMocks(); signOutMock.mockResolvedValue(undefined); });

describe("Program", () => {
  it("cierra la sesión y notifica al enrutador", async () => {
    const onSignOut = vi.fn();
    render(<Program onSignOut={onSignOut} user={{ id: "user-1", email: "productor@oxitech.dev" } as never} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledOnce());
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
