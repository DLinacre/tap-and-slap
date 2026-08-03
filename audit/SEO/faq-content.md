# README FAQ (ready to paste)

```markdown
## ❓ FAQ

**How does scoring work?**
Every enemy is worth base points (100 normal · 150 heavy · 50 mini) multiplied
by your combo multiplier (up to ×8) and a timing weight — PERFECT ×1.0,
GREAT ×0.7, GOOD ×0.4. Misses reset your combo and cost health.

**Is the music licensed?**
No. Every track is an original composition generated in your browser from the
level's beat map — including the stomp-stomp-clap crowd anthem and the
heavy-riff war march. The one exception is *Ode to Joy* (Beethoven, 1824),
which is in the public domain. You can use any of it commercially.

**Can I add a level?**
Yes — levels are pure data (`src/game/levels/registry.ts` + the deterministic
generator). See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow.

**Why does timing feel off?**
Open Settings → Offset and adjust calibration by ±100 ms to match your
display's latency.

**Do I need an account?**
No — you can play and post scores as a guest. Accounts (optional) just put
your name on the leaderboard.

**Where do I report a bug or a security issue?**
Bugs → issues (use the bug template). Security → [SECURITY.md](./SECURITY.md)
(private report only).
```
