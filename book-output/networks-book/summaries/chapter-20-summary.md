# Chapter 15: Sponsored Search Markets

## Core Thesis
Every time you search on Google and see ads, a real-time auction is being conducted — and the design of that auction determines who sees which ad, at what price, and whether the market operates efficiently. This chapter reveals that keyword advertising is a matching market whose auction mechanisms range from the theoretically ideal (VCG, which makes truth-telling dominant) to the practically adopted (GSP, which is simpler but induces strategic, often untruthful, and sometimes socially suboptimal bidding).

---

## Detailed Breakdown

### Advertising as a Matching Market

- **What it is:** The search engine owns a set of advertising "slots" on a results page, numbered 1, 2, 3, ... from the top. Each slot has a *clickthrough rate* — the number of clicks per hour an ad placed there will receive. Higher slots get more clicks. Each advertiser has a *revenue per click* — how much money, on average, they earn each time a user clicks their ad and visits their site. The advertiser's total value for a slot is the product of these two numbers: clickthrough rate × revenue per click. This structure maps perfectly onto a matching market from Chapter 10, with slots as sellers and advertisers as buyers.
- **Why it matters:** By recognizing this structure, the entire mathematical machinery of matching markets — market-clearing prices, preferred-seller graphs, social optimality — can be imported directly. The market for a single keyword becomes a matching problem solvable with known tools.
- **How it works:** If slot i has clickthrough rate r_i and advertiser j has revenue per click v_j, then advertiser j's valuation for slot i is v_ij = r_i × v_j. These valuations have a special structure: all buyers agree on their *ranking* of items (higher clickthrough slots are always preferred by everyone), and the valuations of any one buyer are a simple scalar multiple of any other buyer's valuations. This means the socially optimal assignment always gives the highest-clickthrough slot to the advertiser with the highest revenue per click, the second slot to the second-highest, and so on — a clean rank-order matching. Fictitious slots of clickthrough rate 0 (or fictitious advertisers of value 0) can be added to equalize the counts when buyers and sellers differ in number.
- **Key example:** Three slots with clickthrough rates 10, 5, 2; three advertisers with revenues per click of 3, 2, 1. The matching market has valuations: advertiser x for slot a = 30, for slot b = 15, for slot c = 6; advertiser y: 20, 10, 4; advertiser z: 10, 5, 2. The socially optimal matching gives slot a to x, b to y, c to z (total valuation = 30+10+2 = 42, the maximum).
- **Connection:** Directly applies the matching market theory from Chapter 10; sets up the need for a price-setting mechanism that works even when valuations are private.

---

### Market-Clearing Prices in the Advertising Context

- **What it is:** A set of prices for slots such that, when each advertiser evaluates their payoff (valuation minus price) for each slot, they each prefer a different slot — and the resulting assignment is a perfect matching. The market "clears" in the sense that supply meets demand without conflict.
- **Why it matters:** Market-clearing prices ensure that the assignment is stable: no advertiser wishes they were in a different slot given current prices. They also maximize total buyer valuation (a theorem inherited from Chapter 10).
- **How it works:** Using the preferred-seller graph construction: each advertiser draws an edge to whichever slot(s) give them the highest payoff (valuation minus price). Prices are market-clearing if this graph has a perfect matching. In Figure 15.3(b) with prices 13, 3, 0 for slots a, b, c: advertiser x prefers slot a (payoff = 30 - 13 = 17), y prefers slot b (payoff = 10 - 3 = 7), z prefers slot c (payoff = 2 - 0 = 2). Each prefers a different slot — perfect matching.
- **Key limitation:** Computing market-clearing prices requires the search engine to *know* advertiser valuations. In practice, valuations are private. This motivates the need for auction mechanisms that elicit truthful reporting.
- **Connection:** Connects to Chapter 10's auction procedure (the ascending-price English auction generalization); contrasts with VCG prices introduced next.

---

### The VCG Principle: Charging for Harm Done to Others

