# Chapter 11: Network Models of Markets with Intermediaries

## 🧠 Core Thesis
In real markets, buyers and sellers rarely trade directly — they trade through intermediaries whose network position determines their pricing power. A trader's ability to extract profit depends not on simple monopoly over a single party, but on whether their specific network edges are structurally essential to achieving the socially optimal flow of goods.

---

## 📖 Detailed Breakdown

### Price-Setting in Real Markets and the Role of Intermediaries
- **What it is:** A motivating observation that in virtually all real markets — stock exchanges, agricultural commodity markets in developing countries — individual buyers and sellers trade through intermediaries (brokers, market-makers, middlemen) rather than directly with each other. Prices are set not by a neutral auctioneer but by these intermediaries.
- **Why it matters:** Chapter 10's model of market-clearing prices described an idealized world. This chapter asks the harder question: in real markets with brokers and middlemen, who actually sets prices and why?
- **How it works:** In the U.S. stock market, trade occurs across many venues — NYSE, NASDAQ-OMX, and alternative systems like Goldman Sachs's Sigma-X (a "dark pool") that match orders privately at publicly established prices. Institutional traders (mutual funds, pension funds) split large orders across venues to hide their trading intentions and minimize price impact. The result is a network of trading relationships with differential access.
- **Key quote or example:** The stock market's order book illustrates how the bid (highest outstanding offer to buy) and ask (lowest outstanding offer to sell) emerge. When a retail trader submits a market order to buy, they transact at the ask. When a large buyer submits a 200-share market order against a book with only 100 shares at $5.00 and 100 at $5.50, they "walk up the book," paying different prices — an illustration of how network access shapes transaction costs.
- **Connection:** This motivates the formal network model built in Section 11.2, which abstracts away institutional detail to focus on the pure structural logic of how network position determines prices.

---

### The Formal Network Model of Trade
- **What it is:** A graph-theoretic model where three types of nodes — sellers (circles on the left, value v_i for their good), buyers (circles on the right, value v_j for the good), and traders/intermediaries (squares in the middle) — are connected by edges representing who can trade with whom. Every edge connects either a seller to a trader or a buyer to a trader; sellers and buyers never trade directly.
- **Why it matters:** This structure captures the fundamental constraint that in intermediated markets, access to the market is itself a scarce resource controlled by who you are connected to.
- **How it works:** Each seller i has one unit of an indivisible good valued at v_i (always 0 in examples). Each buyer j values one copy at v_j. No one wants more than one copy. The network is externally fixed (by geography, regulation, or eligibility), unlike Chapter 10's preferred-seller graphs which were endogenously determined by prices.

  The game has two stages:
  1. All traders simultaneously post bid prices b_{ti} to each connected seller i (offering to buy the good at b_{ti}) and ask prices a_{tj} to each connected buyer j (offering to sell at a_{tj}).
  2. All sellers and buyers simultaneously choose which trader to deal with (or no one), selecting the best available offer. Sellers choose the highest bid; buyers choose the lowest ask.

  This is a subgame perfect Nash equilibrium (called simply "equilibrium" in the chapter): traders choose prices anticipating that sellers and buyers will always pick their best option, and traders themselves best-respond to each other's price strategies.

- **Key quote or example:** Figure 11.3 shows three sellers (S1, S2, S3 with value 0) and three buyers (B1, B2, B3 with value 1) connected via two traders T1 and T2. In Figure 11.4(a), T1 bids 0.2 to S1 and S2, asks 0.8 from B1 and B2; T2 bids 0.3 to S2 and S3, asks 0.7 from B2 and 1 from B3. The resulting flow of goods (Figure 11.4b) routes goods from sellers to buyers through whichever trader offers the best deal.
- **Connection:** The payoff structure directly mirrors prior auction and game theory chapters. A trader's payoff is (sum of accepted asks) minus (sum of accepted bids), with a large penalty if more buyers accept than sellers (to prevent overpromising). Seller i's payoff from dealing with trader t is b_{ti}; buyer j's payoff from dealing with trader t is v_j - a_{tj}.

