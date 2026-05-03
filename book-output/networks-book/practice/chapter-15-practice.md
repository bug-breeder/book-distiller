# Practice Exercises: Chapter 12 — Bargaining and Power in Networks

## 🧪 Comprehension Check

**Q1:** In the 3-node path (A–B–C), node B achieves roughly 5/6 of the money in exchange experiments, yet when the experiment is modified so that B can participate in *two* exchanges per round rather than one, B gets only about half from each. Why does relaxing the 1-exchange rule so dramatically reduce B's power, and what does this tell us about which of the four principles (dependence, exclusion, satiation, betweenness) actually drives power in exchange networks?

<details>
<summary>Answer</summary>

Under the 1-exchange rule, B's power rests on exclusion: B can choose one of A or C and leave the other out entirely. The excluded node, desperate to get back in next round, drives down its asking price, giving B overwhelming leverage. When B is allowed two exchanges, no one can be excluded — B needs both A and C — so the dependence relationship becomes symmetric and power equalizes. This reveals that exclusion (not betweenness or satiation) is the dominant mechanism: power flows from the credible threat of leaving a neighbor with nothing, not merely from being a connector in the network.

</details>

---

**Q2:** The 5-node path (A–B–C–D–E) produces a counterintuitive result: node C, which occupies the geometrically central position, is actually weak under the 1-exchange rule, while B and D are strong. Explain the logic behind this finding and why it shows that betweenness centrality can be a misleading measure of power.

<details>
<summary>Answer</summary>

C is weak because its only neighbors are B and D, and each of those neighbors has an attractive alternative: B can turn to A, and D can turn to E. So C can be excluded almost as easily as A or E can. Betweenness centrality captures the idea that a node lying on many paths controls information flow, which is powerful in contexts like brokerage or rumor spread. But in exchange networks under the 1-exchange rule, power comes from having neighbors who have no good alternatives — from being someone's only option. Since B and D are not desperate for C, C has no leverage. The stable outcomes confirm this: the only stable outcomes give values of 1 to B and D, the off-center nodes, not to C.

</details>

---

**Q3:** The Nash bargaining solution predicts that when A has outside option x and B has outside option y (with x + y ≤ 1), they split the surplus s = 1 − x − y evenly, so A gets (x + 1 − y)/2 and B gets (y + 1 − x)/2. Explain in plain terms why the surplus is split evenly rather than, say, proportionally to each party's outside option, and what the formula says about the strategic importance of improving your outside option before negotiations begin.

<details>
<summary>Answer</summary>

The outside options set the floor — the minimum each party will accept — and anything above that floor is genuinely contested surplus that neither party has a stronger claim to than the other. Equal bargaining power means neither party can extract more than half of what remains after both floors are guaranteed, so the surplus is split 50-50. The critical strategic implication is that every unit you add to your outside option translates directly into an extra half-unit of final payoff: raising x by 0.1 shifts (x + 1 − y)/2 up by 0.05 and shifts B's payoff down by 0.05. So strengthening your best alternative away from the table — before you sit down — is one of the highest-leverage moves available in any negotiation.

</details>

---

**Q4:** The chapter defines a *stable* outcome and a *balanced* outcome, treating balance as a refinement of stability. Explain why stability alone is too weak a concept to uniquely predict outcomes on the 4-node path, and how the concept of balance resolves the ambiguity by bringing the Nash bargaining solution inside the network itself.

<details>
<summary>Answer</summary>

On the 4-node path (A–B–C–D) with the matching consisting of the two outer edges (A–B and C–D), any division of value in which B and C together collect at least 1 is stable, because the B–C edge (which is unused) cannot create an instability if B and C together already hold enough. This leaves an enormous range of stable outcomes, including the clearly "wrong" one where B and C each get 1/2 despite their power advantage. Balance eliminates this ambiguity by requiring that each matched pair's split be the Nash bargaining outcome given the outside options provided by the rest of the network. Each node's outside option is endogenously determined by what it could offer a neighbor to steal that neighbor away from their current partner. This self-referential consistency pins down a unique (or small set of) balanced outcome(s) — on the 4-node path, the balanced outcome gives B and C each 2/3 and A and D each 1/3 — matching experimental results closely.

</details>

---

**Q5:** In the advanced game-theoretic derivation of the Nash bargaining solution, two players alternate making offers indefinitely, with a fixed per-round breakdown probability p. The stationary equilibrium payoffs converge to the Nash bargaining solution as p approaches 0. Why does a very small breakdown probability produce the Nash outcome rather than giving all power to A (who moves first), and what does this reveal about the relationship between time pressure and bargaining leverage?

<details>
<summary>Answer</summary>

When p is large, A's first offer is probably the only one that will ever be made, so A can exploit the "last-mover" advantage of being the only proposer and offer B almost nothing. But as p shrinks toward 0, both players anticipate that if the first offer is rejected the game will almost certainly continue to B's turn, at which point B holds the same structural advantage. Knowing this, A cannot afford to lowball B — B will rationally reject anything much below what B expects to get in the second round. The two players' expected payoffs from rejection converge to symmetric functions of their outside options, and the equilibrium offer must match those expectations, which is exactly the Nash bargaining formula. The lesson is that time pressure (impatience or high breakdown risk) transfers power to the first mover, while patience — the ability to wait credibly — equalizes power and leads to the symmetric split of surplus.

