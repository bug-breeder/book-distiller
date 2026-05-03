# Practice Exercises: Chapter 11 — Network Models of Markets with Intermediaries

## 🧪 Comprehension Check

**Q1:** In the chapter's trading network model, traders post bid prices to sellers and ask prices to buyers. Why is a trader's profit equal to the sum of accepted asks minus the sum of accepted bids — and what does this structure reveal about how intermediaries capture value?

<details>
<summary>Answer</summary>

A trader buys low (at bid prices) and sells high (at ask prices), so profit is the difference between what buyers pay him and what he pays sellers. The structure reveals that intermediaries do not create value from the good itself — they capture the surplus that flows between the seller's low valuation and the buyer's high valuation. The bid-ask spread is the intermediary's toll for connecting the two sides of the market. A monopolist trader can set bids to zero and asks to the buyer's full value, extracting all surplus; a trader under perfect competition is forced to zero profit because any positive spread invites undercutting.

</details>

**Q2:** Why does perfect competition between two traders — even when each could individually make a positive profit — force both of them to zero profit in equilibrium? What is the precise mechanism?

<details>
<summary>Answer</summary>

If one trader is performing a transaction at a positive spread (bid b, ask a, with a > b), the idle trader can always profitably undercut: offer a bid slightly above b and an ask slightly below a, taking the trade and earning a positive payoff. This undercutting logic cascades until neither trader can improve by deviating, which only happens when bid equals ask — that is, when the spread collapses to zero and both traders earn nothing. The mechanism is not that traders are altruistic; it is that the threat of being undercut makes any positive profit unsustainable.

</details>

**Q3:** The chapter introduces "implicit perfect competition" (Figure 11.9) — a network in which no two traders directly compete for the same seller-buyer pair, yet all traders still earn zero profit in equilibrium. How is this possible, and what does it tell us about the relationship between network structure and competitive pressure?

<details>
<summary>Answer</summary>

In implicit perfect competition the traders are arranged in a chain or overlapping structure such that each trader is indirectly constrained by the others: if any one trader tried to post a positive spread, a deviation exists somewhere in the network that routes trade around him at a lower cost. The zero-profit result emerges from the global topology of the network, not from any direct head-to-head rivalry. This tells us that competitive pressure is not simply a local property — a trader can be "competed away" by the overall structure of alternatives available to buyers and sellers, even without a single direct rival.

</details>

**Q4:** The chapter proves that every equilibrium of the trading network game produces a flow of goods that achieves the social optimum. What does "social optimum" mean here mathematically, and why does money not affect the calculation?

<details>
<summary>Answer</summary>

Social welfare equals the sum of (v_j - v_i) over all seller-buyer pairs (i, j) where a good actually moves from i to j — that is, how much more the buyer values the good than the seller did. Money payments do not affect the total because every dollar a buyer pays a trader is a dollar the trader earns, and every dollar a trader pays a seller is a dollar the seller earns; money simply transfers between players and cancels out in the aggregate. The social optimum is therefore the assignment of goods to the highest-value buyers that the network connectivity actually permits. The equilibrium achieves this because traders have strong incentives to route goods to buyers who value them most, since those buyers generate the largest spreads to compete over.

</details>

**Q5:** A trader can earn a positive profit in some equilibrium if and only if it has an "essential edge" — an edge whose removal would reduce the social optimum. Why is this the right condition, and why is node-level monopoly power alone insufficient?

<details>
<summary>Answer</summary>

An essential edge is one that enables a trade that could not otherwise happen; the trader who holds it is the only path through which a particular unit of surplus can be realized. This gives the trader genuine indispensability: without him that value is simply lost, so sellers and buyers cannot credibly threaten to route around him. Node-level monopoly power alone is insufficient because a trader might monopolize a seller or buyer while still facing a competing path that can replicate any specific transaction — as seen in Figure 11.13, where T1 monopolizes sellers yet earns zero because T2 can replicate each individual trade even though T2 cannot handle all trades simultaneously. The "threat is stronger than its execution" in that case, because the mere possibility of T2 covering any one deal prevents T1 from extracting a spread.

