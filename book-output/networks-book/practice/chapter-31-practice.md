# Practice Exercises: Chapter 23 — Voting

## 🧪 Comprehension Check

**Q1:** The Condorcet Paradox shows that even when every individual's preferences are transitive, the group preferences produced by majority rule can be intransitive. Why does this happen, and what does it reveal about the nature of majority rule as a collective decision-making mechanism?

<details>
<summary>Answer</summary>

The Condorcet Paradox arises because majority rule compares alternatives in pairs and the "majority" coalition for each pairwise comparison can be a different subset of the population. With three voters ranking X, Y, Z differently (voter 1: X>Y>Z, voter 2: Y>Z>X, voter 3: Z>X>Y), the majority prefers X to Y (voters 1 and 3), Y to Z (voters 1 and 2), but also Z to X (voters 2 and 3), creating a cycle. This reveals that majority rule is not a coherent aggregation device for more than two alternatives — it treats each pairwise comparison independently, so the results need not cohere into a consistent global ranking. The group behaves "incoherently" even though each individual is perfectly rational.

</details>

---

**Q2:** Arrow's Impossibility Theorem states that the only voting system satisfying both Unanimity and Independence of Irrelevant Alternatives (IIA) when there are three or more alternatives is dictatorship. Why is IIA such a demanding condition, and why does violating it lead to the pathologies we observe in the Borda Count and plurality voting?

<details>
<summary>Answer</summary>

IIA requires that the group ranking between any pair of alternatives X and Y depend only on how each voter ranks X versus Y — not on how any third alternative Z is ranked. This is demanding because it forces the voting system to evaluate each pair in isolation, ruling out any method that uses positional information (scores, points) across the full ranking. When IIA is violated, as in the Borda Count, a third alternative Z that loses head-to-head to both X and Y can still serve as a "spoiler": by absorbing points from one of the frontrunners, it shifts the group outcome even though voters' relative opinions about X and Y have not changed. In plurality voting, a minor candidate similarly pulls votes from the preferred major candidate, distorting the outcome. Arrow's theorem explains this is not a fixable bug — any non-dictatorial system satisfying Unanimity must violate IIA, meaning some irrelevant alternative will always be capable of flipping the result.

</details>

---

**Q3:** The Median Voter Theorem rescues majority rule from the Condorcet Paradox under the condition of single-peaked preferences. What does single-peaked mean, why is it a natural assumption in many political contexts, and why does it guarantee that majority rule produces a complete, transitive group ranking?

<details>
<summary>Answer</summary>

A voter has single-peaked preferences when the alternatives can be arranged on a line and her preferences fall away consistently on both sides of her most-favored alternative — she never prefers two options that straddle a middle option she dislikes. In political contexts this is natural: if candidates span a left-to-right spectrum and voters each have an ideological "ideal point," preferences decline with distance from that ideal, producing a peak. When all preferences are single-peaked, the Condorcet Paradox cannot arise because the median individual favorite defeats every other alternative in a pairwise majority vote. The key insight is that any voter whose peak is to the left of the median also prefers the median to anything further right (and symmetrically for those to the right), so the median always commands a strict majority against any challenger. Building the full ranking by iteratively finding medians on the remaining alternatives produces a complete, transitive group ranking.

</details>

---

**Q4:** The Condorcet Jury Theorem says that with many sincere voters each slightly better than random at identifying the correct alternative, majority rule converges on the correct answer with probability approaching 1. But the chapter also shows that sincere voting is often not a Nash equilibrium. How can both of these things be true simultaneously, and what does this tension reveal?

<details>
<summary>Answer</summary>

Both results are simultaneously true because they operate under different assumptions about voter behavior. The Condorcet Jury Theorem assumes sincere voting — each voter simply reports the signal she received. Under that assumption, the Law of Large Numbers guarantees the majority signal converges to the true state as the number of voters grows. However, the game-theoretic analysis reveals that sincere voting is not individually optimal: a rational voter should ask "when does my vote actually affect the outcome?" and condition on that event. In the urn experiment, the pivotal event reveals information that makes the apparently worse alternative actually the correct one, so the individually rational response is to vote insincerely. The tension reveals a fundamental gap between what is collectively optimal (everyone voting sincerely) and what is individually rational in a strategic sense — an instance of the broader theme that individually rational behavior in institutions can undermine the institution's intended purpose.

</details>

---

**Q5:** The unanimity rule in jury trials is specifically designed to protect innocent defendants by requiring every juror to vote to convict. Yet the chapter shows that under strategic reasoning, this rule can paradoxically increase the probability of convicting innocent defendants compared to a supermajority rule. Walk through the logic of why this happens.

<details>
<summary>Answer</summary>

