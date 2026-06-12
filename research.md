# The Idle-Hands Engine: A Product Strategy for a Vibe-Coder Fidget App

*Foundation for product concept and positioning — June 2026*

**Prepared:** 2026-06-12
**Scope:** Deep research and strategic synthesis for a digital "fidget" app that occupies vibe coders during the 5–60-second waits while an AI agent generates code — designed to discharge micro-anxiety without breaking flow.

---

## Executive summary — the five things that matter most

**1. The core problem is not boredom — it is *attention residue* and the slot-machine reflex.** During a short, involuntary wait, a knowledge worker doesn't simply have nothing to do; their brain is still loaded with the unfinished task (Leroy's "attention residue," 2009) and feels a behavioral pull toward resolution (the Ovsiankina effect, which a 2025 meta-analysis confirmed is real even though the famous Zeigarnik memory effect largely failed to replicate). The path of least resistance is to grab the phone and pull-to-refresh — a gesture Tristan Harris and the gesture's own inventor, Loren Brichter, both describe as a literal slot machine. The catastrophe is that this 30-second slot-machine pull triggers a *full task switch*: Gloria Mark's interruption research shows the return is reliably slow and stressful — the oft-quoted "~23 minutes to re-engage" figure is over-precise (it traces to a 2006 Gallup interview, not a published paper), but the directional cost of the switch is well-established. The product's real job is to be a **lower-energy alternative to the phone** that absorbs the idle-hands impulse *without* opening a task-switch.

**2. Fidgeting works as arousal self-regulation, and that mechanism is real even where the "fidget spinner improves focus" marketing was junk science.** The classroom fidget-spinner studies were largely debunked (Graziano et al. 2020 found spinners *worsened* attention in ADHD kids; TIME called the category "shoddy science"). But the underlying construct survives: fidgeting and "stimming" are documented arousal-modulation behaviors that shift cortical arousal, modulate sensory processing, and activate reward circuits. The design lesson is precise — **don't sell "this makes you focus better" (false and legally risky); design for arousal discharge and sensory satisfaction**, which is the part that actually holds up.

**3. The satisfying loop is anticipation → resolution → tactile confirmation, and haptics are the secret weapon.** The "oddly satisfying" / ASMR / pop-it genre works on completion-of-pattern plus dopaminergic anticipation-and-payoff. New consumer-research (Journal of Consumer Research, 2025, "Haptic Rewards") found mobile vibration evokes a *distinct and stronger* reward response than audio or visual feedback, mediated by a sense of ownership and control. A fidget app that nails Core Haptics will out-satisfy one that only has visuals and sound. This is why Apple's own "bounce at the end of a scroll" and the keyboard click feel good — and why the existing market leader genre (Antistress, 100M+ downloads) leans on tactile simulation.

**4. Vibe coders are a uniquely well-suited target because the wait is *intrinsic, rhythmic, and already dopaminergic*.** Unlike a random commuter, a vibe coder gets a structured, repeating, predictable 5–60s gap dozens of times an hour — a perfect interval for a micro-engagement. Critically, they are *already in a variable-reward state*: developer discourse in 2025–26 explicitly compares prompting an LLM to a slot machine ("you only remember the jackpots" — Cory Doctorow; an arXiv paper literally measured gambling-like behavior in LLM agents). The coder is sitting in anticipatory dopamine waiting to see what the model returns. A fidget that lives *inside that same gap* rides an existing neurological wave rather than fighting for attention against it. The METR study (2025) showing AI tools made experienced devs 19% *slower* — while they felt 20% faster — suggests a large and growing pool of people spending real idle time in these gaps (caveat: n=16 with a wide confidence interval, and METR itself later called the design a likely-bad proxy — but the qualitative point that real idle/oversight time exists survives regardless).

**5. The novel angle: build a "flow-preserving idle valve," not a game.** Games create their own Zeigarnik tension — you don't want to stop mid-level when the build finishes, so a game *competes* with the return to work and creates a second task switch. The winning design is the opposite: a **zero-state, infinitely-interruptible, single-gesture fidget** that you can drop the instant the agent pings you, with the *desktop being the timer/idle-detector* and the *phone being the tactile surface* (your hands are off the keyboard anyway). The product senses the agent is running, invites the hand to the phone, and the moment generation completes, calls the hand back. It is the digital equivalent of a worry-stone you put down the instant the kettle boils — not a slot machine you can't stop pulling.

---

## Part 1 — Waiting-state psychology: what is actually happening in those 30 seconds

This is the most important section because it defines the *job to be done*, and the popular framing ("people are bored, give them a game") is wrong.

