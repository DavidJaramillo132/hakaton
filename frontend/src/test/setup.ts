import "@testing-library/jest-dom/vitest";

Object.defineProperty(URL, "createObjectURL", { value: () => "blob:test-photo", writable: true });
Object.defineProperty(URL, "revokeObjectURL", { value: () => undefined, writable: true });
