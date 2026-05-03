# Practice Exercises: Chapter 12 — Part III: Markets and Strategic Interaction in Networks

## 🧪 Comprehension Check

**Q1:** Game theory models individuals as choosing strategies to maximize their own payoffs. But in a network, the payoff a person receives often depends not just on their own choice but on the choices of their neighbors. How does this "local interaction" structure change the nature of equilibrium compared to a standard game where everyone plays against everyone else simultaneously?

<details>
<summary>Answer</summary>

In a standard (non-network) game, every player's payoff is influenced by the aggregate choices of all other players, so equilibrium is reached when no single player wants to deviate given what everyone else is doing globally. In a network game, each player's payoff depends only on the strategies of adjacent nodes, so equilibrium conditions are local: a player checks only their direct neighbors, not the whole population. This means multiple equilibria can coexist in different parts of the network simultaneously — one cluster of nodes may coordinate on one strategy while another cluster coordinates on a different one, and both configurations can be stable. The network topology (who is connected to whom) therefore fundamentally shapes which equilibria are reachable and how behavior spreads.

</details>

---

**Q2:** The concept of a Nash equilibrium is central to Part III. Explain what a Nash equilibrium is and why it is considered a "stable" outcome, while also identifying at least one limitation of using Nash equilibrium as a predictive tool in real markets or social networks.

<details>
<summary>Answer</summary>

A Nash equilibrium is a strategy profile in which no individual player can improve their own payoff by unilaterally changing their strategy, given that all other players keep their strategies fixed. It is "stable" in the sense that once reached, no one has an incentive to deviate, so the system tends to stay there. However, Nash equilibrium has important limitations as a predictor: games often have multiple Nash equilibria, so the theory alone does not tell us which one will emerge. Additionally, reaching a Nash equilibrium requires a level of rationality and information about others' strategies that real actors rarely possess. In large networks, the computational burden of finding a Nash equilibrium may itself be prohibitive, and bounded-rational or learning-based dynamics may converge to very different outcomes.

</details>

---

**Q3:** Markets are often analyzed through the lens of supply and demand, while strategic interaction is analyzed through game theory. How does the network setting force these two frameworks to speak to each other — that is, in what ways does market structure (who trades with whom) affect strategic outcomes, and vice versa?

<details>
<summary>Answer</summary>

In a standard competitive market, price is determined by aggregate supply and demand and no individual trader has market power. Once trading relationships are embedded in a network, however, the topology matters enormously: a trader who sits on the only path connecting two groups of buyers and sellers can exercise bargaining power that no equilibrium price in a frictionless market would predict. Conversely, strategic choices — such as whether to enter a market, form a link, or undercut a rival — reshape the network structure itself, altering who can trade with whom. The two frameworks are therefore jointly determined: market outcomes depend on the network of trading relationships, and that network is itself the result of strategic decisions by self-interested agents. Part III uses bilateral bargaining, matching markets, and auctions to formalize this two-way dependence.

</details>

---

**Q4:** A "dominant strategy" is one that is best for a player regardless of what others do. Why are dominant strategies relatively rare in the kinds of interdependent, network-embedded games studied in Part III, and what analytical tools take their place when dominant strategies do not exist?

<details>
<summary>Answer</summary>

Dominant strategies are rare in network games because a player's best response almost always depends sensitively on the actions of their neighbors — the same action can be optimal when a neighbor cooperates and disastrous when the neighbor defects, or optimal when a neighbor adopts a technology and useless when the neighbor does not. When dominant strategies are absent, analysts fall back on Nash equilibrium (sometimes refined by concepts such as subgame perfection or trembling-hand perfection), iterated elimination of dominated strategies, and evolutionary or learning dynamics that describe how behavior evolves over time. In network settings specifically, best-response dynamics — where nodes sequentially update to the strategy that maximizes their payoff given current neighbor behavior — are used to predict which equilibrium emerges from a given initial configuration.

</details>

---

**Q5:** Part III emphasizes that networks create both value and power asymmetries. Explain the mechanism by which network position — rather than intrinsic quality or cost advantage — can confer economic power on a node, and give a concrete example.

<details>
<summary>Answer</summary>

A node's structural position determines how many alternative trading partners exist for each party in a potential transaction. When a node occupies a "bridge" position — sitting on the shortest or only path between two otherwise disconnected groups — it controls access in a way that gives it bargaining leverage even if it has no cost or quality advantage. For example, consider a labor market where a single recruiter is the only connection between a pool of workers and a pool of employers. Even if that recruiter adds no productive value, she can extract a share of the surplus from every match simply because both sides need to go through her. This is distinct from monopoly power based on production costs; it is purely structural power derived from betweenness in the network. The Easley-Kleinberg framework formalizes this through bilateral bargaining models where the division of surplus reflects the outside options — and hence the network positions — of both parties.

</details>

---

## 🔄 Apply It