### Attention residue is the real cost, and it is structural, not motivational

Sophie Leroy's 2009 work introduced **attention residue**: when you stop Task A to do Task B, cognitive activity about Task A persists and degrades Task B performance. The key insight researchers stress is that this is *structural* — it's not a willpower failure, it's how attention is built. During an AI-generation wait, the developer is holding Task A (the code they're shepherding) in working memory. Anything that fully evicts Task A — opening Slack, Twitter, email — incurs the residue cost on the way back.

Gloria Mark, Gonzalez and Harris (2005) found knowledge workers are interrupted or self-interrupt roughly every **3 minutes**. The famous companion figure — "**~23 minutes** to fully return to an interrupted task" — deserves an honest asterisk: the precise "23 minutes 15 seconds" number traces to a 2006 Gallup *interview* with Mark rather than a published paper, and her most-cited study ("The Cost of Interrupted Work") actually found people completed interrupted tasks *faster* — at the price of significantly more stress, frustration, and time pressure. Treat the 23-minute figure as directionally real but over-precise: interruptions reliably raise stress and resumption lag even if the exact number is shaky. Developer-specific data echoes the directional cost: studies cited across the developer-productivity literature find devs lose **15–30 minutes per context switch**, switch ~59% of daily tasks (40% requiring a context switch), and **never resume 29% of interrupted tasks**.

**Strategic implication:** the enemy is not the empty 30 seconds — it's the *bad* thing people currently do with it (the phone), which converts a 30-second gap into a long, stress-laden re-entry. The product wins if it is *stickier than nothing* but *less sticky than Twitter* — a deliberately shallow engagement that releases cleanly.

### The Ovsiankina pull is real; the Zeigarnik memory effect is mostly not

A crucial 2025 nuance many product people get wrong. The **Zeigarnik effect** (interrupted tasks are remembered better) and the **Ovsiankina effect** (people spontaneously resume interrupted tasks) are usually invoked together. But a 2025 systematic review and meta-analysis (*Humanities and Social Sciences Communications*, Nature portfolio) found **no reliable memory advantage for unfinished tasks** — Zeigarnik "lacks universal validity" — while confirming the **Ovsiankina resumption tendency is robust**. Lewin's underlying theory: an unfinished intention creates a "quasi-need," an inner tension that persists until discharged.

**Strategic implication:** don't build the product's *retention* on a Zeigarnik hook ("come back to your unfinished streak!") — that's the part that doesn't replicate. Build on the Ovsiankina reality: people *will* return to the primary task (the code) on their own. So the fidget should never try to *hold* them. It should assume they're leaving the moment the build finishes and make that exit frictionless. This is the inverse of every engagement-maximizing app.

### Why developers reach for the phone during compiles — and the slot-machine trap

This is folklore made literal in xkcd #303 ("Compiling" — two programmers sword-fighting on chairs; "the #1 programmer excuse for legitimately slacking off"). The build-wait has been a cultural feature of programming for decades. But the modern version is more dangerous because the phone *is* a variable-reward device.

Tristan Harris's "slot machine in your pocket" thesis: pulling to refresh email/feed is mechanically identical to pulling a slot lever — variable-ratio reinforcement (B.F. Skinner), the schedule with the highest, most extinction-resistant response rate. Loren Brichter, who *invented* pull-to-refresh in Tweetie (2009), now openly regrets it: "Pull-to-refresh is addictive." On a variable-ratio schedule there is no safe moment to stop, so the 30-second compile-wait phone-check reliably overruns into minutes.

**Strategic implication:** the product is competing directly with the phone's slot machine for the same idle gesture. It cannot win on reward *intensity* (it shouldn't — that would recreate the trap). It wins on **proximity and exit-cleanliness**: it's already on screen, it asks nothing, and it lets go.

### Loading-bar psychology: the "labor illusion" and operational transparency

Buell & Norton's "The Labor Illusion" (Management Science, 2011, HBS) is the foundational result: people can *prefer longer waits* when a site visibly signals it's working, and showing a progress bar raises satisfaction even when results are identical. Perceived effort triggers reciprocity and raises perceived value. This is why Claude Code's streaming "I'm planning… I'm editing…" transparency feels trustworthy (a point echoed in the vibe-coding literature).