- **What it is:** The Vickrey-Clarke-Groves (VCG) mechanism is a price-setting procedure for matching markets that makes truthful reporting of valuations a *dominant strategy* — that is, truth-telling is at least as good as any other strategy regardless of what everyone else does. It generalizes the second-price auction from single items (Chapter 9) to multi-item matching markets.
- **Why it matters:** Early search advertising used first-price auctions, which led to massive bid-shading (advertisers reporting far below true values), constant incremental bid adjustments, and turbulent, unstable markets. A mechanism that elicits truthful bids is enormously valuable: it stabilizes the market and allows the search engine to compute socially optimal allocations based on reliable information.
- **How it works:** The core insight is a reinterpretation of the second-price auction. In a standard second-price auction, the winner pays the second-highest bid — which is precisely the *harm* they cause to others by winning (buyer 2 is the one who loses value, and that loss equals the second-highest bid). VCG generalizes this: each buyer pays a price equal to the total improvement all other buyers would achieve if this buyer simply were not present. Formally, if buyer j receives item i under the optimal matching, the VCG price is:

  p_ij = V^S_{B-j} - V^{S-i}_{B-j}

  where V^S_{B-j} is the maximum total valuation achievable by all other buyers when j is absent (and all items available), and V^{S-i}_{B-j} is the maximum total valuation by all others when both j and item i are removed. The difference is the incremental value the rest of the world would gain if buyer j simply did not exist — the harm buyer j causes by taking item i.

- **Key example (Figure 15.4):** Three advertisers x, y, z; three slots a, b, c. Optimal matching: x gets a, y gets b, z gets c. VCG price for x: without x, y would move up to slot a (gaining 20-10=10) and z would move up to slot b (gaining 5-2=3). Total harm from x = 13. VCG price for y: without y, x is unaffected (still gets slot a), z moves up to slot b (gaining 5-2=3). Total harm from y = 3. VCG price for z: without z, neither x nor y is affected. Harm = 0.
- **Connection:** VCG prices are *personalized* prices (depending on both buyer and item), unlike the *posted* market-clearing prices from Chapter 10. Both are linked — as Section 15.9 proves — but arise from different philosophical starting points.

---

### Truth-Telling is a Dominant Strategy Under VCG

- **What it is:** A formal proof that no buyer can gain by misreporting their valuations under the VCG procedure, regardless of what other buyers report.
- **Why it matters:** This dominant strategy property is the gold standard for mechanism design. It means advertisers don't need to model or predict what competitors are doing; they simply report their true values and the system handles the rest optimally.
- **How it works:** Suppose buyer j truthfully reports and is assigned item i with payoff v_ij - p_ij. If j lies and gets item h instead, the payoff is v_hj - p_hj. To show lying cannot help, we need v_ij - p_ij >= v_hj - p_hj. Expanding the VCG prices using equation 15.1 and simplifying, this reduces to showing:

  v_ij + V^{S-i}_{B-j} >= v_hj + V^{S-h}_{B-j}

  The left side equals V^S_B (the optimal matching with j getting item i, then optimally matching everyone else). The right side is at most V^S_B (it is the optimal value over the restricted set of matchings that force j to get h). Since the unrestricted optimum is always at least as large as any restricted optimum, the inequality holds. Crucially, the proof does not depend on what *other* buyers announce — the argument works for any announcements others make, confirming the dominant strategy property.

- **Key nuance:** VCG maximizes *total advertiser valuation* (social welfare), not search engine revenue. Whether VCG maximizes revenue is an open question — it is conceivable that a different mechanism extracts more revenue.
- **Connection:** This is the multi-item generalization of the insight from Chapter 9 that second-price auctions elicit truthful bidding.

---

### The Generalized Second Price (GSP) Auction