Under the unanimity rule, a juror's vote to acquit only affects the outcome when she is the sole holdout — that is, when all other k-1 jurors are voting to convict. If those other jurors are voting their signals sincerely, this pivotal event implies that k-1 jurors received guilt signals, which (via Bayes' Rule) makes it overwhelmingly likely that the defendant is actually guilty beyond a reasonable doubt even if the pivoting juror received an innocence signal. So a strategically rational juror with an innocence signal should vote to convict, effectively discarding her signal. The equilibrium under unanimity therefore involves jurors "over-correcting" for the possibility that they are wrong, and the probability of convicting an innocent defendant does not converge to zero as jury size grows. Under an f-majority rule, a juror's vote is pivotal in a much less extreme event (the remaining jurors are split f to 1-f rather than unanimously for conviction), so the rational correction is milder and the error probability does converge to zero with jury size. The unanimity rule's very stringency creates an incentive to discard innocence signals.

</details>

---

## 🔄 Apply It

**Scenario 1: The Academic Hiring Committee**
A university department uses a sequential elimination tournament to select among four finalists for a faculty position: candidates A, B, C, and D. The committee chair controls the agenda — the order in which pairs of candidates are compared by majority vote. Three committee subgroups have preferences that produce a Condorcet-cycle-like structure among the top three candidates, while candidate D is universally ranked last.

*What should you consider?*
- Does the structure of individual preferences produce any Condorcet cycles among A, B, and C?
- If so, which candidate wins depends entirely on who is paired against whom first — the chair can engineer the result.
- Since D is universally last, D cannot win regardless of agenda; agenda power is only meaningful over the cyclic subset.

<details>
<summary>Model Response</summary>

First, compute all pairwise majority results among A, B, and C. If they form a cycle (A beats B, B beats C, C beats A), then the committee chair who controls the agenda has full power to determine the winner from {A, B, C}: whichever candidate she wants to win should be held in reserve for the final round against the candidate that beats the one she wants to eliminate first. For example, to make A win: pair B and C first (B wins if B beats C), then pair B against A in the final (A wins if A beats B). Alternatively, pair A and C first if C is the one that beats A, ensuring A is eliminated early only when the chair wants a different outcome. Since D is always defeated by everyone, it never advances regardless of agenda. The practical lesson is that whoever sets the agenda in a majority-rule elimination process effectively selects the winner when Condorcet cycles exist, so the integrity of the process requires scrutiny of how the agenda was constructed and by whom.

</details>

---

**Scenario 2: The Film Festival Jury**
A film festival jury of seven critics must rank three films for prizes using the Borda Count. Five critics genuinely prefer Film A most, Film B second, and Film C last. Two critics prefer Film B most, Film C second, Film A last. The two minority critics know the Borda Count will be used and want Film B to win.

*What should you consider?*
- Compute the honest Borda Count outcome.
- Determine whether the two minority critics can misreport their rankings to change the outcome.
- Consider whether this constitutes a violation of IIA and what the broader institutional implication is.

<details>
<summary>Model Response</summary>

With honest reporting and three alternatives, Borda weights are 2 (first), 1 (second), 0 (last). Film A receives 2 points from each of five critics = 10, plus 0 from two critics = 10 total. Film B receives 1 point from each of five critics = 5, plus 2 from two critics = 9 total. Film C receives 0 from five critics = 0, plus 1 from two critics = 2 total. Honest result: A wins (10 > 9 > 2). The two minority critics can misreport their rankings as B > C > A (placing A last instead of C last). Now Film A receives 2 from five critics + 0 from two = 10. Film B receives 1 from five + 2 from two = 9. Film C receives 0 from five + 1 from two = 2. The outcome is unchanged in this case. However, if they report B > C > A AND a subset of the majority critics abstains or varies their ranking slightly, the dynamics shift. The deeper point: the Borda Count violates IIA because C's position in the ranking affects A vs. B, and the two minority critics could attempt to exploit this by elevating C artificially. This illustrates why the Borda Count is vulnerable to strategic misreporting, particularly for voters who understand how their ranking of the "irrelevant" alternative affects the competition between frontrunners.

</details>

---

**Scenario 3: The Corporate Board Vote**
A company's board of twelve directors must vote on whether to pursue a risky acquisition (R) or maintain the status quo (S). The board uses a two-thirds supermajority rule (eight votes) to approve the acquisition. Each director independently receives private information suggesting which option is better. Directors know the vote threshold and are aware that other directors may be reasoning strategically.

*What should you consider?*
- Under what pivotal condition does a single director's vote actually affect the outcome under a two-thirds supermajority?
- If a director receives a signal favoring S (status quo), should she condition on the pivotal event to decide how to vote?
- How does the f-majority rule compare to unanimity in terms of error rates?

<details>
<summary>Model Response</summary>

