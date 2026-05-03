# Chapter 12: Bargaining and Power in Networks

## 🧠 Core Thesis
A node's power in a social network is not an intrinsic personal trait but a structural property arising from its position — specifically, from its ability to exclude others from valued exchanges — and this power can be precisely predicted using a mathematical framework built on the Nash bargaining solution and the concept of balanced outcomes.

## 📖 Detailed Breakdown

### Power as a Relational, Structural Property
- **What it is:** Power in a social network is not something a person simply "has." It is a property of a relationship between two people, determined by how much each depends on the other. The core question is not "who is powerful?" but "under what conditions does one person have power *over* another?" This insight comes from sociologist Richard Emerson's foundational work on power-dependence theory.
- **Why it matters:** This reframing moves us away from vague assertions about dominant personalities and toward a precise, structural analysis. It explains why the same person can be powerful in one relationship and weak in another.
- **How it works:** Each social relationship produces value for both parties (money, favors, emotional support). Power manifests as an imbalance in how that value is divided — the more powerful party captures more than half. If one party has multiple alternative relationships while the other has only this one, the party with alternatives holds power because they are less dependent.
- **Key quote or example:** In the five-node network where B connects to A, C, and D (who connects to E), node B is intuitively the most powerful. A and C have no other connections, making them completely dependent on B. B, by contrast, has three options.
- **Connection:** This structural conception of power motivates the entire mathematical apparatus of the chapter — network exchange theory, stability, and balance are all formal tools for making these intuitions precise.

### Four Sources of Network Power
- **What it is:** The chapter identifies four distinct principles that could explain why a central node like B holds power: Dependence, Exclusion, Satiation, and Betweenness.
- **Why it matters:** These four lenses provide multiple angles on power that are not always equivalent, and some (like betweenness/centrality) turn out to be misleading in certain exchange settings.
- **How it works:**
  - *Dependence:* A and C have only one source of social value (B), while B has multiple. High dependence on a single partner gives that partner power.
  - *Exclusion:* Under the 1-exchange rule (each node can complete a deal with only one neighbor per round), B can unilaterally choose to deal with A and exclude C, or vice versa. This threat of exclusion is a direct source of leverage.
  - *Satiation:* B accumulates value faster than A or C. Once satiated, B can demand a larger share to remain interested in maintaining the relationship.
  - *Betweenness:* B lies on paths between many pairs of nodes, making her a critical intermediary. However, the chapter shows that betweenness can be a misleading measure of power when the concern is pairwise bargaining asymmetries rather than information flow.
- **Key quote or example:** On the 5-node path A-B-C-D-E, node C has the highest betweenness (it lies between the most pairs), yet C is actually one of the weakest nodes because both B and D have attractive alternatives (A and E respectively). Betweenness predicted high power; the exchange experiment reveals near-zero power.
- **Connection:** The failure of betweenness motivates the search for a better formal model — the stability and balance framework developed later in the chapter.

### Network Exchange Experiments: The Laboratory Setting
- **What it is:** Researchers in network exchange theory operationalize "social value" using money in laboratory experiments. People are placed at nodes of a graph, a fixed dollar amount (typically $1) is placed on each edge, and participants negotiate via instant messaging over how to split that money. Crucially, the 1-exchange rule applies: each person can complete a deal with only one neighbor per round, so the set of completed deals forms a matching in the graph.
- **Why it matters:** The lab setting makes it possible to measure power precisely (as the fraction of money a node obtains) under controlled conditions, and to test whether informal principles about network position actually predict outcomes.
- **How it works:** The experiment runs for many rounds. Nodes left out of exchanges in a round tend to lower their asking price in subsequent rounds. This competitive pressure drives convergence toward stable, predictable splits. Experiments vary the information available to participants — high-information (everyone sees all negotiations in real time) vs. low-information (each person sees only their own edges). Remarkably, the outcomes barely differ between these conditions, suggesting the results are robust and driven by structural position, not information processing.
- **Key quote or example:** "The experimental results do not change much with the amount of information available... this suggests a certain robustness to the results."
- **Connection:** These experiments provide the empirical ground truth against which the formal models (stability, balance) are validated throughout the rest of the chapter.

