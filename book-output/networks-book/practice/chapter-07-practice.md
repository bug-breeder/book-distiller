# Practice Exercises: Chapter 7 — Part II: Game Theory

## 🧪 Comprehension Check

**Q1:** What does it mean for a strategy to be a Nash equilibrium, and why is it considered a "stable" outcome even if it is not the best possible outcome for all players?

<details>
<summary>Answer</summary>

A Nash equilibrium is a combination of strategies — one per player — such that no individual player can improve their own payoff by unilaterally switching to a different strategy, given what all other players are doing. It is considered stable because no single player has an incentive to deviate on their own: each player is already playing a best response to everyone else. However, a Nash equilibrium can be socially suboptimal — as in the Prisoner's Dilemma — because individual rationality does not guarantee collective rationality. Players can be "trapped" in a mutually harmful outcome precisely because coordinated deviation would require trust that the equilibrium logic does not provide.

</details>

---

**Q2:** What is a dominant strategy, and how does its existence simplify the problem of predicting what rational players will do? What happens when no dominant strategy exists?

<details>
<summary>Answer</summary>

A dominant strategy is one that gives a player a higher payoff than any other strategy, regardless of what the other players do. When a dominant strategy exists, a rational player will always choose it, making prediction straightforward — you do not need to reason about what others will do. When no dominant strategy exists, prediction becomes harder: players must form beliefs about others' actions, and the solution concept shifts to Nash equilibrium, which requires mutual best-response reasoning. In complex games with multiple equilibria, predicting behavior may require additional assumptions about coordination, focal points, or communication.

</details>

---

**Q3:** The Prisoner's Dilemma is one of the most studied games in social science. Explain why both players defecting is the unique Nash equilibrium, even though both players would be better off if they both cooperated.

<details>
<summary>Answer</summary>

In the Prisoner's Dilemma, defecting is a dominant strategy for each player individually: no matter what the other player does, defecting yields a higher personal payoff than cooperating. Since both players face this same logic, both choose to defect, producing the (Defect, Defect) outcome as the unique Nash equilibrium. The tragedy is that (Cooperate, Cooperate) would make both players better off — it is Pareto superior — but it is not an equilibrium because each player has a unilateral incentive to defect if the other cooperates. The equilibrium arises from the absence of binding commitment: rational self-interest drives both parties to a collectively worse outcome.

</details>

---

**Q4:** What is the difference between a pure strategy Nash equilibrium and a mixed strategy Nash equilibrium? In what kinds of games does a mixed strategy equilibrium become necessary?

<details>
<summary>Answer</summary>

In a pure strategy Nash equilibrium, each player selects a single action with certainty. In a mixed strategy Nash equilibrium, players randomize over their available actions according to specific probabilities — and crucially, those probabilities are chosen so that the opponent is indifferent between their own options. Mixed strategy equilibria become necessary in zero-sum or strictly competitive games where no pure strategy equilibrium exists — such as matching pennies or rock-paper-scissors — because any deterministic choice can be exploited by the opponent. Nash's theorem guarantees that every finite game has at least one Nash equilibrium, which may be in mixed strategies.

</details>

---

**Q5:** How does the concept of Pareto optimality differ from Nash equilibrium, and why do these two concepts frequently fail to coincide in strategic settings?

<details>
<summary>Answer</summary>

A Pareto optimal outcome is one where it is impossible to make any player better off without making at least one player worse off — it is an efficiency criterion for the group. A Nash equilibrium is a stability criterion for individuals: no player wants to deviate given others' choices. These concepts diverge whenever individual incentives lead players away from collectively efficient outcomes. The Prisoner's Dilemma is the canonical example: the Nash equilibrium (both defect) is Pareto dominated by (both cooperate), yet players cannot reach cooperation through unilateral reasoning alone. This divergence is the central tension game theory illuminates: rational individual behavior can produce irrational collective outcomes.

</details>

---

## 🔄 Apply It

**Scenario 1: Competing Coffee Shops**
Two coffee shops open on the same street. Each must independently decide whether to price their lattes at $4 (premium) or $3 (discount). If both price at $4, each earns $500/day. If both price at $3, each earns $300/day. If one prices at $4 and the other at $3, the cheaper shop earns $700 and the premium shop earns $150.

*What should you consider?*
- What is each shop's best response to each of the other shop's possible choices?
- Is there a dominant strategy? Does this situation resemble any classic game structure?
- What would change if the two shop owners could communicate and make a binding agreement?

<details>
<summary>Model Response</summary>

This is a Prisoner's Dilemma structure. For each shop, pricing at $3 is a dominant strategy: if the rival charges $4, undercutting earns $700 instead of $500; if the rival charges $3, matching at $3 earns $300 instead of $150. Both shops reason identically, so the Nash equilibrium is (Discount, Discount) at $300 each — even though (Premium, Premium) would earn $500 each. The equilibrium is Pareto dominated by the cooperative outcome. Without a binding commitment mechanism — such as a legally enforceable cartel agreement or repeated interaction that allows punishment of defectors — rational shops end up in a price war that harms them both. The lesson is that in competitive markets, individual rational pricing decisions can erode industry-wide profitability.

</details>

---

**Scenario 2: Software Platform Standards**
Two technology companies are each independently choosing which wireless protocol to build into their new devices: Protocol A or Protocol B. Devices only communicate with devices running the same protocol. If both choose A, both earn large network-effect gains. If both choose B, both also earn large gains (though slightly less). If they choose different protocols, neither earns network-effect gains and both lose money relative to going it alone.