- **What it is:** The actual auction mechanism adopted by major search engines (developed initially at Google/Overture). Each advertiser j submits a single bid b_j (price willing to pay per click). Slots are awarded in decreasing order of bids: the i-th highest bidder gets slot i. The price each winner pays per click is the bid of the advertiser just below them (the (i+1)-th highest bid). Total cost for slot i = r_i × b_{i+1}.
- **Why it matters:** GSP is simpler to describe and implement than VCG. When there is only one slot, GSP and VCG are identical (both reduce to the second-price auction). But with multiple slots, they diverge significantly in their incentive properties.
- **How it works:** Advertisers are ranked by bid. The top bidder gets the best slot and pays the second-highest bid per click. The second bidder gets the second slot and pays the third-highest bid per click. And so on. This is a natural-seeming generalization of second-price, but it fails to retain the dominant strategy property.
- **Key pathology — truth-telling is not always an equilibrium:** In Figure 15.6, with slots of clickthrough rates 10 and 4, and advertisers x, y, z with values per click 7, 6, 1: if all bid truthfully, x wins slot a and pays 6 per click, for a total cost of 60 and a payoff of 70-60=10. But if x lowers its bid to 5, it gets slot b (the second slot) at a price of 1 per click, for a total cost of 4 and a payoff of 7×4 - 4 = 24. This is better, so truthful bidding is not a dominant strategy under GSP.
- **Multiple and non-optimal equilibria:** GSP can have multiple Nash equilibria for the same set of advertisers, and some of these equilibria produce socially non-optimal allocations (the advertiser with higher value does not get the top slot). The structure of sub-optimal equilibria is not fully understood.
- **Revenue comparison:** In the running example with two equilibria for GSP (bids 5,4,2 giving revenue 48; bids 3,5,1 giving revenue 34) and VCG giving revenue 44, GSP revenue can be either above or below VCG revenue depending on which equilibrium the bidders coordinate on.
- **Connection:** GSP is what Google and others actually use, making its analysis practically critical even if its theory is messier than VCG.

---

### Equilibria of GSP: A Positive Result

- **What it is:** Despite GSP's pathologies, there always exists at least one Nash equilibrium of GSP bids that produces a socially optimal assignment of advertisers to slots.
- **Why it matters:** This is the key positive result for GSP. Even though truth-telling is not a dominant strategy, the system is not fundamentally broken — strategic advertisers can settle into equilibria that produce good outcomes.
- **How it works:** The construction exploits market-clearing prices. Given any set of market-clearing prices p_1, p_2, ..., p_n for the matching market of advertisers and slots:
  1. Convert cumulative slot prices to per-click prices: p*_j = p_j / r_j.
  2. These per-click prices are decreasing (p*_1 >= p*_2 >= ... >= p*_n), which can be shown from the market-clearing condition (advertiser k prefers slot k to slot j even at slot j's lower clickthrough, implying slot j's per-click price cannot be lower).
  3. Set the bid of advertiser j (for j > 1) to p*_{j-1} (the per-click price of the slot just above), and set advertiser 1's bid to anything above p*_1.
  4. These bids produce the desired allocation (advertiser j gets slot j and pays p*_j per click).
  5. Verify Nash equilibrium: no advertiser wants to lower their bid (market-clearing ensures they don't prefer a cheaper lower slot at the price the lower advertiser is currently paying) and no advertiser wants to raise their bid (raising enough to take a higher slot would force them to pay *more* than the current per-click price of that slot, which market-clearing says they don't prefer).
- **Key insight:** The market-clearing condition is precisely what prevents any advertiser from profitably deviating up or down. The GSP equilibrium is "anchored" by market-clearing prices, establishing a deep connection between the two frameworks.
- **Connection:** Closes the loop back to Chapter 10's matching market theory; market-clearing prices are the structural backbone of both the VCG mechanism and GSP equilibrium analysis.

---

### Ad Quality Factors

