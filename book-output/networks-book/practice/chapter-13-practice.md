# Practice Exercises: Chapter 10 — Matching Markets

## 🧪 Comprehension Check

**Q1:** The Matching Theorem states that a bipartite graph with no perfect matching must contain a constricted set. What exactly is a constricted set, and why does its existence logically prevent a perfect matching from existing?

<details>
<summary>Answer</summary>

A constricted set S is a group of nodes on one side of a bipartite graph whose collective neighbor set N(S) — all the nodes on the other side connected to any node in S — is strictly smaller than S itself. In other words, S has more members than the other side has options to accommodate them. This directly prevents a perfect matching because each node in S must be matched to a distinct node in N(S), but there are not enough nodes in N(S) to go around — at least one member of S must go unmatched regardless of how the assignment is arranged. The theorem's deeper contribution is establishing that this is the *only* structural reason a perfect matching can fail to exist, not merely one of many possible reasons.

</details>

**Q2:** What is the difference between an "optimal assignment" and a "market-clearing" set of prices, and how are they related to each other?

<details>
<summary>Answer</summary>

An optimal assignment is a matching of buyers to sellers that maximizes the total valuation across all buyers — the sum of each person's numerical satisfaction score for what they receive. Market-clearing prices are a set of prices such that when every buyer selfishly picks the seller that maximizes her own payoff (valuation minus price), the resulting preferred-seller graph contains a perfect matching. The deep relationship is that market-clearing prices always produce an optimal assignment: because each buyer grabs what is best for her, the total payoff is maximized, and since the sum of all prices is a constant that cancels out symmetrically, maximizing total payoff is equivalent to maximizing total valuation. Prices thus serve as a decentralized mechanism that replicates what a central administrator would compute directly.

</details>

