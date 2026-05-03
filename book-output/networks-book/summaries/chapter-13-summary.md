# Chapter 10: Matching Markets

## 🧠 Core Thesis
Matching markets — where buyers and sellers with heterogeneous preferences are paired up — can always be resolved by a set of market-clearing prices that simultaneously eliminate contention among buyers and produce socially optimal (welfare-maximizing) outcomes, without any central planner needing to know everyone's preferences in advance.

## 📖 Detailed Breakdown

### Bipartite Graphs as Market Structure
- **What it is:** A bipartite graph is a network whose nodes fall into two distinct categories (e.g., students and dorm rooms, buyers and sellers), with every edge connecting one node from each category. No edges exist within a category. In the matching market model, an edge between a student and a room means the student finds that room acceptable.
- **Why it matters:** It provides the mathematical skeleton for every matching market. Real-world allocation problems — housing, job markets, school assignments — all have this two-sided structure embedded in them.
- **How it works:** Each person lists acceptable options. The graph encodes these lists: one column for people, one for objects, edges only crossing between columns. Visually, it is always drawn as two vertical columns with edges crossing the gap between them.
- **Key example:** Five students (Vikram, Wendy, Xin, Yoram, Zoe) and five rooms. Vikram lists Rooms 1, 2, and 3 as acceptable; Wendy lists only Room 1. The resulting bipartite graph captures all of this simultaneously in a single drawing.
- **Connection:** This same bipartite structure was used in Chapter 4 to model affiliation networks (people connected to activities). Here it is repurposed to model who can be paired with whom.

### Perfect Matchings
- **What it is:** A perfect matching is an assignment of every node on one side of a bipartite graph to a distinct node on the other side, such that each assigned pair is connected by an edge. No node appears in more than one pair, and every node is paired.
- **Why it matters:** It is the formal definition of "everyone gets something they are willing to accept, and no two people get the same thing." It is the goal of every allocation problem modeled this way.
- **How it works:** Select a subset of edges so that each node is the endpoint of exactly one chosen edge. In the dorm room example, Figure 10.1(b) shows one such selection: the darkened edges form a perfect matching where each student gets a distinct room on their acceptable list.
- **Key example:** In Figure 10.1(b), the matching assigns Vikram to Room 2, Wendy to Room 1, Xin to Room 3, Yoram to Room 4, and Zoe to Room 5 — a valid perfect matching.
- **Connection:** Perfect matchings generalize directly to the optimal assignment problem once preferences become numerical rather than binary.

### Constricted Sets and the Matching Theorem
- **What it is:** A constricted set S is a set of nodes on one side of the bipartite graph whose collective neighborhood N(S) — the set of all nodes on the other side connected to at least one node in S — is strictly smaller than S itself. In other words, a group of people collectively only find acceptable fewer options than there are people in the group.
- **Why it matters:** A constricted set is the precise, checkable reason why a perfect matching cannot exist. Rather than exhausting all possible assignments, you can prove impossibility by exhibiting a single constricted set.
- **How it works:** Identify a set S of people. Count all the rooms any of them would accept (that is N(S)). If |S| > |N(S)|, S is constricted and no perfect matching exists — by the pigeonhole principle, at least one person must go unmatched.
- **Key example:** In Figure 10.2(b), the set {Vikram, Wendy, Xin} collectively lists only Rooms 1 and 2 as acceptable. Three people, two acceptable rooms — no assignment can work for all three.
- **The Matching Theorem (König 1931, Hall 1935):** The converse is also true: if a bipartite graph has no perfect matching, it must contain a constricted set. Constricted sets are not merely one obstacle; they are the only obstacle. This gives administrators a complete explanation in either direction: either announce the matching, or point to the constricted group of students who collectively listed too few rooms.
- **Connection:** The Matching Theorem is the theoretical foundation for the auction-based construction of market-clearing prices in Sections 10.3–10.4.

