import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OpeningPage from "./OpeningPage";

describe("OpeningPage", () => {
  it("does not mount a second splash layer", () => {
    const { container } = render(<OpeningPage />);

    expect(container.firstChild).toBeNull();
  });
});
