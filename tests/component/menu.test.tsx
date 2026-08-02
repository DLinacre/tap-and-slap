import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Menu } from "@/components/game/Menu";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { getLevels } from "@/game/levels/registry";
import { gameBridge } from "@/game/bridge";

const levels = getLevels();

describe("Menu", () => {
  beforeEach(() => {
    useGameStore.setState({
      screen: "menu",
      levels,
      leaderboard: [
        {
          id: "r1",
          name: "DemoSlapper",
          isGuest: false,
          score: 90000,
          maxCombo: 120,
          accuracy: 97.5,
          difficulty: "NORMAL",
          createdAt: new Date().toISOString(),
        },
      ],
      leaderboardError: null,
      player: null,
      level: null,
      levelSlug: null,
    });
    useSettingsStore.setState({ musicVolume: 0.5, sfxVolume: 0.5, calibrationMs: 0 });
  });

  it("lists all built-in levels", () => {
    render(<Menu onSignIn={() => undefined} />);
    for (const level of levels) {
      expect(screen.getByText(level.title)).toBeInTheDocument();
    }
  });

  it("starts a run when START is clicked", () => {
    const start = vi.spyOn(gameBridge, "start").mockImplementation(() => undefined);
    render(<Menu onSignIn={() => undefined} />);
    screen.getByTestId("start-level").click();
    expect(start).toHaveBeenCalledWith(levels[0]!.slug, {});
  });

  it("shows leaderboard entries", () => {
    render(<Menu onSignIn={() => undefined} />);
    expect(screen.getByText("DemoSlapper")).toBeInTheDocument();
    expect(screen.getByText("90,000")).toBeInTheDocument();
  });

  it("shows a sign-in prompt for guests", () => {
    render(<Menu onSignIn={() => undefined} />);
    expect(screen.getByText(/Sign in to save your name/)).toBeInTheDocument();
  });

  it("fires the sign-in callback", () => {
    const onSignIn = vi.fn();
    render(<Menu onSignIn={onSignIn} />);
    screen.getByText(/Sign in to save your name/).click();
    expect(onSignIn).toHaveBeenCalled();
  });
});