*What should you consider?*
- How many Nash equilibria does this game have, and what type of game structure does it represent?
- What role does coordination play, and why might prior history or market signals matter?
- How does the size of the network effect influence which equilibrium is more likely to prevail?

<details>
<summary>Model Response</summary>

This is a coordination game, not a Prisoner's Dilemma. There are two pure strategy Nash equilibria: (A, A) and (B, B). In both equilibria, neither player wants to deviate unilaterally because switching protocols when the other stays put destroys value for both. There is also a mixed strategy equilibrium, but it is unstable. Because both equilibria are stable, the outcome depends heavily on coordination mechanisms: prior history (which protocol was used last time), market signals, public statements by industry leaders, or the presence of a dominant early adopter can all serve as focal points that guide both firms to the same choice. The stronger the network effects, the higher the cost of miscoordination, which intensifies the pressure to coordinate — but does not on its own resolve which equilibrium gets selected.

</details>

---

**Scenario 3: Salary Negotiation**
You are negotiating a salary with a prospective employer. You can either name a high figure first (anchoring high) or wait for the employer to make an offer. The employer can either offer generously or offer conservatively. If you anchor high and they offer generously, you get a great outcome; if you anchor high and they offer conservatively, you risk deadlock. If you wait and they offer generously, you do well; if you wait and they offer conservatively, you end up underpaid.

*What should you consider?*
- What information asymmetries exist, and how do they affect the strategic calculation?
- Is there a dominant strategy for you, or does the best move depend on beliefs about the employer's type?
- How does game theory's prediction change if you will negotiate with this employer repeatedly over future raises?

<details>
<summary>Model Response</summary>

This negotiation is a game of incomplete information: you do not know whether the employer is a generous or conservative type, and they do not know your true reservation wage. Without a dominant strategy, your best move depends on your beliefs about the employer's type — if you believe they are likely to be generous, anchoring high is lower risk; if conservative, anchoring high risks deadlock and you may prefer to elicit their offer first. Game theory also predicts that repeated interaction fundamentally changes incentives: in a one-shot game, both sides may defect toward aggressive tactics, but in a repeated relationship (annual reviews, future projects), both parties benefit from establishing a cooperative reputation. Strategies like conditional cooperation — being firm but fair — can sustain better outcomes over time than pure hardball in a single round.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you and another person or group each made individually rational choices that led to a collectively bad outcome — a failed shared project, a price war, an arms race of effort. Now that you understand the Prisoner's Dilemma and Nash equilibrium, can you identify what the "defect" move was for each side, and what structural change (binding commitment, repeated interaction, shared enforcement) might have produced a better result?

2. Think of a situation in your professional or personal life where two or more parties needed to coordinate on a standard, a meeting time, a norm, or a process, but had no obvious way to agree — a coordination game without a clear focal point. What cues, precedents, or signals ultimately resolved the coordination problem, and how does the game-theoretic concept of focal points explain why those particular cues worked?

3. Think of a negotiation you have been in — salary, a contract, a household decision — where you suspected the other side was making strategic choices based on what they believed you would do. How did that awareness change your behavior? Now that you understand mixed strategies and the idea of being "unpredictable" as a rational tactic, would you approach that negotiation differently?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain Nash equilibrium in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

A Nash equilibrium is a situation in a game where every player is making the best choice they can, given what everyone else is doing. The key is that no single player can do better by changing only their own behavior — switching would make things worse or no better for them alone. It is called an equilibrium because once everyone is in this state, no one has a reason to move, even if the outcome is not the best possible result for the group as a whole.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** Consider a social network (from Part I) in which each node represents a person and edges represent friendships. Each person must independently decide whether to adopt a new communication app (Adopt) or stick with the old one (Stay). The app is only useful if enough of your friends also use it — specifically, you benefit from adopting only if at least half your friends also adopt. Model this as a game: each node is a player, each player's strategy is binary (Adopt or Stay), and each player's payoff depends on the fraction of their neighbors who adopt. Identify all pure strategy Nash equilibria of this game on a small example network (say, a triangle and a path graph of 4 nodes). Then explain how the network structure — specifically, which nodes are hubs versus which are peripheral — affects which equilibria are reachable and how contagion of adoption spreads.

**Chapters involved:** Chapter 7 (Game Theory — Nash Equilibrium, Best Responses) + Chapter 2 (Graph Theory — Network Structure, Hubs, Connected Components)

---

## 📋 Action Items

1. On Monday morning before checking email, write down one recurring conflict or competition you are currently in — at work, at home, or in a negotiation. Draw the payoff matrix: list the two or three strategies available to each side and estimate the outcomes. Identify whether any dominant strategies exist and what the Nash equilibrium is. This five-minute exercise will make abstract game theory concrete and personally relevant.

2. This week, before your next meeting that involves any group decision or resource allocation, spend two minutes asking: "What is each person's individual incentive here, and does it align with the group's best outcome?" Explicitly look for Prisoner's Dilemma structures — situations where individual rational choices might lead the group somewhere nobody wants to go — and note whether any commitment device (a public statement, a written agreement, a shared metric) could resolve the tension.

3. Find one real-world auction, pricing situation, or competitive bid you encounter this week — a freelance proposal, a job offer, a vendor quote — and analyze it as a game: Who are the players? What are their strategies? Is the best response to anchor first or let the other side move first? Write two sentences summarizing your strategic reasoning before you act, rather than relying on gut instinct alone.