---

### Monopoly in Trading Networks
- **What it is:** When a buyer or seller has access to only a single trader, that trader has monopoly power over them and can extract their entire surplus.
- **Why it matters:** It establishes the baseline case — the worst outcome for a buyer or seller — and explains why network connectivity matters so much.
- **How it works:** In Figure 11.6, one seller (value 0), one trader T1, and one buyer (value 1) form a chain: S1-T1-B1. The unique equilibrium has T1 bidding 0 to S1 and asking 1 from B1. The seller and buyer each earn zero. Any other bid-ask pair between 0 and 1 would leave room for T1 to slightly lower the bid or raise the ask, increasing profit — so only the extreme prices are stable. The trader captures the entire surplus of 1.
- **Key quote or example:** "When you see a seller or buyer connected to only a single trader, they will receive zero payoff in any equilibrium, since the trader will drive the bid or ask to as extreme a value as possible."
- **Connection:** This is the reference case from which all other network configurations are measured. The presence of competition or alternative routes reduces trader power.

---

### Perfect Competition in Trading Networks
- **What it is:** When both a buyer and a seller have access to two or more traders, competition between those traders drives trader profit to zero — but the surplus split between buyer and seller is indeterminate.
- **Why it matters:** It shows that even in intermediated markets, competition can eliminate trader profits entirely. But it also reveals that competitive equilibria are not unique: any price x between 0 and 1 can be an equilibrium.
- **How it works:** In Figure 11.7, S1 and B1 can both trade with T1 or T2. If either trader is making a positive profit (bid b < ask a), the other trader can undercut — offer a slightly higher bid and slightly lower ask — and steal the trade. So in equilibrium, both traders must offer identical bid and ask equal to the same number x. The trade happens (via one of the traders, with the coordination resolved by the modelers), but no trader profits. The value of x can be anything in [0,1], with x = 0 giving all surplus to the buyer, x = 1 giving all surplus to the seller, and x = 1/2 splitting it equally. The game itself cannot pin down which equilibrium occurs.
- **Key quote or example:** "Traders make no profit in any equilibrium" under perfect competition, but "the choice of equilibrium — captured in the value of x — determines which of the seller or buyer receives a higher payoff... the choice of equilibrium reflects something about the relative power of the seller and buyer that can only be inferred by looking outside the formulation of the trading game."
- **Connection:** Combined with the monopoly case, these two building blocks allow analysis of any complex network by identifying which subnetworks correspond to each pattern.

---

### Analyzing Complex Networks via Building Blocks
- **What it is:** The technique of decomposing a larger trading network into subgraphs that correspond to monopoly or perfect competition structures, then reading off equilibrium outcomes for each part.
- **Why it matters:** It makes complex networks tractable. Rather than solving for equilibrium from scratch, one can identify which sellers/buyers are monopolized and which benefit from competition.
- **How it works:** In Figure 11.8 (the original three-seller, three-buyer, two-trader network from Section 11.2):
  - S1 is connected only to T1, B1 only to T1: T1 monopolizes both. Bids and asks go to 0 and 1. S1 and B1 earn 0.
  - S3 is connected only to T2, B3 only to T2: T2 monopolizes both. Same result.
  - S2 and B2 are each connected to both traders: perfect competition. Both traders offer bid and ask of x for some x in [0,1]. S2 and B2 each earn x and 1-x respectively.
- **Key quote or example:** "When two traders both connect the same seller and buyer, then neither can make a positive profit in conveying a good from this seller to this buyer: if one trader performed the trade at a positive profit, the other could undercut them."
- **Connection:** Sets up the more subtle phenomenon of implicit perfect competition.

---

