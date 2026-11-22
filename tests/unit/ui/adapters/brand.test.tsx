// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OmniRouteLogo, { OmniRouteLockup } from "@/shared/components/OmniRouteLogo";

const customLogo = "data:image/png;base64,AAAA";

afterEach(() => cleanup());

describe("AntaresGateway brand", () => {
  it("renders the Antares mark with the supplied size and class", () => {
    const { container } = render(<OmniRouteLogo size={22} className="x" />);
    const image = container.querySelector("img")!;
    expect(image.getAttribute("src")).toMatch(/\/antares-logo\.png$/);
    expect(image.classList.contains("x")).toBe(true);
    expect(image.getAttribute("width")).toBe("22");
    expect(image.getAttribute("height")).toBe("22");
    expect(image.alt).toBe("");
  });

  it("renders the default product name as text", () => {
    render(<OmniRouteLockup />);
    expect(screen.getByText("AntaresGateway")).toBeTruthy();
  });

  it("honours the operator’s white-label name and logo", () => {
    const { container } = render(<OmniRouteLockup name="Acme Router" logoSrc={customLogo} />);
    expect(screen.getByText("Acme Router")).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(customLogo);
  });

  it("falls back to the default name when only the logo is customized", () => {
    render(<OmniRouteLockup name="" logoSrc={customLogo} />);
    expect(screen.getByText("AntaresGateway")).toBeTruthy();
  });
});