### Valuations and Optimal Assignments
- **What it is:** Rather than binary acceptable/unacceptable preferences, valuations assign each person a numerical score for each object, representing how much they value it (equivalently, the maximum they would pay). The quality of an assignment is the sum of all individuals' valuations for what they receive. An optimal assignment maximizes this sum.
- **Why it matters:** Numerical valuations make preferences richer and more realistic. They also generalize bipartite matching: if you set valuations to 1 for acceptable options and 0 for unacceptable ones, an optimal assignment (quality = number of students) exists if and only if a perfect matching exists. So bipartite matching is a special case of optimal assignment.
- **How it works:** Given a matrix of valuations (rows = buyers, columns = sellers), the optimal assignment is the one-to-one pairing of buyers to sellers that maximizes the total sum. In Figure 10.3, three students (Xin, Yoram, Zoe) and three rooms with valuations [12,2,4], [8,7,6], [7,5,2]: the optimal assignment sends Xin to Room 1, Yoram to Room 2, Zoe to Room 3 for a total of 12+7+2=21... but the figure shows Xin to Room 1 (12), Yoram to Room 3 (6), Zoe to Room 2 (5) for total 23, which is higher. The point is that the optimal assignment may not give everyone their top choice, but it maximizes collective welfare.
- **Connection:** Optimal assignment sets up the need for prices, addressed in Section 10.3.

### Prices, Payoffs, and the Preferred-Seller Graph
- **What it is:** Each seller i posts a price p_i for their house. A buyer j's payoff from buying house i is v_ij - p_i (valuation minus price). Each buyer acts in self-interest: she buys from whichever seller maximizes her payoff (provided that maximum payoff is non-negative). The preferred sellers of buyer j are those who maximize v_ij - p_i. The preferred-seller graph connects each buyer to all of her preferred sellers.
- **Why it matters:** This is the transition from a centrally-planned allocation to a decentralized market. Instead of a planner collecting everyone's data, prices signal scarcity and steer buyers toward different sellers through self-interest.
- **How it works:** For each set of prices, compute v_ij - p_i for every buyer-seller pair. Each buyer draws an edge to whichever seller(s) yield the maximum non-negative payoff. The resulting network is the preferred-seller graph. In Figure 10.5(b), prices (5, 2, 0) for sellers (a, b, c) produce a preferred-seller graph where buyer x prefers a (payoff 7), buyer y prefers b or c (tie at 5), and buyer z prefers b (payoff 6) — but this specific price vector actually creates a perfect matching.
- **Key example:** At prices (2, 1, 0), buyers x and z both prefer seller a, creating contention (Figure 10.5c). At prices (5, 2, 0), each buyer's self-interest leads her to a different seller, resolving contention automatically.
- **Connection:** The preferred-seller graph is the tool used to define market-clearing prices.

### Market-Clearing Prices
- **What it is:** A set of prices is market-clearing if the resulting preferred-seller graph contains a perfect matching. That is, buyers can be assigned to preferred sellers such that each buyer gets a different seller. Self-interest, guided by these prices, naturally eliminates all contention for houses.
- **Why it matters:** Market-clearing prices decentralize what would otherwise require a central computation. No planner needs to know everyone's valuations. Prices do the coordination work.
- **How it works:** Compute the preferred-seller graph. Check whether it has a perfect matching. Ties are allowed: if multiple sellers give a buyer the same maximum payoff, the buyer needs to choose one, but this can always be arranged to avoid conflict (tie-breaking). The formal definition: prices are market-clearing if the preferred-seller graph has a perfect matching.
- **The Existence Theorem:** For any set of buyer valuations, market-clearing prices always exist. This is non-obvious and is proven constructively via the auction procedure in Section 10.4.
- **The Optimality Theorem:** Any perfect matching in the preferred-seller graph arising from market-clearing prices achieves the maximum total valuation of any assignment. Proof: since every buyer maximizes her individual payoff, the matching M maximizes total payoff. Total payoff = total valuation minus the sum of all prices. Since the sum of prices is constant regardless of matching, maximizing total payoff is equivalent to maximizing total valuation. Equivalently, market-clearing prices plus a perfect matching in the preferred-seller graph maximize the total payoffs to all participants combined — sellers and buyers together.
- **Connection:** Market-clearing prices are constructed by the auction procedure in Section 10.4, which also proves their existence.