### Implicit Perfect Competition
- **What it is:** A surprising phenomenon where traders earn zero profit even when no two traders compete directly for the same buyer-seller pair — competition is transmitted indirectly through the global network structure.
- **Why it matters:** It shows that the network's global topology, not just local pairwise competition, can discipline prices. Traders can be constrained by competition they do not directly face.
- **How it works:** Figure 11.9 shows a network with sellers S1 and S2, buyers B1 and B2, and four traders T1, T2, T3, T4, arranged so that no single trader serves both the same seller and buyer. T1 connects S1 to B1; T4 connects S2 to B2; T2 and T3 are intermediaries in between connecting the two chains. Despite no direct competition on any single trade route, in any equilibrium all bid and ask prices converge to the same value x, and all traders earn zero. If any trader were to set a bid lower than the ask, another trader somewhere in the chain could undercut him and steal the flow.
- **Key quote or example:** "Traders can make zero profit for reasons based more on the global structure of the network, rather than on direct competition with any one trader."
- **Connection:** This generalizes the competitive result and anticipates the formal essentiality condition for trader profits in Section 11.6.

---

### Second-Price Auctions as a Special Case of Trading Network Equilibria
- **What it is:** The demonstration that a standard second-price (Vickrey) auction, previously analyzed in Chapter 9, emerges naturally as the equilibrium of a specific trading network — without being built in by assumption.
- **Why it matters:** It unifies the auction and trading-network frameworks, showing that the second-price rule is not an artificial design choice but a natural equilibrium outcome of competitive intermediation.
- **How it works:** Figure 11.10(a) shows one seller S1 (value 0) and four buyers with valuations w > x > y > z, each represented by a distinct trader who acts as their proxy. In equilibrium (Figure 11.10b), trader T1 (representing buyer B1, with highest value w) outbids all others by just enough — bidding x (the second-highest value) to the seller. The seller receives x, buyer B1 gets the good and pays w to T1, netting w - w = 0 surplus... wait: T1 bids x to S1 and asks w from B1. T1's profit is w - x. The seller receives x. This replicates the second-price auction: the item goes to the highest-value buyer, the seller receives the second-highest price. The second-price rule was not engineered; it emerged from competitive bidding among traders.
- **Key quote or example:** "The resulting equilibrium implements the second-price rule from Chapter 9... the second-price rule wasn't in any sense 'built in' to the formulation of the auction; it emerged naturally as an equilibrium in our network representation."
- **Connection:** Links back to Chapter 9's auction theory and forward to the general efficiency result in Section 11.5.

---

### Ripple Effects from Network Changes
- **What it is:** The phenomenon whereby adding or removing a single edge in a trading network can change equilibrium outcomes for nodes that are not directly involved in the change — sometimes dramatically reversing who gets to trade at all.
- **Why it matters:** It shows that trading network markets are globally interdependent. A new trading relationship formed between two distant parties can harm a buyer or seller who had nothing to do with it. This has direct implications for thinking about market structure changes, platform entry, or regulatory interventions.
- **How it works:** Compare Figures 11.11(a) and 11.11(b). In (a), sellers S1, S2, S3 and buyers B1 (value 1), B2 (value 2), B3 (value 3), B4 (value 4) are connected through T1 and T2. T2 is a bottleneck: he has access to high-value buyers B3 and B4 but only one seller (S3). In equilibrium, B1 and B4 get the goods; B2 buys from T1 at a common ask x in [0,2]. Social welfare = 1 + 2 + 4 = 7.

  When a single edge from S2 to T2 is added (Figure 11.11b), the bottleneck breaks. Now T2 can supply both B3 and B4. The equilibrium changes entirely: S2 and S3 sell through T2 to B3 and B4; S1 sells through T1 to B2. Buyer B1, who previously traded, now does not. The range of possible asks to B2 shifts upward from [0,2] to [1,2]. S2 gains significantly more bargaining power. Social welfare rises to 2 + 3 + 4 = 9.

