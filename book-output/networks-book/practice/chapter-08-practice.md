# Practice Exercises: Chapter 6 — Games

## 🧪 Comprehension Check

**Q1:** The Prisoner's Dilemma and the Exam-or-Presentation Game both end in outcomes that are worse for everyone than some alternative. But what specific structural feature of the payoff matrix causes this? Why can't the players simply agree to reach the better outcome?

<details>
<summary>Answer</summary>

The key structural feature is that each player has a strictly dominant strategy — a choice that is strictly better no matter what the other player does — and that dominant strategy leads to a mutually worse outcome. In the Exam-or-Presentation Game, studying for the exam yields a higher grade than preparing for the presentation regardless of the partner's choice (92 > 90 when partner prepares; 88 > 86 when partner studies). Even if both players verbally agree to prepare together for the 90/90 outcome, neither agreement is self-enforcing: each player has an individual incentive to defect and study, gaining 92 while the other gets 86. Without a binding commitment mechanism, rational individual optimization destroys the cooperative outcome.

</details>

---

**Q2:** Nash equilibrium is described not as a product of individual rationality alone, but as an "equilibrium in beliefs." What does this mean, and why is this distinction important?

<details>
<summary>Answer</summary>

A Nash equilibrium is a pair of strategies where each is a best response to the other. The "equilibrium in beliefs" framing means: if Player 1 believes Player 2 will play their Nash equilibrium strategy, then Player 1's best response is also to play the Nash equilibrium strategy — and vice versa. The beliefs are mutually self-confirming. This is important because Nash equilibrium cannot be derived purely from rationality: a rational player needs some reason to believe the opponent will play a particular strategy, and Nash equilibrium provides exactly that anchor. Any pair of strategies that are NOT mutual best responses cannot sustain consistent beliefs, because at least one player would prefer to deviate, undermining the prediction.

</details>

---

**Q3:** In a coordination game like the PowerPoint/Keynote example, there are two pure-strategy Nash equilibria. Why does the existence of multiple equilibria create a fundamental problem that the equilibrium concept itself cannot resolve — and what does Thomas Schelling's focal point theory offer as a partial answer?

<details>
<summary>Answer</summary>

When multiple Nash equilibria exist, the equilibrium concept alone cannot predict which one will be played, because each is self-consistent. Both (PowerPoint, PowerPoint) and (Keynote, Keynote) are stable: if you believe your partner uses one, you should use the same. The problem is that the two players need to coordinate their beliefs, but the game's mathematical structure gives no guidance on which equilibrium to settle on. Schelling's focal point theory argues that players use information outside the formal payoff matrix — social conventions, cultural norms, prominent features of the situation — to coordinate. In the UK, driving on the left is a focal point for the road game; a bookstore at the north end of the mall is a focal point for the meeting game. When one equilibrium has intrinsically higher payoffs for both players (as in the Unbalanced Coordination Game), that payoff advantage can itself become the focal point.

</details>

---

**Q4:** In the Run-Pass Game, passing is the offense's stronger option (gains 10 yards when undefended, vs. 5 for running), yet the mixed-strategy Nash equilibrium has the offense passing only 1/3 of the time. Explain precisely why the stronger strategy is used less frequently, and what the equilibrium probabilities are actually calibrated to achieve.

<details>
<summary>Answer</summary>

The equilibrium probabilities are not calibrated to how powerful each strategy is — they are calibrated to make the opponent indifferent between their two options. If the offense passed more than 1/3 of the time, the defense's best response would be to always defend against the pass, and the offense would actually do worse (expected payoff of 5/2 instead of 10/3). By committing to p = 1/3, the offense ensures the defense gets equal expected payoff from either defensive strategy (each yields -10/3), so the defense cannot exploit the offense by locking onto one choice. The deeper principle: in a zero-sum attack-defense game, a player's stronger weapon creates a larger threat precisely because the opponent must devote more defensive resources to neutralizing it — here, the defense commits to pass-defense 2/3 of the time even though the offense only passes 1/3 of the time. The threat of the powerful option does more work than its actual use.

</details>

---

**Q5:** What is the difference between Pareto-optimality and social optimality, and why does neither concept guarantee that rational play will achieve them? Give a concrete example from the chapter where Nash equilibrium, Pareto-optimality, and social optimality all diverge.

<details>
<summary>Answer</summary>

An outcome is Pareto-optimal if there is no alternative outcome in which every player does at least as well and at least one player does strictly better. An outcome is socially optimal if it maximizes the sum of all players' payoffs. Social optimality implies Pareto-optimality (if the sum is maximized, you cannot improve everyone simultaneously), but not vice versa — a Pareto-optimal outcome might allocate the total welfare very unevenly. In the Exam-or-Presentation Game, the unique Nash equilibrium (both study, payoffs 88/88) is the only outcome that is NOT Pareto-optimal: the three other outcomes are all Pareto-optimal. The social optimum is (both prepare, payoffs 90/90, sum = 180). But the Nash equilibrium produces a sum of 176, and it is the only outcome rational play can guarantee without binding agreements. Rational self-interest drives play away from both the social optimum and even Pareto-optimality.