### Constructing Market-Clearing Prices: The Auction Procedure
- **What it is:** A multi-round iterative auction (due to Demange, Gale, and Sotomayor 1986, equivalent to a construction by Egervary 1916) that starts with all prices at 0 and raises prices for over-demanded sellers until a perfect matching emerges.
- **Why it matters:** It proves that market-clearing prices always exist (by constructing them), and it is itself a natural generalization of the single-item ascending-bid (English) auction to multi-item settings.
- **How it works (each round):**
  1. Start with current prices, with the smallest price equal to 0 (after a normalization reduction step if necessary).
  2. Construct the preferred-seller graph.
  3. If it has a perfect matching: stop — prices are market-clearing.
  4. If not: by the Matching Theorem, there is a constricted set of buyers S, whose neighbors N(S) are the sellers they prefer. The sellers in N(S) are "over-demanded" (more buyers want them than there are sellers in N(S)).
  5. Each seller in N(S) raises their price by one unit simultaneously.
  6. Reduce all prices by subtracting the minimum price so that the smallest price returns to 0.
  7. Repeat.
- **Key example (Figure 10.6):** Three buyers (x, y, z) and three sellers (a, b, c) with valuations as in Figure 10.5. Round 1: all prices 0, all buyers prefer a — constricted set is all buyers, N(S) = {a}, so a raises to 1. Round 2: x and z still prefer a — a raises to 2. Round 3: all buyers still form a constricted set with N(S) = {a, b}, so both a and b raise. After reduction: a=2, b=0, c=0. Round 4: preferred-seller graph has a perfect matching. Done.
- **Why it terminates (Potential Energy argument):** Define the potential of a buyer as the maximum payoff she can currently obtain from any seller. Define the potential of a seller as the price he is currently charging. The potential energy of the auction is the sum of all participants' potentials. Initially this is some finite value P_0. After the price-reduction step, potential energy is unchanged (seller potentials drop by p, buyer potentials rise by p). When sellers in N(S) raise prices by 1: each seller in N(S) gains 1 unit of potential (|N(S)| units gained). Each buyer in S loses 1 unit of potential (|S| units lost). Since |S| > |N(S)| strictly, the potential energy decreases by at least 1 per round. Since potential energy starts at P_0 and cannot go below 0, the auction must terminate within at most P_0 rounds.
- **Connection:** This procedure generalizes the single-item English auction (Section 10.5).

### Relationship to Single-Item Auctions
- **What it is:** A single-item ascending-bid (English) auction is a special case of the bipartite graph auction. To map it: one real seller (the item), n-1 fake sellers (representing "no purchase"), all buyers have valuation 0 for fake sellers and v_j for the real seller.
- **Why it matters:** It unifies two apparently different mechanisms — the English auction and the bipartite matching market — under one framework.
- **How it works:** Initially all buyers prefer the real seller (constricted set = all buyers, N(S) = real seller). The real seller's price rises by 1 each round. This continues as long as at least two buyers find the real seller their unique preferred seller. The moment the buyer with the second-highest valuation switches to preferring a fake seller (i.e., finds their payoff from the real seller is now 0 or tied with a fake seller), a perfect matching exists. The real seller is paired with the buyer with the highest valuation, at a price equal to the second-highest valuation. This is precisely the English auction outcome: winner pays second-highest bid.
- **Connection:** Bridges Chapter 9 (single-item auctions) with Chapter 10's general framework.

### Proof of the Matching Theorem via Alternating BFS
- **What it is:** The formal proof that if a bipartite graph has no perfect matching, it contains a constricted set. The proof uses the concept of alternating and augmenting paths, and a modified breadth-first search (alternating BFS).
- **Why it matters:** The proof gives a constructive, efficient algorithm to either find a perfect matching or identify a constricted set — far more efficient than brute-force enumeration.
- **Key definitions:**
  - Matching edges: edges currently in the matching. Non-matching edges: the rest.
  - Alternating path: a simple path that alternates between non-matching and matching edges.
  - Augmenting path: an alternating path whose two endpoints are both unmatched nodes. If such a path exists, swapping matching/non-matching edges along it enlarges the matching by one pair (both formerly unmatched endpoints become matched).