- **Key quote or example:** "A link formed between two nodes, neither of which are neighbors of hers, has caused her [B1] to no longer be able to obtain the good... a 'non-local' effect."
- **Connection:** Points toward the malleable-network literature (endogenous link formation) and the broader question of how much S2 and T2 should be willing to pay to form that link.

---

### Social Welfare in Trading Networks
- **What it is:** The formal result that equilibria in trading networks are always socially optimal — every equilibrium maximizes the total surplus from trade, defined as the sum of (v_j - v_i) over all goods that move from seller i to buyer j.
- **Why it matters:** Despite traders acting self-interestedly and using their network positions to extract profit, the market is not inefficient. Goods end up with the highest-value buyers who can be reached given the network constraints.
- **How it works:** Social welfare from any transaction where good moves from seller i (value v_i) to buyer j (value v_j) through trader t (bid b_{ti}, ask a_{tj}) is:
  (b_{ti} - v_i) + (a_{tj} - b_{ti}) + (v_j - a_{tj}) = v_j - v_i.
  The money terms cancel — they are pure transfers. So total social welfare equals the sum of v_j - v_i over all completed trades. This is maximized when goods reach the buyers who value them most, subject to the network's connectivity constraints. The theorem (from Corominas-Bosch, 2004) states: in every trading network, at least one equilibrium exists, and every equilibrium achieves the social optimum. This parallels the efficiency result for market-clearing prices in Chapter 10.
- **Key quote or example:** "It can be shown that in every trading network, there is always at least one equilibrium, and every equilibrium produces a flow of goods that achieves the social optimum."
- **Connection:** Mirrors Chapter 10's result that market-clearing prices always exist and always maximize total buyer valuation. The network introduces intermediaries but preserves the efficiency property.

---

### Trader Profits and the Essentiality Condition
- **What it is:** The structural criterion that determines whether a trader can earn positive profit in equilibrium: a trader T earns positive profit in some equilibrium if and only if T has an "essential edge" — an edge to a seller or buyer whose removal would reduce the value of the social optimum.
- **Why it matters:** It provides a precise, graph-theoretic definition of what it means for a trader to be irreplaceable. Merely having monopoly power over individual parties is not sufficient; the trader must be structurally indispensable to the socially optimal allocation.
- **How it works:** Two counter-intuitive examples reveal why simple monopoly is not enough:

  **Example 1 (Figure 11.12):** A network with three sellers, three buyers, and five traders where any x in [0,1] is an equilibrium. When x = 1, traders T1 and T5 profit; when x = 0, only T3 profits. Profit "slides" between traders depending on which equilibrium is selected. There is no single trader who always profits.

  **Example 2 (Figure 11.13):** Traders T1 and T2 both have monopoly power over their respective sellers (they are the only access point), yet in every equilibrium both earn zero profit. T1 connects to three buyers B1, B2, B2; T2 connects to fewer. In any equilibrium, the two asks to each buyer must be equal (otherwise the lower-asking trader could raise his ask), and if that common ask were positive, the trader not performing that specific sale could undercut. Therefore all bids and asks equal zero. The "threat is stronger than its execution" — T2's mere potential to compete with T1 on every buyer drives T1's profits to zero, even though T2 cannot actually perform all the trades.

  The formal condition: trader T has an essential edge e to node n if removing e would lower the social optimum. Equivalently, T profits (in some equilibrium) only when at least one of its connections is unique in enabling some flow of value. This is strictly stronger than having monopoly power over a single counterparty.

- **Key quote or example:** "A version of this 'essentiality' principle is true; but it is a bit more subtle than it might initially appear... T1 fails to make a profit despite the fact that T2 can only perform one trade on his own... a situation in which 'the threat is stronger than its execution.'"
- **Connection:** Formalizes and explains why implicit perfect competition (Section 11.3) drives profits to zero, and provides the graph-theoretic bridge to understanding power in networks from the earlier structural chapters.

---

## 🔑 Key Takeaways

