# Practice Exercises: Chapter 15 — Sponsored Search Markets (Part 2: VCG, GSP, and Equilibrium Analysis)

## 🧪 Comprehension Check

**Q1:** The VCG mechanism charges each buyer "the harm they cause to others." In a three-advertiser, three-slot market, advertiser x is assigned slot a (clickthrough rate 10), advertiser y gets slot b (rate 5), and advertiser z gets slot c (rate 2). Advertiser x has revenue per click of 3, y has 2, z has 1. Explain what "harm" means here and walk through how you would compute x's VCG price.

<details>
<summary>Answer</summary>

"Harm" is the total boost in valuation that all other buyers would enjoy if the focal buyer simply did not exist. To compute x's VCG price, remove x from the market and find the new optimal matching: y would move up to slot a (valuation 20 vs. its current 10, a gain of 10) and z would move up to slot b (valuation 10 vs. its current 4, a gain of 6). Wait — with rates 10, 5, 2 and revenues 2, 1 for y and z, the gain for y moving from slot b to slot a is (2×10) − (2×5) = 10, and z moving from slot c to slot b is (1×5) − (1×2) = 3. The total harm x causes is 10 + 3 = 13, so x pays 13. This is exactly the VCG price: the total improvement the rest of the world would experience if x were absent.

</details>

---

**Q2:** Why is truthful bidding a dominant strategy under VCG but not under GSP? Trace the logic of the VCG proof to explain what makes lying never beneficial, and then give a concrete example showing that truth-telling can fail to be a Nash equilibrium under GSP.

<details>
<summary>Answer</summary>

Under VCG, a buyer j's price p_ij depends only on other buyers' announcements, not on j's own announcement. So if j lies and obtains a different item h, her payoff is v_hj − p_hj. The VCG proof shows that v_ij + V^(S−i)_(B−j) ≥ v_hj + V^(S−h)_(B−j) because the left side is the global maximum total valuation (unconstrained), while the right side is the maximum only over matchings that assign h to j (a constrained maximum). After algebraic manipulation this means v_ij − p_ij ≥ v_hj − p_hj — truth-telling always gives at least as high a payoff. Under GSP, prices depend directly on one's own bid ranking. In the Figure 15.6 example (slots with rates 10, 4; advertisers x, y, z with values per click 7, 6, 1), if all bid truthfully, x pays 60 for the top slot (payoff 10), but if x shades its bid to 5, it gets the second slot for 4 clicks at a price of 1 per click (payoff 28 − 4 = 24 > 10). Hence truth-telling is not an equilibrium under GSP.

</details>

---

**Q3:** Matching markets from Chapter 10 use posted (market-clearing) prices, while VCG prices are personalized. Explain the conceptual difference between these two approaches, and then state the surprising theorem that relates them. Why is that theorem non-trivial to prove?

<details>
<summary>Answer</summary>

Market-clearing prices are posted publicly: a seller announces a price, any buyer who prefers that item at that price can take it, and prices are raised until each buyer strictly prefers a different item. VCG prices are personalized: the price buyer j pays for item i depends on both which item j gets and who j is, computed as the harm j causes to everyone else. The surprising theorem (due to Leonard and Demange) is that VCG prices are always market-clearing, and specifically they constitute the unique set of market-clearing prices with the minimum possible total sum. The proof is non-trivial because V^S_(B−j) and V^(S−i)_(B−j) arise from potentially very different optimal matchings, so one cannot directly subtract their terms; the argument requires first establishing two structural facts about how the preferred-seller graph for minimum market-clearing prices contains alternating paths from every positively-priced item down to a zero-priced item.

</details>

---

**Q4:** GSP guarantees the existence of at least one Nash equilibrium that is also socially optimal. Describe the construction procedure that finds this equilibrium, and explain why the market-clearing property is the key tool for showing that no advertiser wants to deviate.

<details>
<summary>Answer</summary>