**Strategic implication:** the fidget app should *fuse* with the wait's progress signal rather than hide it. The agent's progress *is* the loading bar — the fidget can render it as ambient texture (e.g., the thing you're fidgeting with subtly fills/charges as generation proceeds), so the user's tactile play and the model's labor share one visual channel. The fidget becomes the progress bar. That is a genuinely novel fusion.

### Micro-breaks: the evidence base for the 30-second pause

The best support comes from the 2022 PLOS ONE meta-analysis ("Give me a break!", 22 studies, n≈2,335): micro-breaks (≤10 min) significantly **boost vigor and reduce fatigue**, though for *highly depleting* cognitive tasks, performance recovery may need >10 min. Other work shows even **60–180 second** pauses measurably change felt fatigue and focus.

**Strategic implication and an honest caveat:** the well-being/vigor benefit of a short pause is well-supported; the *performance-restoration* claim for sub-minute breaks is weaker. So position the product around **vigor, calm, and discharge** ("reset your hands, keep your head in the code"), not "you'll code better." The latter is the same overclaim that got fidget spinners in trouble.

---

## Part 2 — The psychology of fidget toys (what's real, what's marketing)

### Neurological mechanisms that hold up

Fidgeting and **stimming** (self-stimulatory behavior) are documented arousal-regulation and sensory-modulation behaviors. Neuroscience work associates them with shifts in cortical arousal, modulation of sensory processing, and activation of reward circuits; in autism, reduced GABA (an inhibitory neurotransmitter) in sensory/motor cortices is linked to disinhibited repetitive movement. The functional account: people stim/fidget to **regulate nervous-system arousal**, manage sensory input, and self-soothe — calming themselves by supplying predictable sensory stimuli that crowd out less-predictable environmental noise.

There is also genuine signal that *movement* aids cognition in ADHD specifically: a UC-Davis-associated line of work and several studies find that for people with ADHD, fidgeting/movement can support sustained attention during demanding tasks — fidgeting "varies under different conditions as a self-regulating mechanism for attention and alertness." A 2024 *Frontiers in Psychiatry* study from the Schweitzer lab (UC Davis) sharpened this for adults: adults with ADHD fidgeted *more during correct trials* on a Flanker attention task — direct evidence that fidgeting operates as a compensatory arousal mechanism rather than a distraction. This is the kernel of truth inside the hype — though note it strengthens the *mechanism*, not the debunked "spinner improves classroom focus" product claim below; those remain distinct questions.

### What is *not* real — and the legal/positioning landmine

The specific "fidget spinner makes you focus" classroom claim was **debunked**. Graziano, Garcia & Landis (2020, *Journal of Attention Disorders*) found spinners were associated with *poorer* attention in young children with ADHD. TIME (2017) ran "The Shoddy Science Behind This Big Trend." Spinners were widely *banned* in classrooms as disruptive. So: the construct (fidgeting regulates arousal) is real; the product claim (this specific gadget improves focus/grades) was not supported.

**Strategic implication (load-bearing):** never market the app as a focus or productivity *enhancer* with a clinical gloss. Market the *experienced* benefit — "discharge the restless hands, stay near your work, feel a small satisfying thing" — which is defensible and true. Reserve any ADHD-adjacent language for testimonial/community framing, not efficacy claims.

### Interruption (bad) vs. micro-engagement (good) — the central design distinction

The whole product hinges on this line. From the flow literature (Csikszentmihalyi distinguished micro-flow from deep-flow; IT-interruption studies show long/complex interruptions wreck task resumption while brief, congruent ones may not):

- **Interruption** redirects attention to *new content requiring evaluation* (a tweet, an email, a game level). It evicts the primary task and incurs residue. Notably, programmers in studies described even Copilot's auto-suggestions as "interrupting their thoughts" and "messing up thought process" — proof that *content* during a wait is costly.
- **Micro-engagement** occupies the *hands and low-level sensory/motor system* with something *contentless and repetitive*, leaving the prefrontal "what was I doing" buffer intact. This is the worry-stone, the pen-click, the keychain spin.

**The design rule that falls out:** the fidget must be **semantically empty**. No words, no levels, no scores to track, no decisions. The instant it requires *thinking*, it becomes an interruption. Pure rhythm, texture, and physics.

### Why fidget spinners specifically went viral (vs. other fidget toys)

Synthesizing the virality analyses: (1) **Visible skill expression** — spinners let you do *tricks* (balancing, transfers, flicks), so they generated shareable YouTube/Vine content; a stress ball does nothing watchable. (2) **Intrigue/uncertainty loop** (Dr. Brent Coker's framing): uncertainty → curiosity → mild apprehension → amazement, a sequence that travels through social networks. (3) **Bandwagon / "all the cool kids"** schoolyard dynamics. (4) **Cheap, physical, ubiquitous** — by May 2017 all of Amazon's top-10 best-sellers were fidget toys. The fade came from classroom bans + market saturation + novelty death.

**Strategic implication:** the viral asset a *digital* fidget can own that the physical spinner had is **shareable skill expression**. More on this in Part 4.

---

## Part 3 — Successful digital fidget analogues and the haptics edge

### The existing landscape

- **The Antistress / "Fidget Toys 3D" genre.** "Antistress – No Wifi Games" (Fidget Dev) has **100M+ downloads** (Google Play); "Sensory Fidget Games" (Oddly Satisfying Games) ~1M; many titles bundle pop-it, slime, fidget cube, spinner, bubble-wrap, cutting-grass, stress-ball simulations. This validates the *appetite* but the genre is built for kill-time on mobile, not for the structured developer micro-gap — none integrate with a work trigger. **That integration gap is the whitespace.**
- **Chrome Dino.** The canonical "involuntary-wait filler": built in 2014 by Chrome's UX team (codename "Project Bolan") to turn the offline-error dead moment into play; now **~270M plays/month**. Lesson: it lives *exactly where the wait is* (the error page) and needs zero setup. But it's a skill game with a fail-state — which, per Part 1, creates its own resumption tension. Good placement, wrong loop for our case.
- **Fidgetable** (MWM) and similar — explicitly built on Apple **Core Haptics** to mimic real textures. This is the closest spiritual sibling and proves the haptics-first thesis on iOS.
- **Apple's own microinteractions** — scroll-bounce, keyboard click, Dynamic Island wave, flashlight toggle — are uncredited "fidget" moments: multisensory (visual + sound + haptic), functionally optional, emotionally satisfying.

### Why haptics is the unfair advantage

The standout new finding: **"Haptic Rewards: How Mobile Vibrations Shape Reward Response and Consumer Choice"** (*Journal of Consumer Research*, 2025) — mobile vibration evokes a reward response **distinct from and stronger than** audio or visual feedback, mediated by perceived ownership and a sense of control; impulsive users respond even more. Supporting work ("Good Vibrations," Oxford) ties haptics to psychological ownership. UX research adds that satisfaction *rises with vibration intensity* and *falls as the interval between vibrations grows* — i.e., dense, frequent, strong haptic events feel best.

**Strategic implications:**
1. **Phone-first for the tactile surface.** The richest haptics (Core Haptics / Taptic Engine) are on the phone, and the coder's hands leave the keyboard anyway during a wait. Desktop haptics are weak-to-nonexistent.
2. **Design the haptic *texture*, not just a buzz.** Resolution (a fingertip rolling over detents), inertia (a spun wheel decelerating), and snap (a pop-it dome inverting) are the satisfying primitives.
3. **Dense over sparse.** A mechanic that produces many small haptic events per second (rolling, scrubbing, spinning) will out-satisfy one with occasional big buzzes.

### The neurochemistry the satisfying genre exploits

"Oddly satisfying" content works on: completion-of-pattern (resolving an incomplete gestalt), preference for symmetry/repetition, ASMR-adjacent sensory soothing, and a **dopaminergic anticipation→payoff** arc (serotonin + dopamine on resolution). The shortcut to reward (watching, not doing) collapses the effort-to-reward ratio. A fidget mechanic should compress the same arc into ~1–3 seconds and let it loop.

---

## Part 4 — Viral mechanic analysis

### What actually made the spinner spread, mapped to digital

| Spinner viral driver | Digital fidget equivalent |
|---|---|
| Visible trick/skill on video | A mechanic with a **high skill ceiling** that produces a *clip-worthy* moment (e.g., a perfect uninterrupted spin combo, a satisfying chain-pop, a physics shot) |
| Intrigue/uncertainty loop | Variable visual/physics outcomes — same gesture, slightly different beautiful result |
| Bandwagon / identity | A **dev-tribe identity object** — "this is the thing vibe coders do while Claude thinks" |
| Cheap & ubiquitous | Free, instant, lives in the tool you already have open |

### Shareable skill as the viral loop

The pull-to-refresh-as-slot-machine pattern is the cautionary tale of viral *mechanics*: powerful, but it's the dark version. The *healthy* viral loop the spinner had was **skill expression** — your high score / trick / streak is a status object you *want* to broadcast, and broadcasting it advertises the product. For our app the natural shareable artifacts are:

- **"Wait stats"** — a beautiful end-of-day card: "You fidgeted through 47 minutes of AI generation today" / longest combo / favorite toy. (Wrapped-style, screenshot-native.)
- **Skill clips** — a 3-second replay of an especially clean run, auto-rendered for sharing.
- **The in-joke** — leaning into the xkcd "Compiling!" culture: a status object that *signals membership* in the vibe-coding tribe.

The viral engine, then, is **identity + skill expression**, not variable-reward addiction. That keeps it on the ethical side of the line the product's own thesis demands.

---

## Part 5 — Strategic synthesis: the product

### Naming the concept

Working name used above: **"The Idle-Hands Engine."** The product is a **flow-preserving idle valve**: a phone-resident, haptics-first, semantically-empty fidget surface, triggered and released by a desktop/VS Code companion that knows when the AI agent is working.

### The 3–5 core interaction mechanics most likely to work

Selected against four criteria derived from the research: **(a) semantically empty** (no thinking → no interruption); **(b) infinitely interruptible** (no fail-state, no level to lose, drop it instantly); **(c) haptic-dense** (many tactile events/sec); **(d) skill ceiling for sharing** (rewards mastery without requiring it).

1. **The Charge Spin (hero mechanic).** A weighted flywheel you flick; Core Haptics renders inertia and bearing-detents as it spins down. *The twist:* the wheel's charge level is wired to the agent's progress — your spinning visibly "powers" the generation, and a full charge = generation complete. This fuses fidget + progress bar + labor-illusion (Buell & Norton) in one object. Skill ceiling: sustaining max RPM, combo flicks. Drops instantly with zero loss.

2. **Pop-Cascade.** A grid of haptic domes (pop-it) that you can pop in rows/patterns; each pop is a sharp Taptic snap; domes auto-refill. High haptic density, deeply satisfying completion-of-pattern, and a skill layer (speed-popping rhythms / clearing the board in a clean sweep). Pure Ovsiankina-safe: nothing is lost if you stop.

3. **Liquid/Orbit Scrub.** A finger-dragged physics field — ferrofluid, orbiting particles, or a non-Newtonian slime — that responds with continuous fine-grained haptics as you scrub. This is the ASMR/oddly-satisfying lane: no goal, no skill needed, pure sensory soothing for the lowest-arousal users. Maximally interruptible.

4. **Tap-Tempo Worry Beads.** A linear string of beads you flick one-by-one; rhythmic, repetitive, single-finger, usable one-handed while the other hand rests near the keyboard. The "worry stone" archetype — the calmest option, closest to real stimming, for users who want to keep one hand at the desk.

Recommendation: **ship 1 + 2 first** (one skill-expressive hero with the progress-fusion twist, one universally satisfying pattern-popper), add 3 and 4 as the calm lane. Resist the Antistress-genre temptation to ship 25 toys — depth of haptic craft on a few beats breadth.

### Why vibe coders specifically (the target thesis)

1. **The wait is intrinsic and rhythmic.** The 5–60s AI-generation gap recurs dozens of times an hour, predictably. That's a *designed-in* fidget interval no other audience has natively.
2. **They're already in anticipatory dopamine.** Prompting an LLM is widely (and self-) described as slot-machine-like — "you only remember the jackpots." The user is *already* sitting in reward-anticipation waiting to see the model's output. A fidget in that gap rides the existing wave instead of competing for cold attention.
3. **Their hands are already off the keyboard.** Unlike most waits, the natural posture during agent-generation is hands-free — perfect for picking up the phone-fidget and putting it down.
4. **The pool is large and the gaps are real (and growing).** METR (2025) found AI tools made experienced devs *19% slower while feeling 20% faster* — a lot of real idle/oversight time is being created. (Cite with care: n=16, a wide CI of −26% to +9%, and METR's own Feb 2026 follow-up walked the design back as "likely a bad proxy" with selection effects.) Whether or not AI nets out faster, the *waiting* is structurally there.
5. **They're a tribe with shareable identity** (xkcd "Compiling!", HN/Reddit culture), which is the viral substrate.
6. **They're the early-adopter, tool-installing, VS-Code-extension-trying segment** — they'll actually wire up a desktop companion, which a mass-market user wouldn't.

### Phone + desktop companion: how the cross-device flow works

The core architecture insight: **desktop is the sensor and the clock; phone is the tactile surface.**

- **Desktop/VS Code extension** detects that an AI agent is generating (see integration concept below), and exposes that state.
- **Pairing via QR.** First run: the desktop companion shows a QR code; the phone app scans it to pair (a lightweight WebSocket/relay or local-network link). One-time, frictionless — the same pattern as WhatsApp Web / VS Code tunnels that this audience already trusts.
- **The handoff loop:**
  1. Agent starts generating → desktop signals phone → phone gives a gentle haptic "tap" *("hands free — pick me up")* and wakes the fidget.
  2. User fidgets on the phone while glancing at the screen; the fidget's progress/charge mirrors the agent's real progress (labor-illusion fusion).
  3. Generation completes → phone delivers a distinct **completion haptic** and the fidget gracefully "settles/locks" → *"put me down, you're up."* This is the deliberate **exit signal** — the anti-engagement move that protects flow and respects the Ovsiankina pull back to the code.
- **Why not just phone-alone?** Without the desktop trigger it's just another Antistress clone. The trigger/release loop is the entire differentiated product. (A pure-phone "manual" mode can exist as the on-ramp before someone installs the extension.)

### The VS Code integration concept (timer + idle detection)

Two detection strategies, in increasing fidelity:

1. **Idle/timer heuristic (v1, universal).** The extension watches for the user-input-stops + terminal/output-streaming pattern, or simply: a manual hotkey / the moment you submit a prompt starts a timer. Even a dumb "you hit Enter on a prompt → start a 30s fidget window" is enough to ship and works with *any* tool.
2. **Agent-aware integration (v2, premium).** Hook the actual agent state — Claude Code / Cursor / Copilot expose terminal output, status, or (for Claude Code) hooks/SDK events. The extension reads "generation in progress / complete" directly, enabling the **real progress-fusion** mechanic (the charge wheel genuinely tracks tokens/steps). Claude Code's hook system is a natural fit: a `PreToolUse`/start hook fires "fidget on," a `Stop`/completion hook fires "fidget off."
3. **Ambient desktop fallback.** A menu-bar/status-bar companion that simply detects long-running terminal processes (build, test, agent) — broadens beyond VS Code to any terminal-driven workflow.

The extension should also surface the *passive* version: a tiny fidgetable widget *in the editor gutter or status bar* for users who won't pick up the phone — a click-spinner right where the cursor is. But the phone is where the haptic magic lives.

### App name brainstorm

Grouped by angle. Favorites starred.

**Coding + idle/wait:**
- ★ **Compiling…** (owns the xkcd in-joke; the name *is* the cultural artifact; status-signal built in)
- **Idle Hands**
- **Standby**
- **Loading…** / **`while(wait)`**
- **Cooldown**

**Fidget + flow/calm:**
- ★ **Fidgit** (fidget + git — perfect for the audience; instantly legible)
- **Worrystone**
- **Idle** (clean, but generic)
- **Spindle** (spin + idle)
- **Lull**

**The wait-as-charge / progress-fusion angle:**
- ★ **Spinwait** (real concurrency term — a "spinwait" is a CPU loop that waits by spinning; doubles as the spin mechanic; deeply on-brand for devs)
- **Yield** (the concurrency keyword; you *yield* the thread while it works)
- **Tick** (clock + the haptic tick)
- **Buffering**

**Playful/tribe:**
- **Vibe Check**
- **Prompt & Circumstance**
- **Token Toss**

Top recommendation: **Spinwait** (devs will *get* the pun, it names the exact behavior, and it points straight at the hero spin mechanic) or **Fidgit** (most immediately legible, friendliest, app-store-searchable). **Compiling…** is the strongest *marketing/identity* play if you want the xkcd-tribe wedge.

---

## Part 6 — Practitioner reality check

Direct community signal on "what do you do while the agent runs" is still thin (the behavior is new and under-indexed as of mid-2026), but what exists points the same way. On the Hacker News Claude Code thread, commenters describe the *compulsive* shape of the wait: *"the AI is already running and the bar to seeing what the AI will do next is so low"* — and explicitly liken the LLM loop to **doomscrolling**, "the new reality." This is the behavioral vacuum the product targets: the wait is currently filled by low-friction passive consumption (the next generation cycle, or the phone), not by anything restorative.

The broader developer discourse strongly validates the **slot-machine framing of AI prompting itself** — Cory Doctorow's "LLMs are slot-machines, you only remember the jackpots," a 2025 arXiv paper measuring gambling-like loss-chasing in LLM agents, and commentary that AI vendors' re-prompt-billing model structurally resembles a casino. This matters two ways: (1) it confirms the user is in a variable-reward headspace the fidget can plug into, and (2) it's an ethical guardrail — the product should be the *antidote* to that loop (a clean-release idle valve), not another pull-lever, or it betrays its own premise.

The existing Antistress/fidget-app market (100M+ downloads on the leader) proves mass appetite for digital fidgeting; the absence of any work-triggered, agent-aware entrant confirms the wedge is open.

---

## Part 7 — Actionable checklist (MVP spine)

1. **Position on discharge/calm/vigor, never on "improves focus/productivity."** (Avoids the debunked fidget-spinner overclaim; matches what the research actually supports.)
2. **Phone-first, haptics-first.** Build on Core Haptics; design *textures* (detents, inertia, snap), favor dense over sparse events, strong intensity.
3. **Ship 2 mechanics, deep:** the **Charge Spin** (hero, progress-fused, skill ceiling) + **Pop-Cascade** (universal, completion-pattern). Add Scrub/Beads as the calm lane later.
4. **Every mechanic must be semantically empty, fail-state-free, and droppable in <1s.** No levels, no scores you can lose, no decisions mid-wait.
5. **Build the desktop→phone QR-pair loop as the core differentiator.** Trigger on agent-start, *release on agent-complete with a distinct "you're up" haptic.* The exit signal is a feature, not an afterthought.
6. **VS Code extension: ship the timer/idle heuristic first (works with any tool), then Claude Code hook integration for true progress-fusion.**
7. **Fuse the fidget with the progress bar** (labor-illusion): the thing you play with visibly tracks the model's labor.
8. **Viral loop = identity + skill expression, not variable reward.** Ship a shareable "wait-wrapped" stat card and 3-second skill-clip replays; lean into the "Compiling!" tribe in-joke.
9. **Respect flow above engagement.** Success metric is *not* time-in-app; it's *clean returns to code* and *daily wait-gaps covered without phone-pickup*. This inversion is the whole ethical and product thesis.
10. **Name:** lead with **Spinwait** or **Fidgit**; hold **Compiling…** as the marketing wedge.

---

## Sources

**Fidget toys / ADHD / stimming**
- Graziano, Garcia & Landis (2020), "To Fidget or Not to Fidget," *Journal of Attention Disorders* — https://journals.sagepub.com/doi/abs/10.1177/1087054718770009 and PDF https://self-regulationlab.fiu.edu/fidgetarticlegraziano.pdf (spinners worsened attention in ADHD kids)
- "A quantitative analysis of fidgeting in ADHD…sustained attention," PMC — https://pmc.ncbi.nlm.nih.gov/articles/PMC11246969/
- Schweitzer lab (UC Davis), adult-ADHD Flanker-task fidgeting study, *Frontiers in Psychiatry* (2024) — adults with ADHD fidgeted more during correct trials; supports the compensatory-arousal account of fidgeting in adults
- "Tools or Toys? …Fidget Spinners and Bouncy Bands," ScienceDirect — https://www.sciencedirect.com/science/article/abs/pii/S0361476X23000681
- "Impact of fidget devices on anxiety…adults with ADHD," ScienceDirect — https://www.sciencedirect.com/science/article/abs/pii/S0891422225000289
- TIME, "The Shoddy Science Behind Fidget Spinners" — https://time.com/4775458/shoddy-science-behind-fidget-spinners/
- CHADD, "Fidget Toys and ADHD" — https://chadd.org/adhd-weekly/fidget-toys-and-adhd-still-paying-attention/
- Stimming overview, Simply Psychology (2026) — https://www.simplypsychology.com/articles/stimming-neurodivergence-guide ; "Beyond self-regulation," Sage (2025) — https://journals.sagepub.com/doi/10.1177/27546330241311096 ; CHOP — https://www.research.chop.edu/car-autism-roadmap/stimming-what-is-it-and-does-it-matter

**Fidget spinner virality**
- Dr. Brent Coker, "Fidget Spinners — Why they've gone viral (Psychology)" — https://medium.com/@Webreep/fidget-spinners-why-theyve-gone-viral-psychology-1157b320a33f
- "Tracing the Rise, Fall, and Cultural Impact" — https://finenaturalist.blog/fidget-spinners-rise-fall-cultural-impact
- "A short history of fidgeting," Tortoise — https://www.tortoisemedia.com/2022/08/19/a-short-history-of-fidgeting

**Waiting / attention residue / context switching**
- Leroy (2009), "Why is it so Hard to Do My Work?" (attention residue) — https://www.researchgate.net/publication/46489122
- Mark, Gonzalez & Harris (2005) interruption research; the "~23-min refocus" figure traces to a 2006 Gallup interview with Mark, not a published paper — cite as directional, not precise; her "Cost of Interrupted Work" study found interrupted tasks completed *faster* but with more stress — summarized via Neurosity flow guide https://neurosity.co/guides/how-to-enter-flow-state and context-switching syntheses (Jellyfish https://jellyfish.co/library/developer-productivity/context-switching/ ; Speakwise 2026 stats https://speakwiseapp.com/blog/context-switching-statistics )
- Developer build-wait cost (~3 hrs/day, never resume 29%) — https://www.crownest.dev/blog/hidden-cost-context-switching-developers ; Incredibuild https://www.incredibuild.com/blog/how-much-does-context-switching-cost-your-dev-team

**Zeigarnik / Ovsiankina**
- 2025 meta-analysis, "Interruption, recall and resumption," *Humanities and Social Sciences Communications* (Nature) — https://www.nature.com/articles/s41599-025-05000-w (Zeigarnik fails to replicate; Ovsiankina resumption holds)
- Wikipedia overview — https://en.wikipedia.org/wiki/Zeigarnik_effect

**Loading bars / labor illusion**
- Buell & Norton (2011), "The Labor Illusion," *Management Science* 57(9) — https://pubsonline.informs.org/doi/10.1287/mnsc.1110.1376 ; HBS https://www.hbs.edu/faculty/Pages/item.aspx?num=40158

**Dopamine / variable reward / slot machines**
- Schultz, "Dopamine reward prediction error coding," *Dialogues in Clinical Neuroscience* — https://www.tandfonline.com/doi/full/10.31887/DCNS.2016.18.1/wschultz
- Reward anticipation vs outcome in gambling disorder, Frontiers — https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2014.00100/full
- Tristan Harris, "How Technology Hijacks People's Minds" — https://medium.com/thrive-global/how-technology-hijacks-peoples-minds-from-a-magician-and-google-s-design-ethicist-56d62ef5edf3
- Loren Brichter pull-to-refresh regret; Wikipedia "Pull-to-refresh" — https://en.wikipedia.org/wiki/Pull-to-refresh ; Fast Company https://www.fastcompany.com/3023421/why-the-pull-to-refresh-gesture-must-die

**Haptics**
- "Haptic Rewards: How Mobile Vibrations Shape Reward Response and Consumer Choice," *Journal of Consumer Research* (2025) — https://academic.oup.com/jcr/advance-article/doi/10.1093/jcr/ucaf025/8120234
- "Good Vibrations," Oxford — https://ora.ox.ac.uk/objects/uuid:86da42a5-a53a-4081-90cb-d9d5b57b49d2
- Tactile feedback intensity/interval UX study, ACM — https://dl.acm.org/doi/10.1007/978-3-030-22577-3_29
- Apple Core Haptics / audio-haptic design, WWDC21 — https://developer.apple.com/videos/play/wwdc2021/10278/

**Digital fidget analogues**
- Chrome Dino origins ("Project Bolan", 270M plays/mo), TNW — https://thenextweb.com/news/4-years-later-google-finally-explains-the-origins-of-its-chrome-dinosaur-game ; Wikipedia https://en.wikipedia.org/wiki/Dinosaur_Game
- Antistress (100M+ downloads) & genre — Google Play https://play.google.com/store/apps/details?id=antistress.fidgettoys.popit.satisfyinggames ; AppBrain listings
- Fidgetable (Core Haptics fidget app), App Store — https://apps.apple.com/us/app/fidgetable-haptic-fidget-toy/id6503308266
- xkcd #303 "Compiling" — https://xkcd.com/303/ ; explain xkcd https://www.explainxkcd.com/wiki/index.php/303:_Compiling

**Oddly satisfying / ASMR**
- LiveScience, "Why #OddlySatisfying Videos Are So Satisfying" — https://www.livescience.com/62091-oddlysatisfying-videos-satisfying.html
- "Visual tactility: 'Oddly satisfying' videos," Sage — https://journals.sagepub.com/doi/abs/10.1177/13548565221105196

**Micro-breaks**
- Albulescu et al. (2022), "Give me a break!" meta-analysis, *PLOS ONE* — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0272460 (PMC https://pmc.ncbi.nlm.nih.gov/articles/PMC9432722/ )

**Vibe coding / AI-wait behavior / flow**
- METR (2025), "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (19% slower; felt 20% faster) — https://arxiv.org/abs/2507.09089 — caveat: n=16, CI −26% to +9%; METR's Feb 2026 follow-up described the design as "likely a bad proxy" with selection effects; cite directionally
- "Good Vibrations? A Qualitative Study of …Flow, and Trust in Vibe Coding," arXiv — https://arxiv.org/pdf/2509.12491
- "Ironies of Generative AI," arXiv — https://arxiv.org/pdf/2402.11364
- Cory Doctorow, "LLMs are slot-machines. You only remember the jackpots." — https://doctorow.medium.com/https-pluralistic-net-2025-08-16-jackpot-salience-bias-2a696501bba7
- "Can Large Language Models Develop Gambling Addiction?" arXiv — https://arxiv.org/abs/2509.22818
- HN Claude Code discussion (doomscroll framing) — https://news.ycombinator.com/item?id=46771564
- Karpathy "vibe coding" origin / overview — https://en.wikipedia.org/wiki/Vibe_coding