- **Alternating BFS procedure:** Start at an unmatched node W on the right-hand side (layer 0). Build layers: from right-side nodes (even layers), follow non-matching edges to discover left-side nodes; from left-side nodes (odd layers), follow only matching edges back to right-side nodes. If an unmatched left-side node is ever discovered, an augmenting path has been found. If the search exhausts without finding one, the set of all even-layer nodes (right-side nodes discovered, including W) forms a constricted set — their only neighbors are among the odd-layer (left-side) nodes, which are strictly fewer in number.
- **Why the failed search yields a constricted set:** After a failed alternating BFS from W:
  1. Even layers = right-side nodes; odd layers = left-side nodes.
  2. Each odd layer has exactly the same size as the subsequent even layer (because every left-side node discovered in the search is matched, and its matched partner sits in the next even layer).
  3. W is an extra node in layer 0, making the total even-layer count strictly larger than the total odd-layer count.
  4. Every right-side node in even layers has all its neighbors present in odd layers (because if a non-matching edge led somewhere new, it would have been discovered in the search).
  5. Therefore, the even-layer nodes form a constricted set: strictly more nodes than neighbors.
- **Computing a perfect matching efficiently:** Repeatedly apply alternating BFS from unmatched nodes. Each successful search enlarges the matching by 1. The process terminates in at most n steps (n = nodes per side). If a search fails, a constricted set is produced and we know no perfect matching exists. For maximum matching (not necessarily perfect), run alternating BFS from all unmatched right-side nodes simultaneously — make them all layer 0 nodes — and keep going.
- **Connection:** This section completes the theoretical foundations underlying the entire chapter.

## 🔑 Key Takeaways

1. Any allocation problem between two distinct groups (buyers/sellers, students/rooms, workers/jobs) can be modeled as a bipartite graph, making the rich mathematical theory of matchings immediately applicable.
2. The only reason a perfect matching fails to exist is a constricted set — a group of people who collectively listed fewer acceptable options than there are people in the group. This is both a necessary and sufficient condition (Matching Theorem).
3. When preferences are numerical (valuations), the goal shifts from feasible assignment to optimal assignment — maximizing the total value across all matched pairs.
4. Prices serve as a decentralizing mechanism: rather than a planner computing the optimal assignment, the right prices cause self-interested buyers to naturally sort themselves into the optimal assignment.
5. Market-clearing prices — prices under which no two buyers compete for the same preferred seller — always exist for any set of buyer valuations. Their existence is not a lucky accident; it is a mathematical guarantee.
6. Market-clearing prices produce socially optimal outcomes: the total valuation (and total payoff to all participants) is maximized. Individual greed, properly priced, achieves collective optimality.
7. The auction procedure (raise prices for over-demanded sellers, one round at a time) always converges to market-clearing prices in a finite number of steps, and the convergence is guaranteed by a "potential energy" argument showing that each round strictly drains a bounded reservoir.
8. The single-item English auction is a special case of the bipartite matching auction: the price rises until the second-most-interested buyer drops out, at which point the highest-valuation buyer wins at the second-highest valuation.
9. Augmenting paths (alternating paths between two unmatched nodes) are the constructive tool for growing a matching one step at a time, and alternating BFS finds them efficiently.
10. When alternating BFS fails to find an augmenting path, the failure itself is useful: the layers produced by the search contain a constricted set, providing a certificate that no perfect matching exists.

## 🗺️ Mental Model / Framework

Think of matching markets as a two-act play:

**Act 1 — Structure (the graph):** Draw the two sides of the market. Edges represent feasibility or preference. Ask: can everyone be matched? A perfect matching exists unless a "bottleneck group" (constricted set) collectively has too few options.

**Act 2 — Prices (the signal):** Now add numerical valuations and prices. Each buyer computes her payoff (valuation minus price) and gravitates toward whoever maximizes it. Prices are like water levels in a tank: raise the price of an over-demanded good and demand flows away from it. Market-clearing prices are exactly the water levels at which demand perfectly distributes itself across supply, with no two buyers "piling onto" the same seller.

The auction procedure is the physical process of finding equilibrium water levels. You start with everything flat (prices at 0), identify wherever demand is pooling (constricted set = over-demanded sellers), raise the water level there by one unit, and repeat. The pool of potential energy in the system drains monotonically, so the process must stop in finite time. When it stops, you have equilibrium — market-clearing prices and a socially optimal assignment delivered by self-interest alone.

## 💡 "Aha!" Moments

1. **Failure is informative, not just negative.** When a bipartite graph lacks a perfect matching, you might expect the proof to require checking every possible assignment — an exponentially large search. The Matching Theorem says no: the absence of a perfect matching is always witnessed by a single, easily-exhibitable constricted set. Impossibility has a compact proof. The same principle reappears when alternating BFS fails: the failure itself constructs the constricted set directly from the search tree.