The construction starts by treating the advertisers and slots as a matching market, computing market-clearing prices p_1, p_2, ..., p_n for the slots (cumulative prices for all clicks), and converting these to per-click prices p*_j = p_j / r_j. One can show these per-click prices are non-increasing down the slot ordering. The bids are then set so that advertiser j bids p*_(j−1) (the per-click price of the slot just above), and advertiser 1 bids anything above p*_1. Each advertiser j is assigned slot j and pays p*_j per click. No advertiser wants to lower their bid: doing so would only get them a lower slot at the price the current occupant pays, but market-clearing means they already weakly prefer their current slot at its current price to any lower slot at its price. No advertiser wants to raise their bid either: winning a higher slot i would require paying the current bid of the slot-i occupant, which is above p*_i — the current price — and market-clearing means they do not prefer slot i even at p*_i, let alone at a higher price.

</details>

---

**Q5:** Ad quality factors (the q_j in Google's system) were introduced to address a specific failure of pure GSP. Describe that failure precisely, explain how quality factors fix it mechanically, and identify what new opacity problem they create for advertisers.

<details>
<summary>Answer</summary>

The failure of pure GSP is that a low-quality advertiser can win a high slot by bidding aggressively, but users rarely click on an irrelevant ad, so the search engine earns almost nothing from that slot while a more relevant advertiser is displaced. Quality factors fix this by redefining the effective clickthrough rate for advertiser j in slot i as q_j × r_i (where q_j reflects estimated relevance, historical CTR, and landing page quality), changing the valuation formula to v_ij = q_j r_i v_j. Advertisers are ranked by the product q_j b_j rather than by bid alone, and each pays the minimum bid needed to maintain their current position under this ranking. The opacity problem is that q_j is computed by the search engine using a proprietary formula that is not disclosed to advertisers; since the search engine controls q_j, it has nearly unlimited power to reorder advertisers for any given set of bids, making the market's actual allocation rules opaque and harder for advertisers to reason about strategically.

</details>

---

## 🔄 Apply It

**Scenario 1: Launching a Paid Search Campaign for a SaaS Product**
You are the growth manager at a B2B SaaS company bidding on the keyword "project management software." There are three ad slots with estimated clickthrough rates of 100, 40, and 15 clicks per day. Your internal data shows each converted visitor is worth $120 in lifetime revenue. Two key competitors have estimated revenues per click of $90 and $50 respectively. The platform uses GSP with quality factors you cannot observe.

*What should you consider?*
- Under GSP, your dominant strategy is not truth-telling — consider how your quality score interacts with your bid to determine your actual ranking and price paid.
- Model the tradeoff between slot position (volume) and price per click: moving from slot 2 to slot 1 increases clicks by 60/day but your marginal cost may not justify it if competitors bid near your value.
- The opaque quality factor means your effective bid is q × b; investing in ad relevance, landing page quality, and historical CTR may improve q and let you win a better slot at a lower raw bid.

<details>
<summary>Model Response</summary>

Start by estimating your revenue per click: if your conversion rate from paid search is around 2%, your revenue per click is $120 × 0.02 = $2.40. This is your true value v_j under the model. Under GSP you should not bid $2.40 truthfully — as the chapter shows, truth-telling is not a Nash equilibrium and you can likely do better by shading. Instead, identify what the slot-2 occupant is likely paying per click (roughly equal to the slot-3 occupant's bid under GSP rules) and decide whether the volume gain from slot 1 justifies the higher cost. More importantly, because Google ranks you by q_j × b_j, improving your quality score through tighter keyword-to-ad relevance and a fast, high-converting landing page is strategically equivalent to raising your bid — but without paying more. Run A/B tests on ad copy to maximize historical CTR, since that is one of the primary inputs to q_j. Finally, monitor competitors' bids indirectly via auction insight reports, as repeated interaction in the same auction approximates the common-knowledge assumption that justifies Nash equilibrium analysis in GSP.

</details>

---

**Scenario 2: A Search Engine Deciding Whether to Adopt VCG or GSP**
You are a product manager at a new search engine entering the market. You must choose between implementing VCG or GSP for your sponsored search auction. You have 500 advertisers bidding across 200 keywords, and your engineering team can implement either system at roughly equal cost.

*What should you consider?*
- VCG guarantees truthful bidding as a dominant strategy, producing socially optimal allocations and stable advertiser behavior, but its revenue implications compared to GSP are uncertain and depend on which equilibrium GSP converges to.
- GSP is simpler for advertisers to understand at a surface level (pay the bid of the person below you), but it induces complex strategic bidding and possibly socially suboptimal outcomes that may harm your long-term reputation.
- Consider the ecosystem effects: VCG's stability means less advertiser churn from constant bid adjustments, while GSP's multiple equilibria mean your revenue is less predictable.

<details>
<summary>Model Response</summary>

The chapter establishes that VCG's revenue relative to GSP depends on which Nash equilibrium GSP advertisers settle into. In the worked example, GSP equilibrium 1 generates revenue 48, equilibrium 2 generates 34, and VCG generates 44 — VCG sits between the two GSP outcomes. If advertisers coordinate on the socially optimal GSP equilibrium (constructed via market-clearing prices), the chapter shows this equilibrium produces the same assignment as VCG but potentially different prices. For a new entrant trying to build advertiser trust, VCG has a significant advantage: dominant-strategy truth-telling means advertisers never feel they are being manipulated or need to engage in continuous bid experimentation. The early first-price auction era described in the chapter, where advertisers constantly adjusted bids and created a turbulent market, is a cautionary tale for GSP without quality factors. However, if your advertiser base is sophisticated and already accustomed to GSP (as Google's market is), switching to VCG requires re-education. A practical recommendation: implement VCG for your launch to differentiate on trust and stability, and add quality factors from the start to avoid the low-quality advertiser problem that plagued Yahoo's pure GSP system.

</details>

---

**Scenario 3: Evaluating a Competitor's Ad Auction Behavior**
You are an economist consulting for a regulatory agency investigating whether a major search engine's ad auction practices are anticompetitive. The engine uses GSP with undisclosed quality factors. You have access to aggregate bid data showing that the top advertiser in a high-value keyword consistently wins the top slot despite not always having the highest raw bid.

*What should you consider?*
- Distinguish between the search engine legitimately using quality factors (q_j × b_j ranking) to improve social welfare versus using quality factors to favor certain advertisers for non-quality reasons.
- Recognize that the opacity of quality factor computation means even a well-intentioned system is difficult for outsiders to audit, and this opacity itself may constitute a market power issue.
- The existence of multiple Nash equilibria in GSP means that observed outcomes that look suboptimal may simply reflect which equilibrium advertisers have converged to, not necessarily manipulation.

<details>
<summary>Model Response</summary>

The chapter explains that Google's quality factor q_j is intended to estimate an ad's true clickthrough rate, incorporating ad text relevance and landing page quality. If the top advertiser wins despite a lower raw bid, this is consistent with them having a higher quality score — a legitimate outcome that improves search engine revenue and user experience. However, the chapter also flags that quality factors give the search engine "nearly unlimited power to affect the actual ordering of advertisers for a given set of bids." To investigate anticompetitive behavior, focus on whether the quality factor computation can be explained solely by user-welfare proxies (CTR, landing page experience, ad relevance) or whether it correlates with factors unrelated to ad quality, such as the advertiser's total spend, exclusivity agreements, or vertical integration with the search engine's own products. Examine whether the same advertiser's quality score changes discontinuously when they reduce spend, which would be unexplainable by true quality metrics. Also look at whether the socially optimal assignment (highest value × clickthrough product to top slot) is consistently achieved: the chapter shows that even GSP's best Nash equilibrium produces a socially optimal assignment, so systematic deviations from optimality in allocation — not just in pricing — would be a stronger signal of manipulation.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you participated in a competitive bidding situation — a job negotiation, a housing bid, an eBay auction, or a freelance contract — and you strategically understated or overstated your true value. Now that you understand the VCG principle (being charged only the harm you cause to others), how would you have behaved differently if the other party had used a VCG mechanism? Would you have bid more honestly, and why?

2. Think of a platform or marketplace you use regularly — a freelance site, an app store, a rental platform — where the ranking algorithm is opaque to the participants. Now that you understand how undisclosed quality factors in GSP give the platform operator enormous hidden power over ordering outcomes, what would you demand to know about that algorithm? How does this change your trust in the platform's stated neutrality?

3. Think of a time when you were part of a group trying to reach a fair allocation of limited resources — dividing a project budget, assigning office space, scheduling shared equipment. Looking back, if someone had been charged "the harm they cause to others" for taking a particularly valuable resource, how would that have changed the dynamics? Would it have felt fairer or more intrusive than the method you actually used?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the VCG principle — why charging each participant "the harm they cause to others" makes truth-telling the dominant strategy — in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

Imagine you are bidding in an auction where the auctioneer, after seeing all bids, charges you not what you said you'd pay, but the total loss everyone else suffers because you showed up and took your item — essentially, how much better off they would all be if you simply weren't there. Because your price is calculated entirely from other people's bids and has nothing to do with your own stated value, lying about your value can only hurt you: it might cause you to lose an item you genuinely wanted, or win one you value less, while your price stays the same either way. This means your only safe move is to tell the truth, and the beauty of the mechanism is that this honest behavior leads to the best possible overall allocation — the items go to whoever values them most — without anyone needing to trust each other.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** Consider a small search advertising market with two slots (clickthrough rates 8 and 3) and three advertisers (values per click: A = 5, B = 4, C = 2). The search engine currently uses GSP.

Part 1 (Chapter 15): Compute the VCG prices for the socially optimal assignment. Then construct a set of Nash equilibrium bids for GSP that produces the same socially optimal assignment, using the market-clearing price construction described in Section 15.6. Verify that no advertiser wants to deviate.

Part 2 (Chapter 9 — Second-Price Auctions): Suppose the search engine collapses to a single slot (clickthrough rate 8 only) and runs a standard second-price sealed-bid auction. Show that the VCG price for this single-slot case equals exactly the second-highest bid under truthful reporting, thereby confirming that VCG is a generalization of the second-price auction. Explain in one paragraph why the dominant-strategy property that makes the second-price auction work carries over to VCG in the multi-slot case.

Part 3 (synthesis): Now suppose the search engine adds a quality factor for advertiser A of q_A = 0.6 (perhaps A's ads are less relevant), while B and C have q = 1. Re-rank the advertisers under GSP's quality-adjusted rule (rank by q_j × b_j). Does the socially optimal assignment change? Compute the new payments and compare total search engine revenue under quality-adjusted GSP versus plain VCG. Discuss what this reveals about the tradeoff between social optimality and search engine revenue.

**Chapters involved:** Chapter 15 + Chapter 9

---

## 📋 Action Items

1. On Monday morning before checking email, open a spreadsheet and model the three-advertiser, three-slot VCG example from Figure 15.3 (slots with rates 10, 5, 2; advertisers with revenues per click 3, 2, 1) entirely from scratch. Compute each advertiser's VCG price by hand using the "harm to others" definition, verify your numbers match the chapter's result (x pays 13, y pays 3, z pays 0), and then write one paragraph in your own words explaining why y's departure causes so little harm compared to x's departure.

2. If you run or manage any paid search campaigns this week, pull your auction insights report and identify the top competitor by impression share. Using your known cost-per-click and estimated conversion rate, reverse-engineer an upper bound on that competitor's true value per click. Then ask: are they likely bidding above their true value (aggressive), below it (shading), or near it? Write down which Nash equilibrium behavior this resembles from the GSP analysis and what it implies for your own bidding strategy.

3. Find one real-world auction or allocation mechanism you interact with this week — a job board's promoted listing, a property rental platform's featured placement, a freelance site's boosted profile — and spend 20 minutes investigating what the platform discloses about how ranking and pricing are determined. Write down three specific questions the chapter's analysis of ad quality opacity would prompt you to ask the platform if you could, and identify what evidence would distinguish a fair quality-factor system from one that uses opacity to extract more revenue from advertisers.