### Results on Path Networks: Strong Power, Weak Power, and Unstable Networks
- **What it is:** The four path networks of length 2, 3, 4, and 5 each illustrate distinct phenomena. The 3-node path exhibits *strong power* (the center captures roughly 5/6 of the value), the 4-node path exhibits *weak power* (the inner nodes capture about 2/3), and the 5-node path is a counterintuitive case where the central node is actually weak.
- **Why it matters:** These simple networks serve as the building blocks for understanding power in arbitrary networks. Real-world networks can often be understood by identifying which local structure each node resembles.
- **How it works:**
  - *2-node path (A-B):* Two people split $1. Theory and experiment agree on an approximately equal 1/2-1/2 split.
  - *3-node path (A-B-C):* B can exclude A and deal with C, or vice versa. At least one of A or C is always left out per round. Excluded nodes lower their demands in subsequent rounds, driving B's share up to approximately 5/6 in experiments.
  - *4-node path (A-B-C-D):* B can threaten to exclude A and go to C, but C already has D as an alternative. So B's threat is costly to execute — B must negotiate with C who is not desperate. B gets a moderate advantage (roughly 7/12 to 2/3) — this is *weak power*.
  - *5-node path (A-B-C-D-E):* C appears central but is actually weak. B and D both have attractive alternatives (A and E, who are endpoint nodes with no other options). So C's negotiating partners each have a "weak" fallback option that they can exploit, making C nearly as easy to exclude as A or E.
- **Key quote or example:** On the 5-node path: "C's partners for negotiation all have access to very weak nodes as alternatives, and this makes C weak as well."
- **Connection:** The 5-node path result is the key motivation for doubting betweenness as a measure of power, and for developing the balanced outcome framework that can predict subtle differences.

### The Triangle Network: When Outcomes Never Stabilize
- **What it is:** A three-node fully-connected graph (a triangle: A-B-C with edges A-B, B-C, A-C) is a pathological case where no stable outcome exists and negotiations never converge. Under the 1-exchange rule, only one exchange can happen per round, so one node is always left out entirely.
- **Why it matters:** It explains a distinct empirical finding — that some networks produce chaotic, unpredictable outcomes right up to the time limit — and connects this chaos to a structural property (the absence of any stable outcome), not irrationality or noise.
- **How it works:** Say A and B are close to reaching a deal. C, who stands to get nothing, will offer one of them highly favorable terms to break up the A-B negotiation. Say C offers A a great deal. Now B is left out and offers D highly favorable terms. This cycle continues indefinitely. The outcome depends arbitrarily on when the time limit hits. Note: a triangle embedded in a larger network (like the stem graph) does not necessarily cause instability, because additional nodes can provide a stable resolution.
- **Key quote or example:** "No matter what tentative agreement is reached, the system necessarily contains internal stress that will disrupt it."
- **Connection:** The formal explanation for the triangle's instability comes later when the stable outcomes framework reveals there is no stable outcome for this graph — a clean, satisfying theoretical explanation for the empirical chaos.

### Connection to Buyer-Seller Networks
- **What it is:** Exchange networks and the bipartite buyer-seller markets of Chapter 10 are mathematically equivalent when the exchange network is bipartite. The 1-exchange rule in exchange theory corresponds to each seller having only one unit of a good and each buyer wanting only one unit.
- **Why it matters:** It unifies two apparently different modeling frameworks, showing they are analyzing the same underlying phenomenon. It also adds a caveat: the translation only works for bipartite graphs (like path networks), not for non-bipartite ones (like the triangle or the stem graph).
- **How it works:** In the 4-node path, declare A and C as buyers and B and D as sellers. Give each seller one unit of a good and each buyer one unit of money. If B sells to A at price x, B gets x and A gets value 1-x (the good is worth 1 to A, and she paid x). This is identical to the exchange network split of $1 into x and 1-x. Furthermore, there is recent empirical evidence that human subjects behave differently depending on whether the same mathematical situation is described as a buyer-seller scenario vs. an exchange network — framing matters.
- **Connection:** This connection ties the analysis back to Chapter 10's matching markets and also reinforces that the insights from exchange experiments apply equally to real trading markets.

