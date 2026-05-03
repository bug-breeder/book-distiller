# Chapter 7: Evolutionary Game Theory

## 🧠 Core Thesis
Game-theoretic equilibrium concepts like Nash equilibrium emerge naturally from evolutionary forces acting on populations over time — even when no individual organism is consciously reasoning or making choices. The fitness of any organism depends on the strategies of those around it, turning evolution itself into a game with predictable, stable outcomes.

## 📖 Detailed Breakdown

### Fitness as a Result of Interaction

- **What it is:** The idea that an organism's fitness (its reproductive success) cannot be measured in isolation — it depends on the strategies used by the other organisms it interacts with. An organism's genetically-determined behavior is its "strategy," its reproductive success is its "payoff," and the payoff depends on the strategies of the organisms it encounters.
- **Why it matters:** This reframes evolution from a simple individual-versus-environment story into a genuinely strategic, multi-player problem. It opens the door to applying game theory to biology without requiring any conscious decision-making.
- **How it works:** Consider beetles competing for food. Large beetles win food competitions against small beetles, but large body size is metabolically expensive. Whether being large helps or hurts depends entirely on what proportion of the population is also large. The fitness payoff is not fixed; it shifts with the composition of the population.
- **Key quote or example:** The Body-Size Game payoff matrix captures this concretely. When Beetle 1 and Beetle 2 both play Small, each receives a payoff of 5. When one plays Large and the other Small, the Large beetle gets 8 and the Small gets 1. When both play Large, each gets only 3 — lower than the mutual Small outcome of 5, because large beetles must expend extra metabolic energy competing with each other. This structure is precisely a Prisoner's Dilemma.
- **Connection:** This foundational idea motivates the entire chapter: fitness-as-payoff means evolutionary outcomes can be analyzed using the equilibrium tools developed in Chapter 6.

### Evolutionarily Stable Strategies (ESS)

- **What it is:** An evolutionarily stable strategy (ESS) is a genetically-determined strategy that, once it becomes prevalent in a population, cannot be successfully invaded by any small group of organisms using a different strategy. The invaders eventually die off because their fitness is strictly lower than that of the majority.
- **Why it matters:** ESS is the evolutionary analogue of Nash equilibrium. It gives a precise, testable prediction about which behavioral traits will persist in a population over evolutionary time scales, without invoking individual rationality.
- **How it works:** Formally, a strategy S is evolutionarily stable if there exists some threshold invasion level y such that whenever a small fraction x < y of the population uses any alternate strategy T, organisms playing S have strictly greater expected fitness than organisms playing T. Fitness is defined as the expected payoff from a random pairwise interaction in the population. If an x fraction plays T and a (1-x) fraction plays S, then: fitness of an S-player = payoff against S × (1-x) + payoff against T × x, and similarly for T-players. S is stable if this expression is always larger for S-players when x is small.
- **Key quote or example:** In the Body-Size Game, checking whether Small is ESS: a Small beetle's expected fitness is 5(1-x) + 1·x = 5 - 4x, while a Large beetle's fitness is 8(1-x) + 3·x = 8 - 5x. For small x, 8 - 5x > 5 - 4x, so Large invaders do better. Small is NOT evolutionarily stable. Checking Large: a Large beetle's fitness is 3(1-x) + 8·x = 3 + 5x, while a Small invader's fitness is 1(1-x) + 5·x = 1 + 4x. For small x, 3 + 5x > 1 + 4x, so Large residents out-compete Small invaders. Large IS evolutionarily stable.
- **Connection:** The ESS concept is a direct evolutionary parallel to Nash equilibrium, and Section 7.4 formalizes exactly how the two are related.

### Evolutionary Arms Races and the Prisoner's Dilemma in Nature

