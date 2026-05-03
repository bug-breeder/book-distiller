# Practice Exercises: Chapter 7 — Evolutionary Game Theory

## 🧪 Comprehension Check

**Q1:** In the Body-Size Game, both small and large beetles would be better off in a world where everyone stays small (each gets fitness 5) than in the evolutionarily stable outcome (each gets fitness 3). Yet evolution drives the population to the worse collective outcome. How does this happen, and what familiar game from Chapter 6 does this mirror?

<details>
<summary>Answer</summary>

The Body-Size Game has the exact payoff structure of the Prisoner's Dilemma. When large beetles are rare, they do extremely well against the predominantly small population — they get most of the food in nearly every competition, receiving payoffs close to 8. This individual fitness advantage causes the large strategy to spread, even though spreading it degrades the collective environment. No individual beetle "chooses" anything; evolutionary forces select for whatever provides higher reproductive success in the current population composition. The result is an evolutionarily stable outcome at (Large, Large) with fitness 3, which is collectively worse than (Small, Small) with fitness 5 — exactly the logic of the Prisoner's Dilemma arms race, such as athletes escalating to performance-enhancing drugs even though all athletes would prefer a world without them.

</details>

---

**Q2:** What is the precise definition of an evolutionarily stable strategy (ESS), and why does the definition require comparing fitness levels only when invaders are present at a small fraction — rather than checking all possible population compositions?

<details>
<summary>Answer</summary>

A strategy S is evolutionarily stable if there exists some positive threshold y such that whenever any alternative strategy T invades S at any fraction x less than y, the fitness of an S-player is strictly greater than the fitness of a T-player. The definition is deliberately local — it only asks that S can repel small invasions — because evolutionary stability is about persistence against rare mutants or migrants, not about guaranteed dominance in arbitrary population mixes. If S can defeat any small invader, then invaders will reproduce more slowly than S-players, causing the invader fraction to shrink over generations until the invaders die out. Checking large fractions would be a much stronger (and often unrealistic) condition, since any strategy can be overwhelmed if it is already a small minority.

</details>

---

**Q3:** The chapter establishes that every evolutionarily stable strategy yields a Nash equilibrium, but not every Nash equilibrium corresponds to an evolutionarily stable strategy. Using the general two-strategy symmetric game with payoffs a, b, c, d, explain precisely when this gap arises and what it means intuitively.

<details>
<summary>Answer</summary>

In the general symmetric game, (S, S) is a Nash equilibrium whenever a ≥ c — meaning S is at least as good a response to S as T is. Strategy S is evolutionarily stable when either (i) a > c, or (ii) a = c and b > d. The gap occurs in the second case: when a = c, both S and T do equally well against an S-player, so Nash equilibrium doesn't distinguish them. But evolutionary stability then additionally requires b > d — S-players must do better against T-players than T-players do against each other. Intuitively, if T-invaders tie S-players when interacting with the majority, the tiebreaker is how each type fares when they happen to meet one of their own kind; if T-players do at least as well in those T-vs-T encounters, the invading population has no reason to shrink and can eventually take hold.

</details>

---

**Q4:** In the Hawk-Dove Game, neither Hawk nor Dove is evolutionarily stable as a pure strategy, yet p = 1/3 (playing Dove with probability 1/3 and Hawk with probability 2/3) is an evolutionarily stable mixed strategy. Walk through why neither pure strategy is stable, and explain the mathematical argument that shows p = 1/3 is stable.

<details>
<summary>Answer</summary>

Dove is not stable because a rare Hawk invader in an all-Dove population does very well — it wins every food contest unopposed (payoff 5 vs. 3), so its fitness exceeds the majority. Hawk is not stable because a rare Dove in an all-Hawk population does better than the majority — Doves avoid the costly fighting that reduces Hawk-vs-Hawk payoffs to 0, while a Dove among Hawks gets payoff 1, which exceeds 0. For the mixed strategy p = 1/3, the key is that since (p, p) is a mixed Nash equilibrium, every strategy q yields the same payoff V(q, p) = V(p, p) when played against p. Evolutionary stability then reduces to checking whether V(p, q) > V(q, q) for all q ≠ p — that is, whether p is a strictly better response to any invader than that invader is to itself. The computation gives V(p, q) − V(q, q) = (1/3)(3q − 1)^2, which is a perfect square and thus strictly positive for all q ≠ 1/3. Therefore p beats every other strategy in the tiebreaker, confirming evolutionary stability.