**Scenario 1: The Freelance Marketplace Middleman**
A small city has a thriving community of independent graphic designers and a set of local businesses that need design work. Currently, every designer and every business is connected only through a single well-connected individual — a local consultant who manages all introductions and takes a 30% commission. A new online platform launches that directly connects designers and businesses.

*What should you consider?*
- How does the introduction of the platform change the network topology and what happens to the consultant's structural power?
- Will the platform necessarily lead to better outcomes for both designers and businesses, or might new power asymmetries emerge?
- What does the theory of bargaining on networks predict about how surplus will be redistributed once the middleman's bridge position is eliminated?

<details>
<summary>Model Response</summary>

The consultant's 30% commission is a direct rent on her bridge position: she is the only path between the two sides of the market, so both designers and businesses must transact through her. When the platform creates direct links between all designers and all businesses, her structural position is destroyed — she becomes a redundant node rather than a bridge. Network bargaining theory predicts that her share of surplus collapses because both parties now have many outside options and no longer need her as an intermediary.

However, the platform itself may inherit a version of this power if it becomes the sole venue where both sides are present. If designers and businesses both concentrate exclusively on the platform (due to network effects — going where everyone else is), the platform operator becomes the new bridge, potentially extracting rents through listing fees, algorithmic ranking, or transaction fees. The outcome for designers and businesses depends on whether the platform faces competition from other platforms: competition among platforms constrains their ability to extract surplus, while a monopoly platform may simply replace the consultant as the dominant intermediary.

The key lesson from network bargaining theory is that surplus division tracks the ratio of outside options. With a competitive platform and many alternatives, all parties approach their marginal contributions, and the market becomes more efficient. With a monopoly platform and switching costs, the platform appropriates the surplus that previously went to the consultant.

</details>

---

**Scenario 2: Coordinating on a New Technology Standard**
Two competing technology ecosystems — call them System A and System B — are both present in an enterprise software market. Individual firms must choose one system; the value of a system to any given firm depends on how many of its regular trading partners (suppliers, customers, collaborators) are also using that system. There is no central authority to mandate a standard.

*What should you consider?*
- How does the network of trading relationships shape which equilibrium (universal adoption of A, universal adoption of B, or a divided market) is stable?
- What role do "critical" or highly connected firms play in tipping the market toward one standard?
- Under what conditions might a market remain stuck in a fragmented equilibrium even when everyone would be better off on a single standard?

<details>
<summary>Model Response</summary>

This is a coordination game with network externalities embedded in a trading network. The payoff to adopting System A for any given firm depends on how many of its direct trading partners have already adopted A — exactly the local-interaction structure analyzed in Part III. The game can have multiple Nash equilibria: universal adoption of A, universal adoption of B, or potentially a split where one cluster of firms uses A and another uses B, with no firm having an incentive to switch unilaterally because their local neighbors are already on their system.

The network topology determines which equilibria are reachable. A highly connected "hub" firm — one that trades with many others — has outsized influence: if the hub adopts A, many of its neighbors' best responses flip to A as well, potentially triggering a cascade. This is the mechanism behind "tipping": once adoption crosses a threshold in a sufficiently densely connected part of the network, adoption spreads rapidly through best-response dynamics.

A fragmented equilibrium persists when the network has a sparse cut between two large clusters — few edges cross the cluster boundary, so firms near the boundary have few neighbors on the other system and no incentive to switch. This can persist indefinitely even if a coordinating authority could prove that switching to a single standard would make everyone better off, because no individual firm bears the coordination cost. Breaking such fragmentation typically requires a large player who internalizes the network-wide benefit, or an external intervention (regulatory mandate, subsidy for switching, or a dominant platform that refuses to support both systems).

</details>

---

**Scenario 3: Auction Design for a Public Spectrum License**
A government agency is auctioning off a block of radio frequency spectrum. There are five potential bidders: two large national carriers, two regional carriers, and one technology startup. The license is a single indivisible good. The agency must decide between a sealed-bid first-price auction, a second-price (Vickrey) auction, and an ascending-bid (English) auction.

*What should you consider?*
- How does each auction format affect bidders' incentives to reveal their true valuations?
- What does auction theory predict about revenue equivalence across formats, and what conditions cause it to break down in practice?
- How does asymmetry among the bidders (large vs. small carriers, incumbent vs. newcomer) interact with auction design to affect both efficiency and revenue?

<details>
<summary>Model Response</summary>

In a second-price (Vickrey) auction, bidding one's true valuation is a dominant strategy: regardless of what others bid, you cannot improve your outcome by shading your bid up or down. This property makes the Vickrey auction theoretically attractive because it produces an efficient allocation — the license goes to the bidder who values it most. In a first-price sealed-bid auction, bidders shade their bids below their true valuations because they pay what they bid; the optimal shade depends on beliefs about others' valuations, making truthful revelation suboptimal. In an ascending English auction, bidders can observe the competition dropping out and adjust accordingly, which also tends to produce efficient outcomes and, under symmetric independent private values, yields the same expected revenue as the other formats — the Revenue Equivalence Theorem.