- **What it is:** Many biological interactions have a Prisoner's Dilemma structure, where individual evolutionary pressure drives organisms toward a strategy that is collectively worse. The Body-Size Game is one instance; similar structures appear across biology.
- **Why it matters:** It explains why evolution can produce outcomes that are bad for everyone involved — an apparent paradox if you assume natural selection always improves fitness.
- **How it works:** In the Body-Size beetle game, both beetles are better off if the population stays Small (fitness = 5 for each) than if it becomes all-Large (fitness = 3 for each). But evolutionary pressure drives the population toward Large anyway, because any individual Large mutant in a Small population gets a massive advantage (fitness 8 vs. 5). The population gets locked into a worse collective outcome — exactly the logic of an arms race.
- **Key quote or example:** Three empirical examples are discussed. (1) Tree height: Two neighboring trees sharing sunlight get equal shares whether both are short or both tall, but the tall tree gets more if its neighbor is short. Investing in height is metabolically costly, yet trees are pushed toward it anyway — Short and Tall mirror the Small and Large beetle strategies. (2) Soybean root systems: Plants whose roots intermingle with a neighbor's roots must invest heavily in root production just to claim their share of soil nutrients; plants separated by a wall each keep half the soil resources while investing less energy in roots and achieving greater seed production. The Explore strategy (spread roots everywhere) is evolutionarily stable even though Conserve leaves both plants better off. (3) Virus populations: Phage Φ6 and its mutant variant ΦH2 interact in a Prisoner's Dilemma structure confirmed by measured replication rates. ΦH2 free-rides on chemical products manufactured by Φ6, gaining fitness advantage when Φ6 is present, even though a population of pure Φ6 outperforms a pure ΦH2 population. Only ΦH2 is evolutionarily stable.
- **Connection:** This section grounds the abstract ESS definition in real biology, and also draws the explicit parallel to the performance-enhancing drugs example from Chapter 6, previewing the broader principle formalized in Section 7.3.

### General Characterization of ESS in Two-Strategy Symmetric Games

- **What it is:** A clean algebraic condition that tells you, for any symmetric two-player, two-strategy game, exactly when each strategy is evolutionarily stable.
- **Why it matters:** It reduces ESS analysis from a case-by-case calculation to a simple comparison of four payoff numbers.
- **How it works:** In the General Symmetric Game (Figure 7.3), strategy S yields payoff a against another S-player and b against a T-player; strategy T yields payoff c against S and d against T. Strategy S is evolutionarily stable if and only if either: (i) a > c (S does strictly better against S than T does against S), or (ii) a = c and b > d (they do equally well against S, but S beats T when they interact with each other). The intuition: for S to resist invasion, it must first be that T-invaders cannot outperform S-players when T is rare (condition i). If the two strategies are tied against S (condition i fails), then S can still be stable if S-players do better than T-players in their own encounters with each other (condition ii), which allows the S-majority to maintain an advantage even as the T-minority grows slightly.
- **Key quote or example:** "In a two-player, two-strategy, symmetric game, S is evolutionarily stable precisely when either (i) a > c, or (ii) a = c and b > d."
- **Connection:** This characterization directly sets up the formal comparison with Nash equilibrium in Section 7.4.

### Relationship Between ESS and Nash Equilibrium

- **What it is:** A formal hierarchy of equilibrium concepts: strict Nash equilibrium implies ESS, ESS implies Nash equilibrium, but neither implication reverses.
- **Why it matters:** It shows that evolutionary stability and rational strategic reasoning converge on the same predictions in many cases, but evolutionary stability is a more demanding and more specific concept. ESS filters out some Nash equilibria that are strategically fragile.
- **How it works:** In the General Symmetric Game, (S, S) is a Nash equilibrium when a ≥ c (S is a best response to S). S is evolutionarily stable when a > c, or a = c and b > d. Since both conditions of ESS are stronger than a ≥ c alone, every ESS implies a Nash equilibrium, but not vice versa. The gap is bridged by weakly dominated strategies: if a = c and b < d, then (S, S) is a Nash equilibrium but S is not evolutionarily stable. The modified Stag Hunt Game (Figure 7.5) illustrates this: (Hunt Stag, Hunt Stag) is a Nash equilibrium because hunting stag is a best response when the other player hunts stag. But a = c = 4 and b = 0 < d = 3, so Hunt Stag is not evolutionarily stable — a hare-hunter in a mostly-stag-hunting population does equally well against stag-hunters but better against other hare-hunters, so the invasion can take hold.
- **Key quote or example:** The nesting relationship: Strict Nash equilibrium → Evolutionarily Stable Strategy → Nash equilibrium. Each implication is one-directional only.
- **Connection:** This result shows ESS as a "refinement" of Nash equilibrium — it selects among Nash equilibria those that are robust to perturbation. The concept of evolutionary dynamics as a selection mechanism among Nash equilibria appears in social/economic contexts too, not just biology.