</details>

---

**Q5:** The chapter describes two interpretations of an evolutionarily stable mixed strategy: (1) every individual genuinely randomizes with the given probability, and (2) the population is split between pure strategists in the right proportions. Why do these two interpretations produce the same observable outcomes and the same fitness calculations?

<details>
<summary>Answer</summary>

Under interpretation (1), every individual plays Dove with probability p and Hawk with probability 1 − p; when two random individuals meet, the probability of any strategy pair (D, D), (D, H), (H, D), (H, H) is determined by multiplying the individual probabilities. Under interpretation (2), a fraction p of the population always plays D and a fraction 1 − p always plays H; when two random individuals meet, the probability of any strategy pair is also determined by multiplying those population fractions. Because interactions are random and the fractions match the probabilities, both interpretations generate exactly the same distribution over outcomes in any given encounter. Consequently, expected payoffs — and hence fitness — are identical under both readings. The two interpretations are mathematically equivalent because fitness depends only on the frequency of strategies encountered, not on whether the mixing happens inside each individual or across individuals in the population.

</details>

---

## 🔄 Apply It

**Scenario 1: The Open-Source Contributor Problem**
A software company relies on a combination of developers who contribute bug fixes back to the shared codebase (Cooperators) and developers who take from the shared codebase without contributing (Free-Riders). Contributing takes time and reduces individual productivity; free-riding is individually less costly but depends on others contributing. The company notices that over several hiring cycles, free-riders gradually displace cooperators, even though teams full of cooperators ship better products.

*What should you consider?*
- Does the interaction structure between developers resemble a Prisoner's Dilemma, a Hawk-Dove, or a Stag Hunt? What payoff values would need to hold for each interpretation?
- If contributing is a dominant strategy for any individual developer regardless of what others do, would that change the evolutionary outcome?
- Can changing the payoff structure — for instance, by making free-riding visible and penalized — shift which strategy is evolutionarily stable?

<details>
<summary>Model Response</summary>

The scenario closely resembles the Prisoner's Dilemma structure from the Body-Size Game: free-riding is the Large strategy and cooperating is the Small strategy. If the payoff to a free-rider paired with a cooperator exceeds the payoff to two cooperators working together, and two free-riders produce less than two cooperators, the evolutionarily stable outcome is a population of free-riders — even though a population of cooperators would be collectively more productive. To verify this, you would assign approximate payoffs: two cooperators might each produce value 5; a free-rider paired with a cooperator might gain 8 while the cooperator gets 1; two free-riders might each produce 3. Those numbers reproduce the Body-Size Game exactly, predicting that free-riding is evolutionarily stable.

Changing the payoffs through institutional design can shift stability. If the company introduces transparent contribution tracking and social penalties for free-riding, the payoff to free-riding when paired with a cooperator drops. If that payoff falls below the payoff to cooperating with a cooperator (i.e., the "c" entry falls below "a"), the Prisoner's Dilemma structure breaks. If the penalty is strong enough that cooperating becomes a strictly dominant strategy (a > c and b > d in the general matrix), then cooperating becomes the unique evolutionarily stable strategy. The evolutionary game theory framework tells you exactly where to intervene: you need to make free-riding less attractive specifically in the "free-rider meets cooperator" scenario, since that is the interaction that drives the invasion dynamic.

</details>

---

**Scenario 2: Startup Pricing Wars**
Two competing ride-sharing startups are each deciding whether to maintain high fares (Conserve) or slash prices below cost to capture market share (Explore/Aggressive). Aggressive pricing wins customers from the competitor, but if both companies slash prices simultaneously, both lose money and the market produces poor returns for investors. The startups are each making these fare decisions through algorithmic pricing systems that adjust based on competitor behavior — not through deliberate executive strategy sessions.