2. **Prices and social optimality are the same thing.** It seems like prices are just a way for sellers to extract money — a redistribution mechanism, not an efficiency mechanism. But the chapter shows they are the same: market-clearing prices force buyers into self-interested choices that happen to be collectively optimal. The prices cancel out of the total welfare calculation (Total Payoff = Total Valuation - Sum of Prices; prices are constant), so maximizing individual payoffs is mathematically identical to maximizing total valuation. Greed, correctly priced, is socially efficient.

3. **The English auction is a shadow of a much larger theory.** The ascending-bid English auction feels like an ad-hoc rule ("keep raising the price until one bidder remains"). But it is secretly just one special case of a general bipartite graph auction applied to the degenerate case of a single real seller surrounded by fake ones. The price-raising logic, the termination condition (second buyer drops out), and the winner-pays-second-price rule all fall out automatically from the general theory without being assumed.

## 🔗 Connections to Other Chapters

- **Chapter 4 (Affiliation Networks):** Bipartite graphs were first introduced there to model people's membership in groups or activities. Chapter 10 reuses the same mathematical structure but gives it a market interpretation — edges now represent acceptable options or preferences rather than affiliations.
- **Chapter 6 (Game Theory / Social Optimality):** The notion of maximizing the sum of payoffs as a social welfare criterion was introduced in the context of games. Chapter 10 explicitly invokes this: the quality of an assignment is the sum of valuations, exactly the social welfare notion from Chapter 6. Market-clearing prices achieve this maximum.
- **Chapter 9 (Single-Item Auctions):** Chapter 9 analyzed ascending-bid (English) auctions for one item. Chapter 10 generalizes this to multi-item markets and then shows, in Section 10.5, that the English auction is a special case of the general bipartite graph auction procedure. Chapter 9's result (winner pays second-highest valuation) is re-derived automatically.
- **Chapter 12 (Network Exchange Theory):** The chapter explicitly previews that Chapter 12 will use matching-market interactions as a metaphor for social exchange more broadly, modeling power imbalances within social networks using the logic of who has how many alternatives in a market-like negotiation.

## 📝 In My Own Words (ELI5)

Imagine you are a school administrator trying to assign dorm rooms to students for the new year. Every student hands you a list of rooms they'd be happy with. Can you give every student a room they like, making sure no two students get the same room?

Draw it as a diagram: students on the left, rooms on the right, and draw a line between a student and a room whenever the student likes that room. You want to pick a set of lines so that every student is touched by exactly one line, and every room is touched by exactly one line. That is called a perfect matching.

Sometimes it's impossible. Why? Because maybe three students only like the same two rooms — there are three people fighting over two spots, and one person will always lose. That group of three students is called a "constricted set." The amazing thing is that constricted sets are the only reason a perfect matching can ever fail. If there is no constricted set hiding anywhere, a perfect matching always exists.

Now make it more realistic: instead of just "I like it or I don't," each student gives a score to each room (maybe 10 for a quiet corner room, 3 for a noisy one by the elevator). You want to assign rooms to maximize the total happiness (sum of all scores). This is the "optimal assignment."

Now add prices. Imagine sellers (landlords) each setting a price for their apartment. A buyer's "payoff" is their score for that apartment minus the price. Each buyer grabs whichever apartment gives the highest payoff. If prices are set just right — called "market-clearing prices" — then every buyer ends up wanting a different apartment, and no one is fighting anyone else.

Here is the key magic: these market-clearing prices always exist, no matter what the valuations are. And when buyers follow their self-interest under market-clearing prices, the assignment they collectively produce is the best possible assignment — the one that maximizes total happiness across everyone. No central planner needed. The prices do all the work.

How do you find these prices? Start with all prices at zero. Everyone piles onto the most popular apartment. The landlord of that apartment raises their price by one dollar. Some buyers switch away. Repeat. Eventually no one is fighting, and you have market-clearing prices. This process always stops — you can prove it because a certain quantity (like a "pressure gauge" measuring total potential benefit in the system) decreases by at least one unit every round and can never go below zero.

Bonus: the familiar auction where you keep raising the price until only one bidder remains? That is exactly this procedure, applied to the special case of just one real apartment and all the rest being fake "no-deal" options. The general theory reproduces the classic auction as a side effect.