</details>

---

## 🔄 Apply It

**Scenario 1: The Sole Distributor**
You are a small craft brewery that sells exclusively through a single regional distributor. The distributor also carries three other local breweries and a large national brand. You are about to renegotiate your distribution contract, and the distributor has made it clear they could replace you with another craft producer. You want a larger share of the retail margin.

*What should you consider?*
- Map the exchange network: who are the nodes, what are the edges, and who has alternative partners? Does the distributor need you as much as you need them?
- What is your current "outside option" — do you have any other distribution channels or relationships you could credibly threaten to use? How does improving that option before the negotiation begins affect the Nash bargaining formula?
- Is this a strong-power or weak-power situation for you? What would a stable or balanced outcome look like, and does your current contract reflect it?

<details>
<summary>Model Response</summary>

The network structure puts you in a weak position analogous to node A on a 3-node path: the distributor (node B) has multiple alternatives (the other breweries) while you have essentially one distribution channel. Under the 1-exchange rule logic, the distributor can threaten exclusion — dropping you in favor of another producer — and that threat is credible and low-cost to execute. Your dependence is total; theirs is partial. The Nash bargaining solution predicts you will get your outside option x plus half the remaining surplus, but if x is close to 0 (no realistic alternative), you collect little above subsistence. The most valuable strategic move before negotiating is to build a genuine outside option: open a taproom that generates direct-to-consumer revenue, establish a relationship with a competing distributor in an adjacent market, or cultivate a direct wholesale account with a large retailer. Each of these raises x concretely and shifts the Nash bargaining outcome in your favor. You should also assess whether this is a "weak power" situation (like the 4-node path, where the distributor's threat to exclude you is costly to execute because they would lose your volume) or a "strong power" situation (3-node path, where replacement is trivially easy). If the distributor's alternatives are genuinely less attractive, you have more leverage than the raw network topology suggests, and a balanced-outcome analysis — where each party's outside option is endogenously determined by the network — might reveal a fairer split than what is currently on the table.

</details>

---

**Scenario 2: The Consulting Middleman**
You are a freelance consultant who has built a relationship between a mid-sized tech firm (your primary client) and a specialized data vendor. The firm does not know how to approach the vendor directly, and the vendor rarely works with clients below enterprise scale. You are currently the sole connector. A colleague suggests you could expand your business by bringing in a second tech-firm client who also needs this vendor's data.

*What should you consider?*
- How does adding a second client change your structural position relative to the vendor, and does it strengthen or weaken your bargaining position with the vendor?
- Consider what happens to the stability of your current arrangements if the vendor discovers your role as middleman and decides to approach your clients directly.
- What is the difference between your betweenness centrality in this network and your actual exchange power, and could the two diverge?

<details>
<summary>Model Response</summary>

Adding a second client increases your betweenness — you now sit on paths connecting more pairs of nodes — but the chapter's central lesson is that betweenness does not reliably predict exchange power. What matters is whether your neighbors have attractive alternatives. If the vendor can approach your clients directly once aware of them (especially after you've made the introduction), then your structural hole closes and your power evaporates. This is analogous to the 5-node path: you look central but your neighbors may not need you as their exclusive route. Your real exchange power depends on maintaining genuine exclusion — ensuring that the vendor cannot or will not serve your clients without you, perhaps because you provide integration, translation, or contract management that the vendor lacks internally. Adding the second client strengthens your position with the vendor (you now control access to more revenue for them), but only if you also maintain the structural barriers that prevent direct relationships from forming. You should also think about network stability: if both clients know about each other and both know about the vendor, the triangle dynamic (Figure 12.4) could emerge — an unstable network where each party tries to cut you out and negotiations never settle. Keeping information asymmetric across your clients and the vendor is therefore not just a business tactic but a structural necessity for maintaining a stable, powerful position.

</details>

---

**Scenario 3: The Job Offer**
You have received a job offer from Company X at a salary of $120,000. You are currently employed at Company Y earning $95,000. You genuinely prefer Company X's work, but you would also be willing to stay at Y if they matched the offer. You go to your manager at Y to discuss. Unbeknownst to you, Y has been quietly interviewing two other candidates for your role.

*What should you consider?*
- Apply the Nash bargaining framework: what are your outside option and Y's outside option? What does the formula predict for the negotiated salary, and is that prediction likely to hold given the Ultimatum Game findings?
- How does Y's undisclosed alternative (the other candidates) affect the balanced outcome of this negotiation even if you never learn about it?
- What actions could you take before the conversation to improve your negotiated outcome, and what human behavioral factors (fairness norms, status effects) might cause the actual outcome to deviate from the theoretical prediction?

<details>
<summary>Model Response</summary>