</details>

---

## 🔄 Apply It

**Scenario 1: The Rural Grain Market**
A development economist is studying a region where three villages each produce grain (sellers S1, S2, S3, each valuing grain at 0) and two towns each need grain (buyers B1 and B2, valuing grain at 1). There are two grain traders, T1 and T2. Currently only T1 has a truck that can reach all villages and both towns; T2 has a motorcycle and can only reach village S3 and town B2. An NGO is considering funding a road that would give T2 access to all villages and towns.

*What should you consider?*
- How does the current network topology determine which participants are monopolized and which benefit from competition?
- What happens to the bid-ask spreads T1 charges when T2 gains full connectivity?
- Who are the winners and losers of the road investment, and is total social welfare increased?

<details>
<summary>Model Response</summary>

In the current network, S1, S2, and B1 are monopolized by T1, so T1 bids 0 to those sellers and asks 1 from B1, capturing all surplus. S3 and B2 are monopolized by T2. After the NGO funds the road, T1 and T2 both connect to all nodes. Now S1, S2, S3, B1, and B2 all have access to both traders — perfect competition applies everywhere. Both traders are forced to bid/ask at the same value x (anywhere between 0 and 1), earning zero profit. Sellers and buyers collectively capture the entire surplus from trade. Social welfare does not change in magnitude (the same goods still flow to the same buyers if valuations are identical), but the distribution shifts dramatically: traders lose all profits and that value is transferred to sellers and buyers. If the road also enables additional trades that were previously impossible (e.g., T2 could not handle S1-B1), then total welfare increases as well. The NGO should anticipate trader resistance to the investment even though it benefits the broader community.

</details>

**Scenario 2: The Dark Pool Decision**
A hedge fund manager needs to buy 500,000 shares of a thinly traded stock. She can route her order through (a) the NYSE, where her large order will "walk up the book" and reveal her trading intent to the market, driving up the price, or (b) a dark pool run by a major bank, where orders are matched privately at publicly posted prices. She values discretion but worries the dark pool charges higher implicit fees.

*What should you consider?*
- How does each venue correspond to a different network topology with different intermediary power?
- What does the chapter's theory predict about the bid-ask spread she faces in each venue?
- How does information leakage (a factor the model explicitly sets aside) interact with the network structure analysis?

<details>
<summary>Model Response</summary>

The NYSE is a highly connected, competitive market with many potential counterparties; the chapter's model predicts that competition among intermediaries drives spreads toward zero. However, for a very large order, walking up the book is equivalent to facing many sub-markets sequentially, each with its own local supply. The dark pool is a restricted-access network where the bank is effectively a monopolist intermediary for her order — it can charge fees that reflect this reduced competition. The chapter's theory predicts that the dark pool spread will be higher (the bank captures more surplus), but the benefit of not signaling trading intent may outweigh that cost. The chapter acknowledges this information dimension (discussed in Chapter 22) is outside the model, but the network insight still applies: using fewer, less competitive venues increases intermediary power and cost, while using more public venues reduces cost but exposes the trader's intentions. The optimal strategy — splitting orders across venues — directly mirrors the book's observation that large institutional traders fragment orders precisely to manage this tradeoff.

</details>

**Scenario 3: The Freelance Platform Ecosystem**
A software developer currently lists her services on a single freelance platform (Upwork) that charges a 20% commission — a structural monopoly since her clients only know how to hire through Upwork. She is considering also listing on two newer platforms (Toptal and a direct client website) that her existing and potential clients could also access.

*What should you consider?*
- How does each platform correspond to a trader node, and how does adding platforms change the network topology?
- What does the chapter predict will happen to the effective commission she pays as she adds access to more platforms?
- Are there conditions under which adding platforms helps her but hurts some clients?

<details>
<summary>Model Response</summary>