### Evolutionarily Stable Mixed Strategies

- **What it is:** An extension of the ESS concept to allow mixed strategies — probability distributions over pure strategies — either because each individual is genetically programmed to randomize, or because the population contains a stable mix of individuals each playing a pure strategy.
- **Why it matters:** Many games (like the Hawk-Dove Game) have no pure-strategy ESS. In these cases, evolutionary forces push toward a mixed equilibrium rather than eliminating all variation. This explains the persistence of behavioral polymorphism in nature.
- **How it works:** In the Hawk-Dove Game (Figure 7.6), playing Hawk (H) earns 5 when the opponent plays Dove (D), and 0 when both play Hawk. Playing Dove earns 3 against Dove, and 1 against Hawk. Neither D nor H is its own best response, so neither is a pure ESS. To find a mixed ESS, recall from Chapter 6 that a mixed Nash equilibrium requires both pure strategies to be equally good responses. Setting the expected payoff from D equal to that from H when the opponent plays mixed strategy p (probability of D): payoff from D = 3p + 1(1-p) = 1 + 2p; payoff from H = 5p + 0(1-p) = 5p. Setting equal: 1 + 2p = 5p gives p = 1/3. So (1/3, 1/3) is a mixed Nash equilibrium. To verify evolutionary stability, one must check Inequality (7.1): (1-x)V(p,p) + xV(p,q) > (1-x)V(q,p) + xV(q,q) for small x and all q ≠ p. Since (p,p) is a mixed Nash equilibrium, V(p,p) = V(q,p) for all q, so the condition simplifies to V(p,q) > V(q,q). Computing: V(p,q) - V(q,q) = (1/3)(3q-1)^2, which is strictly positive for all q ≠ 1/3. So p = 1/3 is indeed evolutionarily stable.
- **Key quote or example:** The mixed equilibrium p = 1/3 has two equivalent interpretations: (1) every individual is genetically programmed to play Dove with probability 1/3 and Hawk with probability 2/3, or (2) 1/3 of the population is hard-wired to always play Dove and 2/3 is hard-wired to always play Hawk. Both interpretations yield identical population-level behavior and identical fitness calculations — the distinction is unobservable from the outside.
- **Connection:** Mixed ESS generalizes the pure-strategy ESS concept and is the evolutionary counterpart to mixed Nash equilibria from Chapter 6. The technique of first finding mixed Nash equilibria and then checking evolutionary stability provides a practical search algorithm for mixed ESS.

### The Prisoner's Dilemma vs. Hawk-Dove Boundary