### The Nash Bargaining Solution
- **What it is:** A formal mathematical prediction for how two people with outside options will divide a shared surplus. If A has outside option x (what A gets if negotiations fail) and B has outside option y, and x + y ≤ 1 (otherwise no deal is possible), the Nash bargaining solution says each player gets their outside option plus half of the remaining surplus s = 1 - x - y. Specifically: A gets (x + 1 - y)/2 and B gets (y + 1 - x)/2.
- **Why it matters:** This formula is the building block for predicting outcomes in entire networks. Each pairwise negotiation within a network can be analyzed as a two-person bargaining problem where the "outside option" for each node is determined by what it could get by switching to a different neighbor.
- **How it works:** The surplus s = 1 - x - y is what remains after both parties secure their fallback values. Equal bargaining power means the surplus is split evenly — each gets their reservation value plus half the upside. This is also called the *equidependent* outcome in network exchange theory literature.
- **Key quote or example:** "Trying to ensure that you have as strong an outside option as possible, before the negotiations even begin, can be very important for achieving a favorable outcome."
- **Connection:** The Nash bargaining solution becomes the local rule governing each edge in the balanced outcome framework (Section 12.8), and it is derived from first principles in the game-theoretic model of Section 12.9.

### Status Effects on Bargaining
- **What it is:** Social status beliefs — independent of actual outside options — systematically distort bargaining outcomes. Experiments by sociologists gave college students false information about their partner's status (e.g., telling one subject their partner was a high-school dropout and the other that their partner was a graduate student). The subject perceived as higher-status obtained significantly better bargaining outcomes than predicted by pure Nash bargaining.
- **Why it matters:** It shows that the Nash bargaining model, while accurate as a baseline, abstracts away real psychological factors. Status affects both what people *claim* their outside options are and what they are *willing to accept*.
- **How it works:** Two systematic effects were observed: (1) people inflated their stated outside options when they believed their partner was lower-status, and deflated them when they believed their partner was higher-status; (2) people discounted the stated outside options of partners they believed to be lower-status. Both effects compound to give the perceived-high-status person a substantial advantage. The chapter notes this but sets it aside to focus on the simpler, status-free model.
- **Connection:** This is an important real-world caveat to the theoretical models; the chapter chooses to treat it as an additional factor that can be layered on later.

### The Ultimatum Game: Why Extreme Outcomes Don't Happen
- **What it is:** The Ultimatum Game is a two-person game in which Person A proposes how to split $1 between A and B, and B either accepts (both keep their shares) or rejects (both get nothing). The rational prediction is that A should offer B the minimum possible (1 cent) and B should accept any positive amount. In reality, people consistently deviate from this prediction.
- **Why it matters:** It explains a persistent gap between the extreme power-imbalance predictions of stability theory and what actually happens in exchange experiments with strong power nodes. The 3-node path theory says B should get everything, but experiments show splits like 5/6 - 1/6, not 1 - 0.
- **How it works:** In experiments, A typically offers about 1/3 of the total, and many people playing A offer an even split. Very unbalanced offers (e.g., 90-10) are frequently rejected, even though accepting means getting something rather than nothing. The explanation lies in complete payoff functions: B derives a negative psychological payoff from feeling cheated that outweighs the monetary gain. Since A anticipates this, A offers more to avoid rejection. Even with large sums of money at stake, this pattern holds across cultures.
- **Key quote or example:** "What the line of experiments on this topic have shown is simply that real people's payoffs are not well modeled by strict money-maximization. Even a robot will reject low offers if you instruct it to care about feeling cheated."
- **Connection:** The Ultimatum Game explains why the 5/6 outcomes on the 3-node path represent the most extreme power imbalance human subjects will enforce, rather than the theoretical 1-0. It also motivates thinking of stability as predicting direction, not the exact extreme.