- **What it is:** In real search engines (especially Google), the clickthrough rate is not a fixed property of a slot — it depends on which ad is placed there. Google assigns each ad a *quality factor* q_j, and the effective clickthrough rate when advertiser j is in slot i becomes q_j × r_i. Ranking and pricing are then based on the product q_j × b_j rather than b_j alone.
- **Why it matters:** A low-quality advertiser who bids very high can win a top slot but generate few clicks (users don't click irrelevant or untrustworthy ads). Since the search engine is paid per click, it makes less money even though it got a high bid. Quality factors correct this misalignment.
- **How it works:** The valuation of advertiser j for slot i changes from v_ij = r_i v_j to v_ij = q_j r_i v_j. Advertisers are ranked by q_j b_j (quality-adjusted bid). Each advertiser pays the minimum bid needed to keep their current position. The theoretical analysis — including the equilibrium construction for GSP — carries through with these new valuations.
- **Key opacity:** Search engines keep their quality factor formulas secret (analogous to how organic search rankings are secret). This gives the search engine nearly unlimited power to reorder advertisers for a given set of bids, making the market opaque from the advertiser's perspective.
- **Connection:** Generalizes the core model; introduces information asymmetry that changes the strategic environment significantly.

---

### Complex Queries and Keyword Interactions

- **What it is:** In practice, advertisers must manage bids across millions of keyword variations simultaneously. A company selling Swiss ski vacations might bid on "Switzerland," "Swiss hotels," "ski vacation," "Alps," "European ski vacation," and countless phrase permutations. The markets for all these keywords interact — they share a budget, and the same users may arrive via different query paths.
- **Why it matters:** Optimal budget allocation across keywords is a genuinely hard problem. It requires modeling user behavior, competitor bids, and cross-keyword substitution effects. This is the advertisers' core challenge and an active area of research.
- **The novel query problem:** When a user searches an exact phrase no one has bid on (e.g., "Zurich ski vacation trip December"), the search engine must infer which advertisers are relevant from related bids. Simply showing whoever bid highest on any individual word in the query ("vacation," "ski") produces irrelevant results. Search engines extrapolate from existing bids to implied bids on complex queries, but the best way to do this remains unsolved.
- **Connection:** Flags the limits of the single-keyword model developed earlier in the chapter; points toward open research problems.

---

### VCG Prices and the Market-Clearing Property (Advanced Section 15.9)

- **What it is:** A deep theoretical result: despite being defined as *personalized* prices (computed after a specific matching is determined), VCG prices are always simultaneously market-clearing (posted) prices. That is, if VCG prices were publicly announced and any buyer could choose any item at the listed price, every buyer would voluntarily choose the item they were assigned in the VCG optimal matching.
- **Why it matters:** This unifies the two main price-setting approaches in the book. It shows that the "harm-to-others" principle and the "ascending-auction" principle are not as different as they appear — they produce the same prices (specifically, VCG prices are the *unique minimum market-clearing prices* — the smallest set of prices that still clears the market).
- **How it works — the main claim:** In any matching market, the VCG prices form the unique set of market-clearing prices with minimum total sum. The proof is non-trivial and involves two key structural facts about minimum market-clearing prices:

  **Fact 1 (Alternating Path Anchoring):** In the preferred-seller graph for minimum market-clearing prices, every item with a price greater than 0 has an alternating path (beginning with a non-matching edge) leading to some item of price 0. This means no priced item is "floating free" — every positive price is structurally connected, via alternating paths, to a zero-priced item. The intuition: if some item's price were not so anchored, we could reduce its price slightly while maintaining the market-clearing property, contradicting minimality.

  **Fact 2 (Zeroing Out a Buyer):** If we set one buyer j's valuations to 0 (zeroing them out), the minimum market-clearing prices remain market-clearing for this modified market. Moreover, in any perfect matching of the zeroed-out market: (i) buyer j gets assigned a zero-priced item, and (ii) every other buyer's payoff is unchanged from the original market.

  **Completing the proof:** Using both facts algebraically: the total payoff Z of all buyers in the original market equals V^S_B - P (total valuation minus sum of prices). In the zeroed-out market, buyer j's payoff drops from z_j to 0 while everyone else's stays the same, so total payoff is Z - z_j = V^S_{B-j} - P. Subtracting: z_j = V^S_B - V^S_{B-j}. Expanding z_j = v_ij - p_i and V^S_B = v_ij + V^{S-i}_{B-j}, and simplifying: p_i = V^S_{B-j} - V^{S-i}_{B-j}, which is exactly the VCG formula (Equation 15.1). QED.

- **Key graph-theoretic insight:** The proof of Fact 1 uses a "set X" argument: starting from a positive-priced item i, consider all nodes reachable via alternating paths beginning with non-matching edges. If X contains no zero-priced item, all items in X are positive-priced, and we can reduce all their prices by 1 simultaneously. The two key observations — (a) if a buyer is in X, so is the item she is matched to, and (b) if an item is in X, so are all buyers connected to it by non-matching edges — ensure no matching edge leaves the preferred-seller graph during the reduction, maintaining market-clearing. This contradicts minimality, so X must contain a zero-priced item.
- **Connection:** Provides the deepest theoretical insight in the chapter, unifying VCG (Chapter 15) and market-clearing prices (Chapter 10) as the same mathematical object viewed from different angles.

---

## Key Takeaways

1. Every Google search triggers an auction: the "sponsored results" are determined by a real-time mechanism that assigns slots to advertisers and sets prices, all in milliseconds.
2. An advertiser's value for a slot is simply (revenue per click) × (clickthrough rate of slot) — this product structure means all advertisers agree on slot rankings, so the socially optimal assignment always matches by rank.
3. The VCG mechanism achieves the remarkable feat of making truth-telling a *dominant strategy* — the unique mechanism design property that works regardless of what competitors do, not just in equilibrium.
4. VCG prices are "harm-based": each advertiser pays exactly the total benefit the rest of the market would gain if that advertiser did not exist. This is the multi-item generalization of second-price auctions.
5. The search industry rejected VCG in favor of GSP — a simpler mechanism that does not guarantee truthful bidding, can have multiple equilibria (some socially suboptimal), and creates complex strategic behavior.
6. Despite GSP's flaws, there always exists at least one Nash equilibrium that produces the socially optimal assignment — and that equilibrium is constructed directly from market-clearing prices.
7. Google's quality factors transform a pure bid-ranking into a bid × quality ranking, correcting the problem of low-quality advertisers gaming their way to top slots; but the secrecy of quality factor formulas creates information asymmetry that makes the market opaque.
8. VCG prices, despite being personalized (depending on who gets what), are identically equal to the minimum market-clearing prices — the two seemingly different frameworks yield the same prices.
9. The real keyword advertising market involves millions of simultaneous single-keyword auctions, cross-keyword budget allocation problems, and novel-query inference challenges — none of which are fully solved.
10. Whether VCG or GSP generates more revenue for the search engine is genuinely unknown and depends on which equilibrium advertisers select under GSP — VCG revenue can be higher or lower than either GSP equilibrium.

---

## Mental Model / Framework

Think of the keyword advertising market as a **layered pricing problem** with three nested questions:

**Layer 1 — What is the socially optimal assignment?**
If we knew everyone's true values, give the best slot to the highest-value advertiser, second-best slot to the second-highest, etc. This is straightforward because advertiser preferences over slots are all in the same order.

**Layer 2 — How do we extract true values?**
- VCG says: charge each advertiser the harm they cause others. This makes truth-telling dominant. But it requires computing counterfactual matchings.
- GSP says: rank by bid, charge the bid below you. Simple to compute and explain, but strategically complex — advertisers shade bids and game the system.

**Layer 3 — What is the right price for the mechanism designer (search engine)?**
Both VCG (always) and GSP's best equilibrium (sometimes) lead to market-clearing prices. The VCG prices specifically are the *minimum* market-clearing prices — the smallest prices that still prevent any advertiser from wanting to switch slots. This minimum property is what makes VCG prices unique.

**The central analogy:** VCG is like a tax system where you pay only the cost you impose on society. GSP is like a simpler tax system everyone understands, but which creates incentives to under-report income. The first is theoretically superior; the second is what governments (and search engines) actually use.

---

## "Aha!" Moments

1. **Truth-telling can be a dominant strategy in a complex multi-item auction.** Most people assume that in any competitive auction, it pays to strategize — shade your bid, bluff, model your competitors. VCG shatters this intuition: in a market with many items being sold simultaneously, you can design the rules so that the correct strategy for every participant, no matter what anyone else does, is to simply tell the truth about how much you value each item. The math works because your price depends only on *other people's* announcements, never your own — you can't manipulate your own price.

2. **The "harm principle" turns out to be the same thing as market-clearing prices.** VCG prices are defined philosophically as "the harm you impose on others" and computed counterfactually — you imagine a world without this buyer and calculate what changes. Market-clearing prices are defined structurally as "prices such that everyone's top choice is different." These sound like completely different concepts. The deep theorem of Section 15.9 reveals they are mathematically identical: the VCG prices are precisely the minimum market-clearing prices. This is genuinely surprising — it says that the socially-oriented mechanism (minimize harm to others) and the market-stability mechanism (prevent envy) point to exactly the same numbers.

3. **A simpler auction rule creates dramatically more complex behavior.** GSP is easier to describe than VCG — just bid per click, get the slot matching your rank, pay the bid below you. Yet this simplicity produces: multiple Nash equilibria, some of which are socially suboptimal; bid-shading as rational behavior; revenue that can be either higher or lower than VCG depending on which equilibrium emerges. VCG, the more complex mechanism, produces uniquely simple behavior (dominant strategy truthfulness). Complexity in the mechanism can actually *reduce* strategic complexity for participants.

---

## Connections to Other Chapters

**Builds directly on Chapter 10 (Matching Markets):** The entire framework of slots as sellers, advertisers as buyers, market-clearing prices, preferred-seller graphs, and the ascending-auction procedure for computing prices is imported wholesale from Chapter 10. Section 15.9's advanced proof is a direct extension of the alternating-path analysis from Chapter 10 (Section 10.6).

**Builds directly on Chapter 9 (Auctions):** The VCG mechanism is explicitly the multi-item generalization of the second-price (Vickrey) auction. Chapter 9 showed that second-price auctions elicit truthful bidding for a single item; Chapter 15 shows VCG achieves the same for many items simultaneously. The failure of first-price auctions (bid shading, instability) that motivated second-price auctions in Chapter 9 is exactly what motivated the search industry's move away from first-price keyword auctions.

**Builds on Chapter 6 (Game Theory — Nash Equilibrium):** The analysis of GSP uses Nash equilibrium as the solution concept. The multiplicity of equilibria and the existence of socially suboptimal equilibria are standard game-theoretic concerns. The construction of the socially optimal GSP equilibrium from market-clearing prices is a direct application of Nash equilibrium verification.

**Sets up future themes:** The open questions flagged — revenue maximization across mechanisms, optimal budget allocation across keywords, handling novel queries — represent the frontier where mechanism design, game theory, and network economics are actively being applied.

---

## In My Own Words (ELI5)

Imagine you are Google, and you have three spots on the screen where you can show ads. The top spot is best because most people look there first; the middle spot is okay; the bottom spot barely gets noticed. You want to sell these spots to advertisers — companies paying to show their ads to people who searched for something.

Here is the problem: you do not know how much each advertising spot is worth to each company. A shoe company might love the top spot; a camping gear company might not care as much.

**First approach — just ask people what they want:**
You could ask each company to tell you how much they value each spot. But if you just charge them that amount, they will lie and say small numbers to pay less. This does not work.

**The smart approach — VCG:**
Here is a clever trick. Tell each company: "You are going to pay whatever harm you cause to everyone else." What does this mean? If you took the top spot, everyone else had to shift down. The shoe company (who really wanted the top spot) now has to settle for the middle spot — that hurt them. The camping company (who wanted middle) now gets the bottom — that hurt them too. Add up all those "hurts" and charge the winning advertiser exactly that amount.

Why does this make everyone tell the truth? Because your price depends only on what OTHER companies said. You cannot change your own price by lying! The only thing lying does is risk you getting a different (worse) spot. So you might as well tell the truth.

**What Google actually uses — GSP:**
Google looked at VCG and said: "This is complicated. Let's do something simpler." They use a rule called Generalized Second Price: rank everyone by their bid, give the top spot to the highest bidder, second spot to the second bidder, etc. Each winner pays the bid of the person just below them.

This seems like a natural extension of how a simple auction works. But here is the surprise: it does NOT make truth-telling the always-best strategy. In the VCG example, the top bidder might actually *prefer* to bid lower, take the second spot, and pay less. There can be multiple different "stable" bidding patterns (equilibria), and some of them result in the wrong company getting the top spot.

**The surprising twist at the end:**
Even though VCG prices (harm-to-others prices) and market-clearing prices (prices that make everyone happy with their spot) sound completely different, they turn out to be the same numbers! VCG prices are the *lowest possible* prices that still make the market stable. It is like discovering that two different recipes, one from a French chef and one from an Italian chef, produce exactly the same dish.

**The real-world complications:**
In reality, Google also considers "ad quality" — a low-quality ad in the top spot gets few clicks, so Google makes little money even with a high bid. So Google multiplies each bid by a quality score and ranks by that. Also, the same company bids on thousands of different keywords simultaneously and has to decide how to split its budget among them — an enormously complex strategic problem that is still not fully solved.