Under the two-thirds supermajority rule (f = 8/12), a director's vote to block the acquisition (vote for S) affects the outcome only when exactly seven other directors have voted for R and four for S — meaning her vote is the decisive eighth vote either way. Conditioning on this pivotal event: seven out of eleven other directors received R-signals, which is substantial evidence that R is better. A director with an S-signal must therefore ask whether seven R-signals from colleagues outweigh her one S-signal. Via Bayes' Rule, as the board size grows, the collective signals of the majority swamp any individual signal, so the director should often vote for R even on receiving an S-signal. However, because the supermajority threshold is less extreme than unanimity, the pivotal event is far less lopsided than in the unanimous case (seven R-signals vs. eleven R-signals), so the required "correction" is smaller. The chapter's result tells us that under f-majority rules with f < 1, the probability of an erroneous group decision converges to zero with group size, unlike under unanimity. The practical implication: institutional designers should prefer supermajority thresholds below unanimity if they want large groups to aggregate information well, while still providing protection against low-quality decisions from a simple majority.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when a group you belonged to — a team, committee, or family — reached a collective decision that felt wrong to you even though everyone's individual reasoning seemed sound. Now that you understand the Condorcet Paradox, could the voting or deliberation method itself have produced a cycle? What would you do differently in structuring how that group makes decisions?

2. Think of a time when you voted or advocated for something strategically — supporting a second-choice option to prevent your least-preferred outcome — rather than sincerely expressing your true first preference. What would you do differently now that you understand how insincere voting interacts with group information aggregation, and whether your strategic reasoning actually improved or worsened the collective outcome?

3. Think of an institution or rule — in your workplace, government, or community — that was designed with good intentions but may be inducing strategic behavior that undermines its original purpose (analogous to the unanimity rule increasing wrongful convictions). What concept from this chapter would you use to diagnose the problem, and what reform would you propose?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain Arrow's Impossibility Theorem in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

When a group needs to combine everyone's individual rankings of three or more options into a single group ranking, we would ideally want the result to respect unanimous agreement (if everyone prefers A to B, the group should too) and to be immune to irrelevant alternatives (adding a losing option C shouldn't change whether A or B wins). Arrow's Theorem proves mathematically that no voting system can satisfy both of these reasonable conditions simultaneously — the only system that does is a dictatorship, where one person's ranking simply becomes the group's ranking. This is not a statement that voting is hopeless, but rather that every democratic voting system must accept some form of pathological behavior, and the real question is which trade-offs a society is willing to make.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** In Chapter 16, you studied information cascades: situations where rational individuals, observing others' choices sequentially, discard their own private signals and follow the crowd, leading to fragile herds. Chapter 23 shows that when the same voting problem is moved from simultaneous to sequential, information cascades appear and the Condorcet Jury Theorem breaks down.

Consider a city council of nine members that must vote on whether to approve a development project. In Scenario A, all nine vote simultaneously. In Scenario B, they vote sequentially in a fixed order, and each member can observe how previous members voted before casting their own vote. In both scenarios, each member receives a private signal that is correct with probability q = 0.7, and the prior probability of the project being good is 0.5.

(a) In Scenario A (simultaneous, sincere voting), use the Condorcet Jury Theorem framework to estimate how likely the group is to reach the correct decision by majority rule. What is qualitatively different about the nine-person group versus a single individual?

(b) In Scenario B (sequential voting), describe how a cascade could form. At what point in the sequence would a cascade lock in, and once it does, does adding more voters improve accuracy? Why or why not?

(c) What does the comparison between these two scenarios reveal about the institutional design choice between secret-ballot simultaneous voting and open sequential roll-call voting?

**Chapters involved:** Chapter 23 (Voting, information aggregation, Condorcet Jury Theorem, sequential cascades) + Chapter 16 (Information Cascades)

---

## 📋 Action Items

1. Before your next committee meeting or group decision at work, write down — privately, before discussion begins — your own sincere ranking of the options on the table. After the decision is made, compare the outcome to what would have resulted under three different voting rules (simple majority of first choices, Borda Count, pairwise elimination). Notice whether the choice of voting rule would have changed the outcome, and bring this observation to the group as a five-minute agenda item the following week.

2. Find one real-world election or ranked-choice vote result from the past year (city council, professional society, awards show) and verify whether the winner also would have won every possible head-to-head pairwise comparison (the "Condorcet winner" test). Most results are publicly available with full ballot data. If the Condorcet winner differs from the reported winner, write a one-paragraph explanation of why, using the vocabulary of this chapter (IIA violation, positional voting, agenda effects).

3. Identify one decision-making rule in your organization where the rule was designed for one purpose but may be inducing strategic behavior that undermines that purpose — analogous to the unanimity jury rule. On Friday afternoon, spend twenty minutes drafting a one-page memo that names the rule, diagnoses the strategic distortion using the pivotal-vote reasoning from Section 23.8, proposes an alternative rule, and predicts what equilibrium behavior the new rule would induce.