### Stable Outcomes: Formal Definition
- **What it is:** An outcome of network exchange is a pair: (1) a matching specifying who exchanges with whom, and (2) a value for each node indicating their share. An outcome is stable if it contains no instability — where an instability is defined as an unmatched edge (X, Y) not in the current matching, such that the sum of X's current value and Y's current value is less than 1. In other words, there is no edge where both endpoints could do better by switching to each other.
- **Why it matters:** Stability is the fundamental equilibrium concept for network exchange. It captures the idea that no pair of connected nodes has both the opportunity and the incentive to disrupt the current arrangement. Outcomes without instabilities are self-enforcing.
- **How it works:** Consider the 3-node path A-B-C with outcome (1/2, 1/2, 0): A and B exchange and split equally, C gets nothing. This is unstable because the unmatched edge B-C has values summing to 1/2 < 1 — B and C could split $1 between them and both benefit. Now consider outcome (0, 1, 0) where B gets everything: the edges A-B and B-C each have values summing to 1 (0 + 1 = 1), so neither A nor C can offer B a deal that improves on what B currently has. This is stable. For the triangle, every outcome leaves one node with value 0 and that node always has an edge to a node getting less than 1, creating an instability — hence no stable outcome exists.
- **Key quote or example:** "Instability: Given an outcome consisting of a matching and values for the nodes, an instability in this outcome is an edge not in the matching, joining two nodes X and Y, such that the sum of X's value and Y's value is less than 1."
- **Connection:** Stability is necessary but not sufficient — many outcomes on the 4-node path are stable, including some that don't match experimental results. This motivates the stronger concept of balanced outcomes.

### Balanced Outcomes: Refining Stability with Nash Bargaining
- **What it is:** A balanced outcome is a stable outcome in which, for each matched edge, the division of the dollar represents the Nash bargaining outcome given the best outside options each node can obtain from the rest of the network. The outside option of a node is determined by how much money it would need to offer an alternative neighbor to "steal" that neighbor away from their current partnership.
- **Why it matters:** Balance eliminates the ambiguity of stability. It selects the unique outcome (or a much smaller set of outcomes) that is self-consistent: the values you receive determine your outside options, which in turn determine what the Nash bargaining solution prescribes for each edge, which must yield the same values you started with. This self-referential consistency is what makes balanced outcomes elegant and predictive.
- **How it works:** On the 4-node path A-B-C-D (where A-B and C-D are the matched edges):
  - Under the all-1/2 outcome (Figure 12.8a), B's outside option is 1/2 (she could offer C a tiny bit over 1/2 to steal C from D). C's outside option is also 1/2. But the Nash bargaining solution given outside options of 1/2 each would require each to get (1/2 + 1 - 1/2)/2 = 1/2. So the all-1/2 outcome is stable but the outside options should equal 1/2, yet the matching already splits 1/2 - 1/2 — this is internally consistent but is revealed as NOT balanced because B and C are getting exactly their outside options with no surplus, meaning they are being "out-negotiated."
  - Under the 1/3 - 2/3 outcome (Figure 12.8b), B's outside option is 1/3 (to steal C from D, B must offer C more than 2/3, keeping 1/3 for herself). The Nash bargaining outcome for A-B with outside options 0 and 1/3 is: A gets (0 + 1 - 1/3)/2 = 1/3, B gets (1/3 + 1 - 0)/2 = 2/3. This matches. The same holds symmetrically for C-D. This outcome is balanced.
  - Every balanced outcome is stable, but not every stable outcome is balanced.