*What should you consider?*
- Does the fact that pricing decisions are made by algorithms (not rational deliberating executives) make evolutionary game theory more or less appropriate as an analytical tool?
- What does the ESS prediction say about where this market will settle if the payoffs resemble the Body-Size Game?
- If the payoff structure instead resembles Hawk-Dove — meaning both companies pricing aggressively simultaneously is catastrophic enough that one of them would prefer to back down — what does the ESS analysis predict?

<details>
<summary>Model Response</summary>

Evolutionary game theory is arguably more appropriate here than classical game theory, precisely because the algorithms are not consciously reasoning about equilibria. The algorithms observe which pricing behaviors produce better revenue outcomes and adjust accordingly — this is an imitation/learning dynamic that mirrors the evolutionary selection mechanism. Strategies that produce better results spread; strategies that produce worse results are revised away. The absence of conscious deliberation is a feature of the evolutionary framework, not a problem for it.

If payoffs resemble the Body-Size Game (Prisoner's Dilemma structure), the ESS prediction is that both companies will race to aggressive pricing even though both would be better off sustaining high fares. The aggressive strategy is evolutionarily stable: a company maintaining high fares in a market full of aggressive pricers loses customers and revenue, while an aggressive invader into a high-fare market captures the market. Regulatory intervention or a binding coordination agreement would be needed to shift the equilibrium.

If payoffs resemble Hawk-Dove — where two simultaneously aggressive companies both suffer ruinously while one aggressive company against one passive company still allows both to survive (just unequally) — the ESS is a mixed strategy. In this regime, we expect to observe the market naturally producing a mixture of pricing behaviors over time: sometimes one company slashes prices while the other holds high fares, and which company plays which role may alternate. This mixture is stable because neither pure strategy is a best response to itself, and the system settles at a frequency where each type of behavior has equal average fitness.

</details>

---

**Scenario 3: Academic Department Norms**
In a university department, faculty can either invest time in mentoring junior colleagues (Cooperative) or focus exclusively on their own research output (Selfish). Mentoring is costly to the mentor but raises the mentee's output. The department head observes that over a decade of hiring, collaborative norms in the department have gradually eroded — even though the faculty hired earlier consistently report that the old mentoring culture made everyone more productive.

*What should you consider?*
- How does the evolutionary framework explain the erosion of cooperative norms without assuming any individual faculty member is acting in bad faith?
- What role does the "fitness" measure (here, research output, citations, or promotion outcomes) play in determining which strategy is evolutionarily stable?
- If the department changes promotion criteria to explicitly reward mentoring contributions, which parameter in the general symmetric game payoff matrix does this change, and what is the predicted effect on the ESS?

<details>
<summary>Model Response</summary>

The evolutionary framework explains the erosion without invoking bad faith: it only requires that selfish faculty produce better outcomes on whatever metric drives hiring and promotion decisions. If hiring committees observe individual publication records and citation counts (the "fitness" proxy), and selfish faculty who free-ride on a mentoring culture produce better individual metrics than cooperative faculty who invest time in others, then each new hire made on those metrics slightly increases the proportion of selfish faculty. Over many hiring cycles, the invader (selfish) strategy spreads because it has higher fitness in a cooperative environment — exactly the dynamic that makes Small not evolutionarily stable in the beetle example.

The fitness measure is decisive. In the general payoff matrix with strategies S (Cooperative) and T (Selfish): if c > a — meaning a selfish newcomer in a cooperative department does better than a cooperative faculty member in that same department — then Cooperative fails the ESS condition immediately (a > c is required). This is precisely what happens when individual output metrics reward free-riding on shared mentoring infrastructure.

Changing promotion criteria to reward mentoring contributions modifies the payoff a (Cooperative vs. Cooperative) and reduces c (Selfish vs. Cooperative, now penalized for not mentoring). If the revision makes a > c, Cooperative becomes the unique evolutionarily stable strategy. The ESS analysis tells the department head exactly which parameter to target: not the payoff when both are selfish (d), but the relative payoff when a selfish newcomer meets an established cooperative majority (c must fall below a).

</details>

---

## ✍️ Reflection Prompts

1. Think of a competitive situation in your professional life — bidding for projects, negotiating salaries, racing to publish results — where you or your peers gradually escalated effort or cost over time, even though everyone involved seemed worse off for it. Now that you understand how Prisoner's Dilemma payoffs create evolutionarily stable arms races without anyone intending the outcome, what would you change about how you frame or respond to the next such escalation?

2. Think of a social norm or cultural practice in a group you belong to — a team, a family, a community — that persists even though most members privately agree it is suboptimal. What would you do differently this week if you approached that norm as an evolutionarily stable strategy: something that persists not because people prefer it, but because any individual who deviates unilaterally does worse than those who conform?

3. Think of a time when you assumed that because an outcome was collectively bad, someone must have made a mistake or acted irrationally. How would your explanation of that situation change now that you understand that evolutionary stability can produce outcomes that are collectively worse than an alternative, through a mechanism that requires no bad decisions by any individual — only the local fitness advantage of one behavior over another in the current population?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain what an evolutionarily stable strategy is in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

An evolutionarily stable strategy is a behavior that, once it becomes common in a population, cannot be displaced by any rare alternative behavior — because organisms using the common strategy always outreproduce any small group of invaders using a different strategy. The key insight is that the success of any behavior depends on who else is in the population: a behavior that seems costly in isolation might thrive because it does especially well in competition against the alternatives that actually exist. Unlike rational game theory, no one has to think or choose — natural selection (or any imitation-based process) does the work, and the strategies that persist are precisely those that are self-reinforcing once they become prevalent.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a social network (from Chapter 2 concepts) in which individuals interact only with their direct neighbors rather than with random members of the full population. Suppose the network is a regular graph where every node has exactly k neighbors, and individuals play the Hawk-Dove Game with each of their neighbors each generation. Their overall fitness is the average payoff across all their local interactions.

Now consider a small cluster of Dove-players embedded in a neighborhood of mostly Hawk-players. Using what you know about the Hawk-Dove evolutionarily stable mixed strategy (p = 1/3 Dove, 2/3 Hawk at the population level), answer the following:

(a) In the well-mixed population model from Chapter 7, a Dove invading an all-Hawk population does better than the Hawks around it. Does the same logic hold when interactions are local — that is, when the Dove cluster interacts primarily with each other and with the Hawks on the cluster boundary, rather than with a random draw from the whole population?

(b) If the Dove cluster is tightly connected (many edges within the cluster, few edges to Hawks), how does the local fitness of Doves within the cluster compare to the fitness of Hawks just outside the cluster? What does this suggest about whether network structure can allow Dove clusters to survive and grow, even in a population where Hawk is favored in random pairings?

(c) Explain in one paragraph how network structure — specifically the concept of clustering and local density from Chapter 2 — can change which behaviors persist in a population relative to the prediction of the well-mixed evolutionary model.

**Chapters involved:** Chapter 7 (Evolutionary Game Theory — ESS, Hawk-Dove) + Chapter 2 (Graphs and Social Networks — local structure, clustering, neighbor interactions)

---

## 📋 Action Items

1. On Monday morning, before checking email, write down one recurring competitive dynamic in your work or personal life — a situation where you and at least one other party keep escalating effort, cost, or aggressiveness. Map it to a 2x2 payoff matrix: estimate rough values for what happens when both escalate, both hold back, and each combination in between. Then apply the ESS condition (is a > c, or a = c and b > d?) to determine which strategy the evolutionary logic predicts will dominate — and whether that matches what you actually observe.

2. This week, identify one group norm or standard practice in a team or community you are part of that most members privately consider suboptimal (a process nobody likes, a meeting nobody finds useful, a convention everyone follows anyway). Treat it as a candidate ESS: ask what individual-level incentive keeps people from deviating unilaterally, and what change to the "payoff structure" — a policy, a metric, a social consequence — would be needed to make the better alternative evolutionarily stable rather than just collectively preferred.

3. Find one real-world example of a biological or social arms race — antibiotic resistance, social media engagement optimization, corporate lobbying escalation, or similar — and write a half-page analysis applying the three core ESS concepts from this chapter: (a) what are the two competing strategies, (b) what is the payoff matrix structure (Prisoner's Dilemma, Hawk-Dove, or Stag Hunt), and (c) what does evolutionary stability analysis predict about the long-run outcome, and what intervention (if any) could shift which strategy is stable.