1. In intermediated markets, your price is determined by your alternatives — both the number of traders you can access and whether those traders face competition for your business.
2. A monopolist intermediary in a one-seller, one-buyer, one-trader network extracts 100% of the surplus; the unique equilibrium bids are 0 and asks are the buyer's full valuation.
3. When both a seller and a buyer can access two competing traders, those traders are driven to zero profit — competition eliminates the spread, though the buyer-seller surplus division remains indeterminate.
4. Implicit perfect competition can eliminate trader profits even when no two traders are direct competitors for the same buyer-seller pair; global network structure can transmit competitive pressure through chains of intermediaries.
5. Every equilibrium in a trading network achieves the socially optimal allocation of goods — self-interested intermediaries, despite extracting rents, do not cause allocative inefficiency relative to what the network allows.
6. The second-price auction rule emerges naturally as the equilibrium of a specific trading network, confirming it is not an arbitrary auction design but a fundamental outcome of competitive intermediation.
7. Adding a single edge to a trading network can have dramatic non-local ripple effects: a buyer who previously traded may be cut out entirely when a distant seller-trader link is formed.
8. A trader can profit (in some equilibrium) only if it has an "essential edge" — a connection whose removal would reduce the maximum social welfare achievable on the network. Monopoly power alone is not sufficient.
9. Network bottlenecks constrain social welfare: more richly connected networks allow higher total gains from trade by enabling goods to reach higher-value buyers.
10. The "threat is stronger than its execution": a trader who can only perform a subset of the trades may still discipline a larger competitor into zero profits, simply by being available as an alternative.

---

## 🗺️ Mental Model / Framework

Think of a trading network as a system of pipes and valves. Goods (water) flow from sources (sellers) to destinations (buyers) through pumping stations (traders). Each pumping station charges a toll for the flow that passes through it.

The toll a station can charge depends entirely on whether the water has another route. If only one pipe leads from a source to a destination, the pumping station on that pipe is a monopolist and can charge the full pressure differential. If two parallel pipes connect the same source and destination, the two pumping stations compete and the toll drops to zero — but the water still flows.

The subtle part: even if no two pipes are exactly parallel, competition can still propagate. If pumping station A serves destination D1 and could also serve destination D2 (currently served by station B), then B cannot charge much for D2 — A's mere existence as a potential competitor holds B's toll down. This is "implicit perfect competition."

Essentiality is the key question: if you removed one specific pipe section, would less water reach high-value destinations? If yes, the station on that pipe section can earn a toll in some equilibrium. If every drop of high-value water would still reach its destination through alternate routes, the station earns nothing regardless of its apparent position.

The efficiency result says: despite all this toll extraction, the total water that flows, and where it flows, is always as good as the network's connectivity permits. The pumping stations take their cut, but they don't waste any flow.

---

## "Aha!" Moments

1. **Monopoly power is not the same as profit power.** Figure 11.13 demonstrates that a trader can have monopoly access to its sellers — no other trader connects to them — and still earn zero profit in every equilibrium. The reason is that competition can occur not on the supply side but on the demand side: if the trader's potential buyers can also be reached by another trader, that other trader's mere existence as a threat eliminates the profit. The "threat is stronger than its execution." This reframes what competition means: it is not about who actually performs a trade, but about who could.

2. **Adding a link can hurt you even if it's nowhere near you.** In the ripple-effects example, Buyer B1 loses access to the good entirely when Seller S2 forms a new link to Trader T2 — a connection between two parties neither of whom is B1's neighbor. The mechanism is that this new link breaks a bottleneck in the network, allowing higher-value buyers (B3 and B4) to now be served, crowding out B1. This is deeply non-intuitive: more connections in a market can harm some existing participants by enabling better matches elsewhere.

3. **The second-price auction is not a clever invention — it is what equilibrium looks like.** Economists treat Vickrey's second-price auction as a special, engineered mechanism designed to induce truthful bidding. But when you model an auction as a trading network where each buyer has a proxy trader, the second-price outcome falls out of the competitive equilibrium without any special design. The rule is simply what rational intermediaries do when they compete. This suggests the second-price mechanism is less a clever invention and more a natural law of competitive intermediation.