Revenue equivalence breaks down precisely in the conditions present here: bidders are asymmetric (large carriers likely have higher valuations and also lower costs of capital), and valuations may be correlated (all carriers observe industry signals about spectrum value). When bidders are asymmetric, first-price auctions can allocate the license to a lower-value bidder if that bidder shades less aggressively. Correlated valuations give rise to the winner's curse in common-value settings, causing rational bidders to shade bids further, which reduces revenue. The ascending auction partially mitigates the winner's curse by revealing information during the bidding process.

For the agency, the startup's presence is a double-edged sword: it increases competition but the startup's lower financial capacity may cause it to drop out early, reducing competitive pressure on the large carriers. Auction design choices — reserve prices, bidder subsidies, or package bidding — can counteract these asymmetries to improve both efficiency and revenue simultaneously.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you were in a negotiation — salary discussion, a purchase, a contract — where one party clearly had more alternatives than the other. Now that you understand how network position and outside options determine bargaining power, what structural changes to your situation (building new relationships, creating alternatives, reducing the other party's alternatives) could have shifted the power balance before the negotiation even began?

2. Think of a professional or social group you belong to where two competing tools, platforms, or standards coexist and create friction (different messaging apps, document formats, project management systems). What does coordination game theory tell you about why the fragmentation persists even when everyone acknowledges it is inefficient, and what would it actually take — not just willingness but structural intervention — to tip the group toward a single standard?

3. Think of a time when you participated in a competitive process — a job application pool, a bidding situation, a grant competition — and either overbid (expended too many resources) or underbid (lost an opportunity you could have won). What information about the other "bidders" were you missing, and how would you now design your strategy differently using the concepts of dominant strategies, best responses, and the winner's curse?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the concept of Nash equilibrium and why it matters for understanding markets and social behavior — in exactly 3 sentences — to someone who has never studied economics or game theory.

<details>
<summary>Model Explanation</summary>

A Nash equilibrium is a situation where every person is making the best choice they can, given what everyone else around them is doing — so no one has any reason to change their behavior on their own. It is important because it helps us predict where a market, a negotiation, or a social norm will settle: not necessarily at the outcome that is best for everyone, but at the outcome where no single person can do better by acting differently while others stay put. The unsettling insight is that a Nash equilibrium can be collectively terrible — everyone stuck in traffic, everyone polluting, everyone undercutting prices to the point of ruin — simply because the individual incentives point in a direction that is bad for the group.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a social network with the following structure: there are three tightly knit communities (cliques) of nodes, connected to each other by single bridge nodes — exactly the "weak ties" structure analyzed in Part II. Each node must choose between two behaviors, A and B, and receives a payoff that increases with the fraction of its neighbors who make the same choice (a coordination game). Now suppose behavior A begins spreading from a seed node in one community.

(a) Using the weak-ties framework from Part II, explain why the bridge nodes are both the most likely bottlenecks to cross-community spread AND the nodes with the most structural bargaining power if the spread of A were framed as a market transaction.

(b) If the bridge nodes are rational strategic agents, under what conditions will they adopt A and "transmit" the cascade to the neighboring community, and under what conditions will they remain on B even if their community-side neighbors have all switched to A?

(c) Suppose one community is much larger than the others. How does community size interact with the network topology and the payoff structure to determine whether adoption of A reaches a system-wide tipping point or stalls at the community boundary?

**Chapters involved:** Chapter 12 (Markets and Strategic Interaction — coordination games, Nash equilibrium, network games) + Chapters 3 and 4 (Strong and Weak Ties, Network Structure and the Spread of Information)

---

## 📋 Action Items

1. On Monday morning before checking email, draw the network of your five most important professional relationships on paper. Mark each edge with an estimate of how many alternative connections each party has (your alternatives to them, their alternatives to you). Identify any edge where you are significantly more replaceable than the other party, and write down one concrete action to build an alternative relationship that would rebalance that power asymmetry within the next 30 days.

2. This week, identify one coordination failure in your team or organization — a situation where two or more tools, formats, or processes coexist and create unnecessary friction. Map out who the most connected "hub" individuals are in that context, and schedule a 20-minute conversation with one of them to discuss what it would take to tip the group toward a single standard, framing the ask in terms of their neighbors' choices rather than a global mandate.

3. Before your next significant competitive situation (job application, pricing a proposal, bidding on a contract), write down your honest best estimate of your valuation and then explicitly calculate your bid under two models: (a) bid your true value as if it were a second-price auction, and (b) shade your bid by estimating the next-highest competitor's valuation and bidding just above it as if it were a first-price auction. Compare the two numbers and use the gap between them to make a conscious, theory-informed decision rather than a gut-feel one.