- **What it is:** A conceptual distinction between two qualitatively different game structures that share superficial similarities but differ in whether mutual defection/aggression is merely suboptimal or actively catastrophic.
- **Why it matters:** The boundary between these two structures determines whether a population evolves toward a pure evolutionarily stable strategy (Prisoner's Dilemma) or a mixed evolutionarily stable strategy (Hawk-Dove). This has concrete biological consequences.
- **How it works:** In Prisoner's Dilemma, both players playing the "selfish" strategy yields a worse outcome than mutual cooperation, but the penalty is mild enough that one player can profitably defect unilaterally. Defection is a dominant strategy. In Hawk-Dove, both playing "selfish" (Hawk) is so costly (payoff 0 vs. 0) that there is a strong incentive for at least one party to switch to "passive" (Dove). The real-world case of female lions defending territory (Confront vs. Lag strategies) is discussed as a situation where determining which game structure applies requires understanding exact payoff values — and where the evolutionary consequence hinges on that determination.
- **Key quote or example:** The modified Virus Game (Figure 7.7) with payoff (0.50, 0.50) when both play ΦH2 transforms the Prisoner's Dilemma structure into a Hawk-Dove structure: now having both viruses play the "free-rider" strategy is sufficiently harmful that one needs to play the "worker" role, predicting a mixed ESS where both virus behaviors coexist in the population.
- **Connection:** This section synthesizes the chapter by showing that small changes in payoff values can shift a system between qualitatively different evolutionary regimes, tying back to the Hawk-Dove analysis in Chapter 6 (Section 6.6).

## 🔑 Key Takeaways

1. Evolutionary forces can produce game-theoretic equilibria without any conscious reasoning — fitness, reproduction, and selection are sufficient to drive populations to stable strategy profiles.
2. An evolutionarily stable strategy (ESS) is one that, once prevalent, cannot be invaded by a small mutant population using any alternate strategy, because the invaders have strictly lower fitness.
3. Large body size in beetles is evolutionarily stable even though a population of all-large beetles has lower individual fitness than a population of all-small beetles — evolution optimizes individual advantage, not collective welfare.
4. ESS is strictly stronger than Nash equilibrium: every ESS corresponds to a Nash equilibrium, but some Nash equilibria are not evolutionarily stable (specifically, those built on weakly dominated strategies).
5. Strict Nash equilibrium is the strongest concept: if (S, S) is a strict Nash equilibrium (a > c), then S is automatically an ESS.
6. When no pure-strategy ESS exists (as in Hawk-Dove), evolution drives the population toward a mixed ESS — a stable ratio of behavioral types — rather than eliminating all but one strategy.
7. The two interpretations of a mixed ESS (every individual randomizes, vs. the population contains a fixed ratio of pure-strategy types) are mathematically equivalent and empirically indistinguishable.
8. Evolutionary dynamics apply beyond biology: in any population where people imitate successful strategies or learn from past outcomes, the same logic can drive behavior toward evolutionarily stable strategies even without genetic inheritance.
9. Natural selection does not always increase the fitness of organisms. When the environment is defined by the other organisms in the population, a fitness-increasing mutation can shift the environment in ways that lower everyone's fitness — the evolutionary arms race paradox.
10. The boundary between Prisoner's Dilemma and Hawk-Dove game structures is empirically consequential: it determines whether populations converge on a single dominant strategy or maintain a stable behavioral polymorphism.

## 🗺️ Mental Model / Framework

Think of a population as a pool of competing strategies, each spreading or shrinking based on how well they perform against whatever mix of strategies they encounter. An evolutionarily stable strategy is like an immune system for a population: when the dominant strategy is "healthy," small invasions of foreign strategies get eliminated because they can't thrive in an environment dominated by the resident. But if the dominant strategy has a weakness — if invaders do better when rare — then the dominant strategy is "immunocompromised" and can be displaced.

The decision tree for analyzing any symmetric two-strategy evolutionary game works as follows:

Step 1 — Check if a > c (incumbent does strictly better against itself than invader does against incumbent). If yes, the incumbent is ESS. Stop.

Step 2 — If a = c (tie against the incumbent), check if b > d (incumbent beats invader when they meet each other). If yes, ESS. If no (b < d), not ESS even though it may be a Nash equilibrium.

Step 3 — If neither pure strategy passes the ESS test, look for a mixed ESS by first finding the mixed Nash equilibrium probability p that makes both pure strategies equally attractive, then verifying that V(p,q) > V(q,q) for all q ≠ p.

The game structure itself — Prisoner's Dilemma, Stag Hunt, Hawk-Dove — determines which step resolves the analysis and what form the stable outcome takes.

## 💡 "Aha!" Moments

1. Evolution can make everyone worse off, permanently. The beetle population driven to all-Large has a per-organism fitness of 3, lower than the all-Small fitness of 5. This is not a transitional state — it is the stable equilibrium. Natural selection, operating on individuals, produces an outcome that is collectively irrational, in exactly the same way that rational self-interest produces mutual defection in the Prisoner's Dilemma. The mechanism is completely different (no reasoning whatsoever), but the conclusion is identical. Evolution is not a process that optimizes population welfare.

2. Biological polymorphism — the stable coexistence of multiple behavioral types in a population — is not noise or a sign of evolution being incomplete. It is the predicted equilibrium outcome of evolutionary dynamics in Hawk-Dove-type games. The 1/3 Dove, 2/3 Hawk ratio in the Hawk-Dove Game is not a disequilibrium waiting to resolve; it is the final, stable state. This reframes what look like biological inconsistencies (why do some animals fight while others of the same species don't?) as the expected output of a well-understood equilibrium.

3. Viruses play games. Turner and Chao demonstrated empirically, by measuring actual replication rates, that two variants of Phage can be in a Prisoner's Dilemma relationship with measured payoff values. The "free-rider" variant ΦH2 exploits the chemical products of Φ6, gaining a fitness advantage in mixed populations — exactly as a rational player would defect in a Prisoner's Dilemma. The game-theoretic structure is not an analogy imposed on the biology; it is measurable and predictively accurate.

## 🔗 Connections to Other Chapters

This chapter is a direct extension of Chapter 6 (Game Theory). Every concept here has a direct parallel: fitness is payoff, ESS is Nash equilibrium, mixed ESS is mixed Nash equilibrium. The chapter explicitly revisits several games from Chapter 6 — the Prisoner's Dilemma (athletes and drugs, now beetles and body size), the Stag Hunt, and the Hawk-Dove Game — reanalyzing them under evolutionary rather than rational-choice assumptions and arriving at strikingly similar conclusions.

The Prisoner's Dilemma structure identified in the Body-Size Game connects to Chapter 6's treatment of dominant strategies: Large is a dominant strategy in the Body-Size Game (it does better regardless of what the opponent does), just as defecting is dominant in the classic Prisoner's Dilemma. The ESS concept confirms what dominant-strategy analysis already implies: Large will prevail.

The hierarchy Strict Nash → ESS → Nash equilibrium provides a formal "refinement" framework that carries forward into later chapters dealing with equilibrium selection in more complex settings. The insight that evolutionary dynamics can serve as a selection mechanism among multiple Nash equilibria — picking out those that are robust to small perturbations — is a methodological tool that applies wherever there are repeated interactions and imitation dynamics, not only in biological systems.

The Hawk-Dove mixed ESS analysis at p = 1/3 ties back to the mixed Nash equilibrium computation from Chapter 6 and foreshadows subsequent discussions of behavioral diversity in networks, where different agents may persistently use different strategies in stable configurations.

## 📝 In My Own Words (ELI5)

Imagine a school cafeteria where kids are competing to get the best lunch. Some kids are naturally pushy and take more food; others are naturally polite and share. The pushy strategy only works well if most other kids are polite — when everyone is pushy, they all end up fighting and dropping their trays, so everyone gets less. When everyone is polite, a single pushy kid can swoop in and eat like a king.

Evolutionary game theory asks: over many generations, which type of behavior "wins" and spreads through the population?

Here is the key insight: you cannot judge a behavior in isolation. Whether being pushy helps depends entirely on who else is in the cafeteria. If almost everyone else is polite, being pushy is a huge advantage — so the pushy genes spread. If almost everyone else is already pushy, being polite lets you avoid the chaotic food fights — so sometimes polite genes can hold on too.

An "evolutionarily stable strategy" is a behavior that, once it spreads through the school, cannot be beaten by a new kind of kid showing up. If a polite school gets invaded by a few pushy kids, and those pushy kids do better and have more kids (more polite), then politeness was not stable — it got taken over.

Mathematically, we frame this as a payoff table (like a score sheet for lunch outcomes), and we check whether the dominant behavior keeps winning even when a small number of outsiders try a different tactic.

Some surprising outcomes:
- Sometimes the evolutionarily stable behavior makes everyone worse off. In the beetle example, all large beetles get fitness 3, but all small beetles would each get 5. Evolution drives the population to a collectively worse outcome, because individual large beetles always beat individual small beetles in a fight. Nobody planned this — it just happened through selection pressure.
- Sometimes no single behavior can dominate. In the Hawk-Dove situation (think aggressive vs. passive animals fighting over food), a pure population of all-aggressives is unstable (doves do better by staying out of fights) and a pure population of all-passives is unstable (hawks swoop in and dominate). The stable outcome is a mix: exactly 1/3 passive and 2/3 aggressive, which can mean either every individual randomizes or the population settles at that ratio of types. Both interpretations give the same observable behavior.
- Viruses, trees, and lion prides all play these games without knowing it. The "strategies" are encoded in genes; fitness differences select which genes survive.

The deepest point: rational human players making conscious choices and mindless organisms being shaped by natural selection can converge on identical behaviors, because both processes are searching for stable states where no one can do better by switching.