</details>

---

## 🔄 Apply It

**Scenario 1: The Open-Source Contribution Dilemma**
Two software startups both rely on the same open-source library. Each must independently decide whether to invest engineering time in improving the library (Contribute) or to free-ride on any improvements the other makes (Free-Ride). If both contribute, both benefit significantly (payoff 8, 8). If one contributes and the other free-rides, the contributor gets 3 and the free-rider gets 10. If neither contributes, the library stagnates and both lose (payoff 2, 2).

*What should you consider?*
- Does either startup have a strictly dominant strategy? Check each cell of the payoff matrix systematically.
- Does this resemble the Prisoner's Dilemma, and if so, what is the structural feature that creates the dilemma?
- What changes to the payoffs — or to the game structure — could shift the outcome toward mutual contribution?

<details>
<summary>Model Response</summary>

This is a classic Prisoner's Dilemma structure. Free-Ride is a strictly dominant strategy for each firm: if the other contributes, free-riding yields 10 vs. 8; if the other free-rides, free-riding yields 2 vs. 3. So the Nash equilibrium is (Free-Ride, Free-Ride) with payoffs (2, 2), which is the only non-Pareto-optimal outcome and far worse than (Contribute, Contribute) at (8, 8).

The structural feature is that the individual incentive to defect is present regardless of the other party's choice — free-riding dominates contributing in every scenario. To shift the outcome, the game structure itself must change. Options include: converting a one-shot game into a repeated game (where reputation effects can sustain cooperation); creating a binding agreement or consortium structure; building reputational stakes into the payoffs so that being known as a free-rider damages future business relationships; or aligning incentives through licensing such that contributing firms capture more of the shared benefit. The key insight from Chapter 6 is that moralizing about the outcome does nothing — only structural changes to the payoffs or the game's time horizon can reliably produce cooperation.

</details>

---

**Scenario 2: The Pricing Standoff**
Two competing coffee chains — one dominant (60% market share when competing directly) and one weaker (40% market share) — must each decide whether to price their drinks at "premium" or "budget." If both go premium, they split the market at their respective shares. If both go budget, they split at their shares but with thinner margins. If they diverge, the budget-priced chain captures the entire budget segment and the premium-priced chain captures the entire premium segment. Market research shows 70% of customers prefer budget pricing and 30% prefer premium.

*What should you consider?*
- Does the dominant chain have a strictly dominant strategy? Work through what the dominant chain earns in each scenario.
- If the dominant chain has a dominant strategy, how should the weaker chain reason about what to do?
- Does this resemble the Marketing Strategy Game from Section 6.3, and what does that example predict about the outcome?

<details>
<summary>Model Response</summary>