---

## 🔗 Connections to Other Chapters

**Building on Chapter 10 (Matching Markets):** Chapter 10 established market-clearing prices on bipartite buyer-seller graphs and proved their existence and efficiency. Chapter 11 extends that model by inserting an intermediate layer of traders between buyers and sellers, making the network tripartite. The efficiency result (every equilibrium achieves the social optimum) directly parallels Chapter 10's result that market-clearing prices maximize total valuation. The preferred-seller graphs of Chapter 10 are replaced here by a fixed network structure, reflecting real-world constraints rather than price-driven preferences.

**Building on Chapter 9 (Auctions):** The second-price sealed-bid auction from Chapter 9 — where truth-telling is dominant and the item goes to the highest bidder at the second-highest price — reappears here as a natural network equilibrium. The procurement auction analog (buyer runs a second-price auction among sellers) also connects: in that case sellers bid their true costs, just as here sellers accept bids at their true valuations.

**Building on Chapter 6 (Nash Equilibrium):** The equilibrium concept used is subgame perfect Nash equilibrium, a refinement from Chapter 6's sequential-game discussion (Section 6.10). The two-stage structure (traders post prices first; buyers and sellers respond second) requires backward induction. Buyers and sellers are effectively reduced to "drones" in the second stage since their best response is trivially to pick the best offer.

**Setting up Chapter 22 (Information in Markets):** The chapter explicitly notes that the network model ignores how bids, asks, and trades convey information about underlying asset values. A large buy order in the stock market signals that the stock may be undervalued, causing other traders to jump in and drive the price up. This informational dimension — how beliefs update based on market activity — is the subject of Chapter 22.

**Connecting to Network Formation Literature:** The ripple-effects analysis raises the question of when it is rational for nodes to invest in forming new links. This points toward the broader endogenous network formation literature, where agents weigh the costs of creating links against the payoff improvements they generate.

---

## 📝 In My Own Words (ELI5)

Imagine you live in a village and you want to sell your homegrown apples. You can't just walk into a big city store — you have to sell them to a trader who comes to your village and then resells them in the city. The trader buys low from you and sells high to city folks, keeping the difference as profit.

How much of that price difference can the trader keep? That depends entirely on how many traders you can choose from.

If only ONE trader ever comes to your village, that trader knows you have no alternative. They'll offer you almost nothing for your apples and charge city buyers almost everything. They pocket the entire profit. This is monopoly.

But if TWO traders come to your village, and two different city buyers can also choose between those same two traders, something interesting happens. If Trader 1 is making a fat profit on the deal, Trader 2 can swoop in and offer you a slightly better price and the city buyer a slightly lower price, stealing the deal. Trader 1 then has to match that offer. They keep competing until neither trader makes any profit — the full benefit just goes to you and the city buyer. This is competition.

Now here's the really wild part: sometimes traders make zero profit even when they DON'T directly compete with each other for the same deal. The global shape of the trading network can create "ghost competition" that disciplines prices across many connected relationships.

And here's the most surprising finding of all: even when a trader has monopoly power (meaning it's the only trader a particular seller can access), that trader might STILL earn zero profit. Why? Because if that trader also competes with another trader for buyers, the other trader can threaten to undercut them — even if the other trader could never actually handle all the trades. The threat alone is enough to destroy the profit.

One more thing: when you add a new trading relationship anywhere in the network, it can hurt people who aren't even involved. Like if a new road connects one farmer to a distant city, suddenly traders can route high-value goods along that new path, and buyers in the original city who used to get cheap apples might suddenly lose their supply. Changes ripple outward.

But despite all this complexity and all the profits traders extract, the total social good — meaning who ends up with the apples — is always as efficient as the network allows. The right apples always end up with the people who want them most, given who can actually connect to whom. The traders fight over their share of the pie, but they never shrink the pie.