Each platform is a trader-intermediary standing between the developer (seller) and clients (buyers). Currently Upwork monopolizes both sides: it sets the maximum commission it can extract from the surplus between the developer's cost and the client's willingness to pay. As she adds platforms that her clients can also access, she creates direct competition between intermediaries for her trade flow. The chapter predicts the effective commission rate (the bid-ask spread) will fall toward zero as platforms compete. If some clients can only use Upwork (they are "monopolized" by Upwork on the buyer side), those clients see no benefit. But clients who can access multiple platforms benefit from competitive pressure forcing Upwork to lower fees. A ripple effect may also occur: even clients who stay on Upwork may benefit if Upwork lowers fees network-wide to retain volume — an effect analogous to the chapter's ripple effects from network changes. The developer should expect platform resistance and potentially Upwork's terms-of-service prohibiting multi-homing, which is the platform's way of preserving its monopoly network position.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you paid a significant fee to a middleman — a real estate agent, a ticket reseller, a recruiter, a financial advisor — when you felt there were few alternatives. Now that you understand the concept of monopolized nodes and bid-ask spreads in trading networks, what would you do differently to identify or create competing intermediaries before your next major transaction?

2. Think of a professional situation where you were the intermediary — a connector, a broker of introductions, an internal consultant routing work between teams. What determined how much "spread" you were able to capture, and how does the chapter's essential-edge condition help you understand when and why you had genuine leverage versus when your position was more fragile than it appeared?

3. Think of a time when a small change in a market you participate in — a new platform launching, a supplier gaining a new distribution channel, a competitor gaining a new customer — had effects that rippled to you even though you were not directly involved in the change. What was the mechanism, and how would the chapter's framework of ripple effects in trading networks help you anticipate similar non-local consequences in the future?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the concept of how network position determines intermediary profit — and specifically why a monopoly intermediary captures everything while a competitive one captures nothing — in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

When you buy something, you often deal not with the original seller but with a middleman — a broker, a platform, or a trader — who buys from the seller and sells to you, pocketing the difference between the two prices. If that middleman is the only one connecting you to the seller, they can set the buying price as low as the seller will accept and the selling price as high as you will pay, capturing all the value for themselves. But if there is a second middleman who could do the same job, they will compete by offering slightly better prices to steal your business, and this competition continues until neither middleman makes any money at all — the value flows entirely to you and the original seller instead.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** Consider a single-item auction in which a seller wants to sell one painting. There are three potential buyers with private valuations w > x > y (known only to themselves), and each buyer must bid through a dedicated personal agent (trader) who charges whatever commission maximizes the agent's own profit. Each agent is connected only to the seller and to his own buyer. Model this as a trading network and find the subgame perfect Nash equilibrium. Then answer: (a) What price does the seller receive? (b) What does each buyer pay? (c) How does the equilibrium outcome compare to a standard second-price sealed-bid auction run directly by the seller with no intermediaries? (d) Explain the welfare comparison: is the social welfare the same, higher, or lower with intermediaries, and why?

**Chapters involved:** Chapter 11 (trading networks, monopoly intermediaries, equilibrium) + Chapter 9 (second-price auctions, truthful bidding, revenue equivalence)

---

## 📋 Action Items

1. On Monday morning before checking email, sketch the trading network for one recurring transaction in your professional life — map out the sellers, buyers, and intermediaries as nodes with edges, label each edge with an approximate bid or ask price, and identify which nodes are monopolized versus which face competition. Use this diagram to identify one intermediary relationship you could renegotiate or bypass.

2. Before your next salary negotiation or contract renewal, research at least two alternative buyers for your services (employers, clients, or platforms) and make sure the current party knows those alternatives exist — this transforms you from a monopolized seller node into one with competitive alternatives, which the chapter shows directly increases the price you can command.

3. This week, when a new business relationship, platform, or market entrant appears in your industry, trace through who gains and who loses using the ripple-effect logic: identify the bottleneck the change affects, determine which previously monopolized nodes now have competition, and list the non-local nodes whose payoffs will shift even though they are not directly connected to the new link.