In Nash bargaining terms, your outside option is $120,000 (Company X's offer) and Y's outside option is whatever it would cost them to replace you — let's say the best other candidate they could hire at $100,000. The surplus to be split is 1 − x − y in normalized terms; here it is the gap between what you'd accept ($120,000) and what Y would otherwise pay ($100,000), which is $20,000. The Nash bargaining solution predicts you split this surplus evenly, landing at $110,000. But Y's undisclosed alternatives matter enormously: if Y has a candidate available at $115,000 (close to your outside option), Y's cost of losing you drops, their outside option rises, and the predicted outcome shifts toward your outside option — they might simply let you go. This is exactly the balanced-outcome logic: each party's outside option is endogenously set by the rest of the network. The Ultimatum Game findings add another layer: if Y makes you an offer you perceive as insulting — say, $97,000 when you have a $120,000 offer in hand — you may reject it even at financial cost, because the fairness payoff of rejecting a lowball offer outweighs the monetary gain. Y's managers likely know this, which is why reasonable managers offer more than the minimum necessary. Strategically, you can improve your position by getting a written offer from X (making your outside option concrete and verifiable), and by researching what comparable candidates cost Y (to understand their outside option). Revealing the X offer early and credibly shifts the negotiation anchor toward $120,000 as a reference point, which status-effects research suggests will benefit you — people treated as high-status receive better negotiated terms even when formal outside options are identical.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you were in a negotiation — for a salary, a contract, a shared resource — where you felt you had little power. Looking back, what was the network structure around you, and who held the position of the "B node" with multiple alternatives? What would you do differently now that you understand how dependence and exclusion shape the division of value, and how your outside options before the negotiation began determined your floor?

2. Think of a professional relationship — a partnership, a collaboration, a client account — where you occupy a connecting role between two parties who do not know each other well. Now that you understand the concepts of structural holes, stable outcomes, and the instability of triangle networks, how would you evaluate whether your position is genuinely powerful or fragile? What steps would you take this week to either solidify your structural advantage or diversify your own connections to reduce your vulnerability?

3. Think of a time when you made or received an offer in a negotiation that felt unfair — either you rejected a deal that was technically in your financial interest, or someone rejected your offer that seemed reasonable to you. How does the Ultimatum Game research reframe what happened? If you had understood then that the other party's payoff function included a significant emotional component for fairness, how would you have structured the offer or the conversation differently?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the concept of a *balanced outcome* in network exchange to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

A balanced outcome is a way of dividing value in a network where every pair of people who are trading together is splitting their money exactly as fairly as their alternatives outside the current deal would predict. Each person's "outside option" — the best deal they could grab by poaching a neighbor away from someone else — is calculated from the actual values everyone else is getting, so the whole system is self-consistent: the outside options determine the splits, and the splits determine the outside options. It is like a social contract that no pair of people has any motivation to renegotiate, because each deal already reflects the full bargaining strength that each person's position in the network provides them.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a bipartite buyer-seller network (from Chapter 10) in which two sellers S1 and S2 each hold one unit of a good valued at 1 by each of three buyers B1, B2, and B3. S1 is connected to B1 and B2; S2 is connected to B2 and B3. B2 is therefore the only buyer connected to both sellers.

(a) First use Chapter 10's matching market logic to identify which matchings are possible and what the competitive equilibrium price range looks like.

(b) Then apply Chapter 12's exchange network framework: translate this buyer-seller network into an exchange network, identify each node's outside option endogenously (as in the balanced outcome definition), and compute the balanced outcome prices.

(c) Compare the two answers. Does the balanced outcome price for B2 — the doubly-connected buyer — reflect more or less buyer-side power than the Chapter 10 equilibrium price range suggests? What does the discrepancy (or agreement) reveal about the relationship between competitive market models and network bargaining models?

**Chapters involved:** Chapter 12 + Chapter 10

---

## 📋 Action Items

1. Before your next negotiation — even a small one, like a vendor contract or a freelance rate — spend 30 minutes on Monday morning mapping the network on paper: draw every relevant node (you, the other party, their alternatives, your alternatives) and every edge. Then explicitly write down your outside option value x and their outside option value y, and compute the Nash bargaining prediction (x + 1 − y)/2 for your share. Compare the prediction to your intuitive anchor going into the conversation.

2. This week, identify one relationship in your professional life where you are structurally dependent — you have only one customer, one employer, one supplier, or one distribution channel. By Friday, take one concrete step to create or strengthen a genuine alternative: send an inquiry to a competing vendor, apply to one other position, or make an introductory call to a potential second client. The goal is not to abandon the current relationship but to raise your outside option so that the next negotiation reflects a more balanced outcome.

3. The next time you observe a negotiation or deal-making conversation — in a meeting, in the news, or in a case study — pause and ask: is this a strong-power situation (one party can exclude the other at low cost, like the 3-node path) or a weak-power situation (exclusion is costly, like the 4-node path)? Write down your assessment and what the balanced outcome theory would predict. Then follow up to see what actually happened, and note whether the Ultimatum Game's fairness correction explains any deviation from the theoretical extreme.
