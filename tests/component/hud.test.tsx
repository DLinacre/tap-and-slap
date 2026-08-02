import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hud } from "@/components/game/Hud";
import { INITIAL_HUD, useGameStore } from "@/store/game-store";
import { gameBridge } from "@/game/bridge";

describe("Hud", () => {
  beforeEach(() => {
    useGameStore.setState({
      screen: "playing",
      hud: { ...INITIAL_HUD, judgment: null },
      result: null,
      level: null,
      levelSlug: null,
    });
  });

  it("renders score, accuracy and health", () => {
    useGameStore.setState({
      hud: {
        score: 12345,
        combo: 12,
        maxCombo: 12,
        accuracy: 87.5,
        health: 64,
        judgment: null,
        progress: 0.5,
        perfectStreak: 0,
      },
    });
    render(<Hud />);
    expect(screen.getByTestId("hud-score")).toHaveTextContent("12,345");
    expect(screen.getByTestId("hud-accuracy")).toHaveTextContent("87.5%");
    expect(screen.getByTestId("hud-combo")).toHaveTextContent("12×");
  });

  it("shows the perfect streak when 2+ perfects in a row", () => {
    useGameStore.setState({
      hud: { ...INITIAL_HUD, score: 400, perfectStreak: 6 },
    });
    render(<Hud />);
    expect(screen.getByTestId("hud-streak")).toHaveTextContent("PERFECT ×6");
  });

  it("hides the streak below 2", () => {
    useGameStore.setState({ hud: { ...INITIAL_HUD, perfectStreak: 1 } });
    render(<Hud />);
    expect(screen.queryByTestId("hud-streak")).not.toBeInTheDocument();
  });

  it("hides the combo below 2", () => {
    useGameStore.setState({ hud: { ...INITIAL_HUD, combo: 1, score: 100 } });
    render(<Hud />);
    expect(screen.queryByTestId("hud-combo")).not.toBeInTheDocument();
  });

  it("flashes the latest judgment", () => {
    useGameStore.setState({
      hud: { ...INITIAL_HUD, judgment: { type: "perfect", id: 7 } },
    });
    render(<Hud />);
    expect(screen.getByText("PERFECT")).toBeInTheDocument();
  });

  it("pauses via the pause button", () => {
    const start = vi.spyOn(gameBridge, "pause").mockImplementation(() => undefined);
    useGameStore.setState({ screen: "playing" });
    render(<Hud />);
    screen.getByRole("button", { name: "Pause" }).click();
    expect(start).toHaveBeenCalled();
  });
});