- **Key quote or example:** On the stem graph (A-B with B also connected to C and D, where C and D are connected): the balanced outcome gives B a 3/4 - 1/4 split with A. This correctly predicts that B has slightly more power in the stem graph than in the 4-node path, capturing a subtle structural difference.
- **Connection:** Balanced outcomes correspond to the *kernel solution* in cooperative game theory. They require that a stable outcome exist (which fails for the triangle), and when they exist they uniquely or near-uniquely pin down the experimental results. The concept also has a competitor theory called equiresistance that achieves similar predictions.

### Game-Theoretic Foundation: The Rubinstein Bargaining Game
- **What it is:** Section 12.9 provides a deep derivation showing that the Nash bargaining solution is not just an axiom but emerges as the equilibrium of a strategic game. The model (due to Rubinstein, 1982, later analyzed by Binmore, Rubinstein, and Wolinsky) formalizes bargaining as an infinite-horizon alternating-offers game where A and B take turns proposing splits, negotiations may break down with probability p after each round, and each player falls back on outside options x and y if breakdown occurs.
- **Why it matters:** It gives the Nash bargaining solution a solid game-theoretic foundation. Rather than simply asserting "equal splits of the surplus," it derives this as the unique subgame-perfect equilibrium outcome when the breakdown probability becomes small.
- **How it works:** The key technical tool is *stationary strategies* — each player always proposes the same split when it is their turn and always accepts any offer meeting their reservation amount. This reduces the infinite game to four equations:
  - b_1 = b-bar (A offers B exactly B's reservation amount)
  - a_2 = a-bar (B offers A exactly A's reservation amount)
  - b_1 = py + (1-p)b_2 (B is indifferent between accepting now and risking breakdown to get b_2 later)
  - a_2 = px + (1-p)a_1 (A is indifferent between accepting now and risking breakdown to get a_1 later)

  Solving these four equations gives:
  - a_1 = [(1-p)x + 1 - y] / (2-p)
  - b_1 = [y + (1-p)(1-x)] / (2-p)

  As p approaches 0 (breakdown becomes unlikely, negotiations can continue indefinitely), these converge to a_1 = (x + 1 - y)/2 and b_1 = (y + 1 - x)/2, which are precisely the Nash bargaining payoffs. The key insight is that when breakdown is rare, neither player gains advantage from proposing first — the symmetry leads to equal surplus splitting.
- **Key quote or example:** The two-period version provides the intuitive foundation: when p = 1/2 exactly, A proposes (1-z, z) in period 1 where z = py + (1-p)(1-x), and z equals exactly the Nash bargaining allocation for B. So the Nash solution arises from a two-round negotiation that ends after the first round with probability 1/2.
- **Connection:** This section closes a logical loop: the chapter started with informal intuitions, built experimental evidence, developed Nash bargaining as a prediction principle, used it to construct balanced outcomes, and now shows Nash bargaining itself can be rigorously derived from a game-theoretic model. The whole framework is internally consistent.

## 🔑 Key Takeaways

1. Power is a structural, relational property — it belongs to positions in networks, not to people intrinsically. The same individual can be powerful or weak depending on which relationship and which network they are embedded in.

2. The ability to exclude others from exchanges is the most direct source of network power. Under the 1-exchange rule, a node that can credibly threaten to walk away and exchange with someone else holds leverage.

3. Centrality measures like betweenness are misleading guides to power in exchange networks. The central node on a 5-node path is weak because its neighbors have access to weak alternatives, contaminating them with weakness.

4. Strong power (3-node path center gets ~5/6) and weak power (4-node path inner nodes get ~2/3) are distinct empirical phenomena explained by whether a node's threat to exclude is costly to execute.

5. Some network structures — like the freestanding triangle — have no stable outcome at all. This structural property directly explains why negotiations in such networks never converge.

6. The Nash bargaining solution predicts that two people with equal bargaining power will each receive their outside option plus half the remaining surplus. Strengthening your outside option before negotiations begin is the most reliable way to improve your outcome.

7. Human subjects systematically reject extremely unfavorable offers even at personal cost (Ultimatum Game). Real exchange outcomes will not reach the theoretical extreme (0-1 splits) — powerful nodes capture large but not total shares, typically around 5/6 rather than 1.

8. Balanced outcomes refine stable outcomes by requiring internal consistency: each exchange must represent the Nash bargaining solution given the outside options that the network's current values imply. This self-referential condition pins down the unique outcome that experiments confirm.

9. The Nash bargaining solution is not just an axiom — it emerges as the equilibrium of a strategic alternating-offers game as the probability of breakdown per round approaches zero. The theory has first-principles foundations.

10. Framing matters: mathematically equivalent buyer-seller situations and exchange-network situations produce different behavior in human subjects, suggesting that the psychological context of negotiation shapes outcomes beyond pure structural position.

## 🗺️ Mental Model / Framework

Think of network exchange as a job market where each "worker" (node) can accept only one job offer and each "employer" (node) can hire only one worker, and every matched pair splits a fixed bonus. A node's power is entirely determined by one question: **"If I walk away from this deal, how good is my best alternative, and how good is my partner's best alternative?"**

The framework works in three layers:

**Layer 1 — Structural Position:** Draw the network. Ask for each edge: if this exchange were cancelled, what is each endpoint's next-best option? A node with many neighbors and neighbors who have few other options is powerful. A node whose neighbors each have attractive alternatives is weak, regardless of how many edges that node has.

**Layer 2 — Stability:** An outcome (who exchanges with whom, and at what split) is stable if no two connected nodes can jointly benefit by switching to each other. This rules out obvious deviations but allows too many outcomes in some networks.

**Layer 3 — Balance:** Among stable outcomes, the unique self-consistent one is where each matched edge's split equals the Nash bargaining solution given the outside options implied by the full outcome. This is a fixed-point condition: the values determine the outside options, the outside options determine the Nash bargaining splits, and those splits must reproduce the original values. When this fixed point exists, it closely matches what experiments observe.

The mental model for when no stable outcome exists: if every possible arrangement leaves at least one connected pair of nodes collectively holding less than $1, then excluded nodes can always tempt one member of any pair to switch — the network churns forever.

## 💡 "Aha!" Moments

**1. Being central does not mean being powerful.** The node at the center of a 5-node path has the highest betweenness centrality — it lies on the path between more pairs than any other node. Yet it ends up being nearly the weakest node in exchange experiments. The reason is devastating in its simplicity: its neighbors each have a "weak" endpoint to threaten it with. Power flows not from how many people you connect, but from whether the people who depend on you have anywhere else to go, and from whether the people you can threaten have nowhere better to go than to you.

**2. The Nash bargaining solution arises spontaneously from strategic reasoning, not fairness.** The 50-50 split of surplus between two parties with equal outside options looks like a fairness norm. But it actually emerges as the unique strategic equilibrium of a game where two fully self-interested rational players alternate making offers under the threat of breakdown. No one is trying to be fair — the equal split is forced by the symmetry of the strategic situation. Fairness and rational self-interest converge to the same outcome.

**3. Rejecting money makes you richer in the long run.** The Ultimatum Game shows that rational money-maximization predicts accepting any positive offer, yet people regularly reject offers of 10-20% of the total. This is not irrational once you recognize that payoffs include psychological components. More practically: in repeated social interactions, a reputation for rejecting low offers changes what you get offered in future negotiations. The "irrational" rejection today is the "rational" investment for tomorrow. The chapter frames this as a payoff modeling problem, but the deeper implication is that social emotions are a strategic technology.

## 🔗 Connections to Other Chapters

**Building on Chapter 10 (Matching Markets):** The 1-exchange rule directly corresponds to matching in bipartite graphs. Stable outcomes in exchange networks parallel stable matchings — the concept of no two nodes having both the opportunity and incentive to deviate echoes the stability condition in matching theory. The buyer-seller equivalence in Section 12.4 makes this connection explicit.

**Building on Chapter 11 (Trading Networks):** Chapter 11 analyzed how node position affects prices and profits in buyer-seller chains. Chapter 12 takes this further by handling non-bipartite networks and by developing the sociological perspective. The observation that perfect competition between traders eliminates profits but doesn't determine the buyer-seller split directly motivates this chapter's search for a richer framework.

**Building on Chapter 6 (Game Theory — Multiple Equilibria):** The problem of multiple equilibria plaguing exchange networks in certain configurations (like the 4-node path having many stable outcomes) is the same issue Chapter 6 identified: when there are multiple equilibria, additional principles are needed to select among them. Balanced outcomes serve as that selection criterion.

**Building on Chapter 6, Section 10 (Dynamic Games):** The Rubinstein bargaining game in Section 12.9 is explicitly an infinite-horizon dynamic game. The subgame perfect equilibrium concept, introduced in Chapter 6, is the solution concept applied here to derive the Nash bargaining outcome.

**Building on Chapter 3 (Structural Holes and Betweenness):** Section 3.5 introduced structural holes and betweenness as measures of power. Chapter 12 provides a crucial corrective: betweenness captures power in information-flow contexts but can be actively misleading in exchange contexts where the 1-exchange rule applies.

**Setting up future work:** The framework of balanced outcomes connects directly to cooperative game theory (the core and kernel solutions), opening the door to a richer body of theory. The open research question of how these predictions scale to large, complex networks is flagged as ongoing work.

## 📝 In My Own Words (ELI5)

Imagine you and your friends are playing a game at school. Every day, each person can make a deal with exactly one friend, and if you make a deal, you and your friend share $1. Now, the interesting question is: who gets more than 50 cents, and who gets less?

Here is the secret: the person with more choices wins.

Say you have three people in a line: Amy — Bob — Carla. Bob is in the middle. Every day, Bob gets to pick: deal with Amy, or deal with Carla. Whoever Bob doesn't pick gets nothing that day. So Amy and Carla are desperate — they need Bob. But Bob doesn't need either of them specifically. So Bob gets most of the money — experiments show Bob gets about 83 cents and whoever he picks gets about 17 cents. That's what the book calls "strong power."

Now add a fourth person at the end: Amy — Bob — Carla — Dave. Now Bob can still ignore Amy and go to Carla, but if he does, Carla already has Dave as her option. Carla is not desperate anymore. Bob still has some advantage over Amy (Amy has nowhere else to go), but his threat to switch to Carla is weaker. Bob gets something like 65 cents instead of 83. That's "weak power."

Now imagine five people in a line: Amy — Bob — Carla — Dave — Emma. Carla is in the exact center. You might think Carla is powerful because she connects the most people. But look at it from Carla's view: her only options are Bob and Dave. And Bob has Amy (who is desperate), and Dave has Emma (who is desperate). So both Bob and Dave have a weak alternative person — and that makes them comfortable walking away from Carla. Carla ends up almost as weak as Amy or Emma. This is the big surprising result: being central doesn't mean being powerful.

How do we predict exactly who gets what? The trick is a formula called the Nash bargaining solution. When two people negotiate, if they each have a "backup plan" (outside option), they each keep their backup and then split the extra leftover equally. So if Alice's backup is worth 30 cents and Bob's backup is worth 20 cents, there's 50 cents left over (100 - 30 - 20 = 50), and they each get half, so Alice gets 30 + 25 = 55 cents and Bob gets 20 + 25 = 45 cents.

In a network, everyone's "backup" is determined by the best deal they could pull off with a different neighbor. This creates a puzzle: your backup depends on what other people are getting, and what other people are getting depends on your backup. The solution that is consistent — where each person's backup value is exactly justified by what they'd get switching to their best neighbor — is called a *balanced outcome*, and it closely matches what happens when real people play the game in the lab.

One last thing: you might wonder, why doesn't the most powerful person take absolutely everything? Because real people refuse unfair deals even when it costs them money. In an experiment called the Ultimatum Game, if you are given $10 and you offer your partner just $1, your partner will often say "no deal" and you both get nothing. People are willing to pay to punish unfairness. So powerful nodes in exchange networks get a large slice — but not quite everything.