**Q3:** Why does the bipartite graph auction procedure (starting all prices at zero and raising over-demanded sellers' prices by one unit per round) necessarily come to an end in a finite number of steps?

<details>
<summary>Answer</summary>

The proof uses a "potential energy" argument. Define the potential of a buyer as the maximum payoff she can get from any seller at current prices, and the potential of a seller as his current price. The auction's total potential energy is the sum of all these potentials. At the start it equals some finite value P₀. In every round where prices change, the sellers in the constricted neighbor set N(S) each raise their price by one, increasing each seller's potential by one; but every buyer in the constricted set S loses one unit of maximum payoff, and since S is strictly larger than N(S), the total energy decreases by at least one unit per round. Because energy starts finite and can never drop below zero (prices are always non-negative and each buyer always has a preferred seller due to the price-reduction normalization), the auction must terminate within P₀ rounds, at which point the prices are market-clearing.

</details>

**Q4:** The chapter shows that the single-item ascending-bid (English) auction is a special case of the bipartite graph auction. What structural trick makes this reduction work, and what does the bipartite graph auction's outcome tell us about the price at which the item sells?

<details>
<summary>Answer</summary>

To reduce a single-item auction with n buyers to the bipartite graph framework (which requires equal numbers of buyers and sellers), one creates n-1 "fake" additional seller nodes representing different ways of not acquiring the real item, and gives every buyer a valuation of 0 for these fake sellers. The one real seller gets the true valuation vⱼ from each buyer j. Now the bipartite graph auction runs on this expanded market. Initially all buyers point to the real seller as their preferred seller, forming a constricted set, so the real seller raises his price by one unit each round. This continues until the buyer with the second-highest valuation finds a fake seller equally attractive — at that moment the real seller stops being "over-demanded," the preferred-seller graph has a perfect matching, and the auction ends. The buyer with the highest valuation wins the item at a price equal to the second-highest valuation, exactly replicating the English auction outcome.

</details>

**Q5:** What is an augmenting path in the context of bipartite matching, and how does alternating BFS use the failure to find one as a constructive proof that a constricted set exists?

<details>
<summary>Answer</summary>

An augmenting path is a simple path in a bipartite graph that alternates between non-matching and matching edges, and whose two endpoints are both unmatched nodes. When such a path exists, swapping which edges are in the matching versus out of it along the entire path enlarges the matching by one pair without disturbing any previously matched nodes. Alternating BFS searches for such a path from an unmatched node W on the right, building layers that alternate between following non-matching edges (left to right) and matching edges (right to left). If the search terminates without reaching any unmatched node on the left, the structure of the resulting layers directly reveals a constricted set: the nodes in all even-numbered layers form a set S on the right-hand side, and all their neighbors in the graph are contained among the odd-numbered layers, which have strictly fewer nodes than the even layers do. Thus the failure of the search is not just a dead end — it is constructive evidence of why no perfect matching can exist.

</details>

---

## 🔄 Apply It

**Scenario 1: Allocating Conference Rooms to Research Teams**
A university has four research teams (A, B, C, D) and four conference rooms (R1, R2, R3, R4) to assign for the semester. Each team has submitted a ranked list of acceptable rooms based on size, equipment, and location. Teams A, B, and C have collectively listed only rooms R1 and R2 as acceptable. Team D listed R3 and R4.

*What should you consider?*
- Does a constricted set exist here, and what does that tell you about the feasibility of the assignment?
- If no perfect matching exists, what is the minimum structural change (adding one edge) that would resolve the constriction?
- How would you explain the failure to the teams using the language of constricted sets rather than just saying "it didn't work out"?

<details>
<summary>Model Response</summary>

Teams A, B, and C collectively form a constricted set S of size 3 whose neighbor set N(S) contains only R1 and R2 — a set of size 2. Since |S| = 3 > 2 = |N(S)|, no perfect matching exists. The Matching Theorem guarantees this is the precise and complete reason: you can stop searching for alternative arrangements because none exist. To the teams, you would explain that three groups have collectively narrowed their acceptable options to two rooms, making it mathematically impossible to satisfy everyone. The minimum fix is to persuade at least one of A, B, or C to accept R3 or R4 as an additional option, which would dissolve the constriction. If team B, for example, adds R3 to its acceptable list, the constricted set disappears and a perfect matching becomes possible (A→R1, B→R3, C→R2, D→R4 or similar).

</details>

**Scenario 2: Setting Prices for a Co-Working Space**
A co-working space operator has three desk bundles (a premium window desk, a mid-tier interior desk, and a basic shared bench) and three monthly subscribers (x, y, z) with different valuations for each option. The operator wants to set monthly prices that are "market-clearing" — meaning each subscriber, acting in self-interest, will end up wanting a different desk.

*What should you consider?*
- How do you compute each buyer's payoff (v_ij - p_i) for a given set of trial prices, and how do you draw the preferred-seller graph?
- What does it mean for that graph to have a perfect matching, and why is that the goal?
- If the trial prices create a constricted set of buyers all preferring the same desk, which price should you raise and by how much, according to the auction procedure?

<details>
<summary>Model Response</summary>

For each subscriber j and each desk i, compute the payoff v_ij - p_i. Each subscriber draws an edge to whichever desk(s) give her the maximum payoff (provided that payoff is non-negative). The resulting preferred-seller graph is market-clearing if it contains a perfect matching — meaning each subscriber ends up pointing to a different desk, so self-interest alone resolves the contention without any central directive. If instead all three subscribers prefer the window desk (say, because its price is too low), they form a constricted set S = {x, y, z} with N(S) = {window desk}, and the auction procedure directs that the window desk's price should rise by one unit. This continues round by round — applying price reductions to keep the minimum price anchored at zero — until the preferred-seller graph acquires a perfect matching. The final prices are market-clearing and, by the optimality theorem, the resulting assignment maximizes total subscriber welfare.

</details>

**Scenario 3: Matching Medical Residents to Hospital Departments**
A hospital is assigning five new residents to five specialty departments. Residents submit valuations (from 1 to 10) expressing how much they want each posting. The administration wants an assignment that maximizes the total welfare — the sum of all residents' valuations for what they receive — without any central negotiation.

*What should you consider?*
- Why is the optimal assignment problem the right framework here rather than simply giving everyone their top choice?
- How do market-clearing prices (expressed as abstract "priority points" rather than money) lead to the optimal assignment even when residents act purely selfishly?
- What is the difference between the assignment that maximizes total welfare and one that maximizes the minimum welfare (baseline-maximizing), and when might the hospital prefer one over the other?

<details>
<summary>Model Response</summary>

Simply giving everyone their top choice fails whenever two or more residents rank the same department first — a common occurrence. The optimal assignment framework instead finds the matching that maximizes the total sum of valuations across all residents, which may require some residents to accept their second choice so that the overall outcome is better. Market-clearing priority points work as follows: assign all departments a "cost" of zero, let residents act as if they are buying the department that maximizes their net value (valuation minus cost). If any department is over-demanded, run the auction procedure to raise its cost until the preferred-department graph has a perfect matching. The result is provably optimal in total welfare. The tension with baseline-maximizing arises when the welfare-maximizing assignment leaves one resident with a very low valuation for their assigned department — an outcome that may be seen as unfair even if it is efficient in aggregate. A hospital that values equity (no resident should feel severely mismatched) might prefer the baseline-maximizing assignment, accepting a lower total welfare score to guarantee that the worst-off resident is as satisfied as possible. These two objectives can require genuinely different matchings, as the chapter's exercise on this topic demonstrates.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you were part of a group competing for the same scarce resource — a job opening, a housing assignment, a school admission slot, or a project team spot. Looking back, was there an implicit "constricted set" dynamic at play, where a subgroup of people collectively had too few acceptable options? What would a fairer or more efficient process have looked like if prices or priority points had been used to resolve the contention?

2. Think of a marketplace or platform you use regularly — a ridesharing app, an apartment rental site, a freelance job board — where buyers and sellers are matched automatically. Now that you understand market-clearing prices and the preferred-seller graph, what signals in that platform's pricing behavior do you recognize as mechanisms for resolving over-demand? What would you do differently as a buyer or seller knowing that prices are being dynamically adjusted to clear the market?

3. Think of a time when you were involved in allocating something valuable among a group — splitting tasks on a team, dividing household chores, assigning shifts at work — and the process felt either unfair or inefficient. What would you do differently now that you understand the distinction between an optimal assignment (maximizing total welfare) and a baseline-maximizing assignment (protecting the worst-off participant)? Which objective would you advocate for, and why?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain market-clearing prices in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

Imagine several houses for sale and several buyers, each of whom values each house differently — market-clearing prices are a set of asking prices such that when every buyer simply picks the house that gives her the best deal (value minus price), each buyer ends up wanting a different house with no fights over the same property. What makes this remarkable is that prices alone — with no coordinator and no negotiation — sort out all the competition, as if an invisible hand steered everyone apart. Even more remarkably, such prices always exist for any pattern of buyer preferences, and the assignment they produce is the one that makes the total happiness across all buyers as large as possible.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a social network of five people (nodes) with friendships (edges) as studied in earlier chapters on graph structure. Now suppose a company wants to run a targeted advertising campaign: it has five different product offers (A, B, C, D, E) and wants to match each person to exactly one offer. Each person has a numerical valuation for each offer based on their profile. However, there is an additional constraint: two people who are directly connected as friends in the social network cannot be matched to offers that are adjacent in the product catalog (offers are arranged in a sequence, so A and B are adjacent, B and C are adjacent, etc.). Model this as a bipartite matching problem with the friendship-network constraint layered on top. First, draw the bipartite graph showing only the edges allowed by the friendship constraint. Then determine whether a perfect matching exists using the constricted-set criterion. If no perfect matching exists, identify the constricted set and explain in plain language what the friendship structure is doing to block the assignment.

**Chapters involved:** Chapter 10 (Matching Markets — bipartite graphs, perfect matchings, constricted sets) + Chapter 2 (Graph Theory — network structure, node neighborhoods, connectivity)

---

## 📋 Action Items

1. On Tuesday morning before checking email, draw a bipartite graph for a real matching problem in your life — such as assigning three tasks to three team members based on skill fit — write numerical "valuations" (1–10 scores) for each person-task pair, and manually compute which assignment maximizes the total score. Then check: does any subgroup of people collectively have too few acceptable tasks? If so, you have found a constricted set in your own workplace.

2. Before your next negotiation over a shared resource (a meeting room booking, a project assignment, a vendor contract), compute the payoff each party receives under the proposed allocation and under two alternative allocations. Identify whether the current proposal is the welfare-maximizing one, and come prepared to argue for or against it using the language of total valuation rather than individual preference.

3. Pick any two-sided platform you use this week — a gig economy app, a rental marketplace, a job board — and write down three specific observations about how its pricing mechanism behaves when demand spikes for a particular item or service. Compare what you observe to the auction procedure from this chapter: are prices rising for over-demanded items? Is contention being resolved by price rather than by rationing or lottery? Write one paragraph connecting your observations to the market-clearing price concept.