This closely mirrors the Marketing Strategy Game (Figure 6.5). We can compute approximate payoffs: if both go budget, the dominant chain gets 0.60 x 0.70 = 0.42 and the weaker gets 0.40 x 0.70 = 0.28. If both go premium, the dominant chain gets 0.60 x 0.30 = 0.18 and the weaker gets 0.40 x 0.30 = 0.12. If they diverge, each captures their entire segment: budget chain gets 0.70, premium chain gets 0.30. So the dominant chain prefers Budget when the weaker chooses Budget (0.42 > 0.30) and also prefers Budget when the weaker chooses Premium (0.42 > 0.18, since they'd get 0.42 vs. 0.30 if the weaker goes Premium and they go Budget). Budget is strictly dominant for the dominant chain.

Knowing this, the weaker chain should reason that the dominant chain will go Budget. The weaker chain's best response to Budget is Premium (0.30 > 0.28). The predicted equilibrium is (Dominant=Budget, Weaker=Premium), mirroring the chapter's lesson: the stronger firm ignores the competitor and claims the larger segment; the weaker firm avoids head-to-head competition by differentiating. This reasoning works even though the firms act simultaneously, because the logic naturally sequences: dominant strategy first, then best response.

</details>

---

**Scenario 3: The Negotiation Impasse**
Two nations are negotiating a trade deal. Each can adopt either a "cooperative" stance (make real concessions) or a "hardline" stance (demand concessions while offering little). If both cooperate, both gain moderately (payoff 5, 5 from trade gains). If both go hardline, talks collapse and both gain nothing (0, 0). If one cooperates and one goes hardline, the hardline nation extracts most of the surplus (payoff 1, 8) and the cooperating nation gets very little. Neither nation knows in advance what the other will do.

*What should you consider?*
- Identify the Nash equilibria of this game. Does it resemble the Hawk-Dove game or a coordination game?
- What does the multiple-equilibrium structure imply about how the negotiation might unfold?
- What role could pre-game commitments (like public announcements) play, drawing on the Market Entry Game analysis from Section 6.10?

<details>
<summary>Model Response</summary>

This is a Hawk-Dove (Chicken) game structure. The Nash equilibria in pure strategies are (Cooperate, Hardline) and (Hardline, Cooperate) — the anti-coordination equilibria where one nation yields and the other exploits. There is no equilibrium where both cooperate (since either could gain by switching to hardline) and no equilibrium where both go hardline (since either could gain by switching to cooperate and getting at least 1 instead of 0).

The multiple-equilibrium structure means the theoretical framework predicts one of two outcomes but cannot say which — and whichever nation plays the passive role gets the worse deal. This creates enormous pressure for each side to credibly commit to hardline positions before formal talks begin. The Market Entry Game analysis is directly applicable: a nation that makes a credible public commitment to hardline before negotiations start is analogous to Firm 2 pre-committing to retaliate. If Firm 2's commitment is credible, Firm 1 (the entering nation) gets no benefit from trying to cooperate while the other goes hardline. Public announcements, domestic legislation constraining negotiators, or leaked "red lines" can all serve this commitment function. The danger is that if both sides succeed in making credible commitments to hardline, the payoff matrix flips to mutual loss — the analogy to two drivers in a game of Chicken who are both truly committed to not swerving.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you and a colleague or teammate both chose a safe or defensive option — each of you protecting your own position — and the project suffered as a result even though you both knew a bolder collective approach would have worked better. What would you do differently now that you understand how strictly dominant strategies can trap rational people in mutually bad outcomes?

2. Think of a recurring coordination problem in your work or personal life — a format, a platform, a meeting time, a communication channel — where multiple conventions would all work fine as long as everyone uses the same one. Now that you understand focal points, what structural or social mechanisms could you deliberately create to anchor everyone's expectations and reduce the coordination failure?

3. Think of a situation where you or your organization made a public commitment to a course of action — a deadline announced to customers, a policy stated publicly, a price guarantee advertised — that subsequently constrained your ability to respond flexibly. Now that you understand the Market Entry Game and the value of credible pre-commitment, how do you weigh the strategic benefit of constraining yourself in advance against the loss of flexibility when circumstances change?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain Nash equilibrium in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

A Nash equilibrium is a situation in a game where every player is making the best possible choice given what all the other players are doing — so no one has any reason to change their mind unilaterally. It is not necessarily the best outcome for everyone; it is simply a stable resting point where everyone's expectations about everyone else are correct and self-confirming. The Prisoner's Dilemma is the most famous example: both suspects confess not because confessing is good for them together, but because each one would regret switching to silence given that the other is confessing.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** Consider a social network modeled as a graph (from Chapters 2-3) where nodes are people and edges connect friends. Each person must independently decide whether to adopt a new communication app (Adopt) or stick with the old one (Stick). A person gets a payoff proportional to the number of their neighbors who also adopt (network effects). Model this as a coordination game: if k of your d neighbors adopt, your payoff from adopting is k and your payoff from sticking is d - k. For a person with 4 neighbors, 2 of whom have already adopted, what is their best response? Now consider a person at the center of a star graph with 10 spokes, where 6 spoke-nodes have adopted. How does their best response differ from a spoke-node with only 2 neighbors, 1 of whom has adopted? Finally, explain how the concept of Nash equilibrium predicts which nodes will adopt and which will not in a network where adoption spreads sequentially — and connect this to the idea of a "tipping point" in the graph structure.

**Chapters involved:** Chapter 6 (Games, Nash equilibrium, coordination games) + Chapters 2-3 (Graph theory, network structure, degree, centrality)

---

## 📋 Action Items

1. On Monday morning before checking email, draw a 2x2 payoff matrix for one real decision you are currently facing that involves another party — a vendor negotiation, a team resource allocation, a competitive product decision. Label the rows with your two main options, the columns with their two main options, and estimate numerical payoffs in each cell. Then check: does either party have a dominant strategy? If so, what is the predicted outcome, and does that outcome match what you want?

2. This week, identify one recurring coordination problem on your team — a tool, a process, a standard, a meeting format — where two or more conventions could all work but people are not aligned on which one to use. Explicitly designate a focal point by making a brief written proposal that names one convention as the default and gives a concrete reason why (it is more widely used, has higher payoffs for everyone, or is already the majority practice). Send it to the relevant people before Friday.

3. Before your next significant negotiation or competitive interaction, write down in one paragraph what commitment, if any, you could credibly make in advance — a public announcement, a written policy, a stated deadline — that would shift the game in your favor by constraining your future options. Then write a second paragraph assessing whether that commitment is actually credible (would others believe you would follow through?) and what the cost would be if circumstances change and you need to break it.
