# Practice Exercises: Chapter 9 — Auctions

## 🧪 Comprehension Check

**Q1:** Why is truthful bidding a dominant strategy in a second-price sealed-bid auction, but NOT in a first-price sealed-bid auction? What is the structural difference between the two formats that drives this result?

<details>
<summary>Answer</summary>

In a second-price auction, your bid determines only whether you win or lose — it never determines how much you pay. The payment is always set by the second-highest bid, which is entirely outside your control. This means deviating from your true value can only hurt you: bidding higher risks winning at a price above your value, while bidding lower risks losing when you could have won profitably. In a first-price auction, your bid determines both whether you win AND how much you pay, so bidding your true value guarantees zero surplus if you win. Rational bidders therefore shade their bids downward, and the optimal shade depends on the competitive environment — making truthful bidding no longer dominant.

</details>

---

**Q2:** The chapter argues that a seller benefits from committing to a fixed auction format in advance, even if breaking that commitment later might seem profitable. Why is this commitment valuable, and what happens if bidders suspect the seller might deviate?

<details>
<summary>Answer</summary>

Commitment is valuable because it governs bidder behavior before bids are submitted. In a second-price auction, bidders bid truthfully precisely because they trust the format will be honored — their bids reveal their true values. If the seller could renege after collecting bids (for example, by privately negotiating with the highest bidder), the seller would gain information from the revealed bids and could extract more surplus. But rational bidders, anticipating this possibility, would no longer bid truthfully, destroying the information-revealing property of the auction and potentially leaving the seller worse off. Credible commitment to the mechanism is therefore essential; it is the foundation on which truthful equilibria rest.

</details>

---

**Q3:** What is the winner's curse, and why does it arise specifically in common-value auctions but not in private-value auctions? How should a rational bidder adjust her strategy to account for it?

<details>
<summary>Answer</summary>

The winner's curse arises because winning an auction is itself informative: it reveals that your estimate of the item's value was higher than every other bidder's estimate. In a common-value setting — where the item has a single true value (e.g., the oil in a tract) but each bidder observes only a noisy private signal — the winner is systematically the bidder whose signal most overestimated the true value. Winning thus means you probably overpaid. In private-value auctions this problem does not arise because each bidder's value is genuinely independent of others' valuations. A rational bidder in a common-value auction should shade her bid downward relative to her private estimate, conditioning her bid on the event that she wins — asking "what is this item worth if my estimate turned out to be the highest of all?" This conditioning typically implies bidding well below one's naive estimate.

</details>

---

**Q4:** The Revenue Equivalence Theorem is one of the deepest results in auction theory. State what it says, explain the two opposing forces it balances, and describe why the result is surprising.

<details>
<summary>Answer</summary>

Revenue equivalence states that under independent private values drawn from the same distribution, with bidders following equilibrium strategies, a seller's expected revenue is identical across a wide class of auction formats — including first-price, second-price, and all-pay auctions. The two opposing forces are: in a second-price auction the seller explicitly collects less than the highest bid, but bidders respond by bidding their true values; in a first-price auction the seller collects the highest bid, but bidders shade their bids downward. These effects exactly cancel. For n bidders with values uniform on [0,1], the expected revenue equals (n-1)/(n+1) under all three formats. The result is surprising because it seems obvious that collecting the highest bid (first-price) should dominate collecting only the second-highest (second-price), yet the strategic response of bidders fully compensates for the difference.

</details>

---

**Q5:** Why should a seller set a reserve price strictly above her own value for the item — even above zero if she values the item at zero? What is the trade-off involved, and what is the optimal reserve price for a single-bidder second-price auction with values uniform on [0,1] and a seller value of zero?

<details>
<summary>Answer</summary>

A reserve price creates a credible threat not to sell at low prices, which forces bidders to bid higher to secure the item. Without a reserve, a single bidder with value uniformly distributed on [0,1] would pay 0 in a second-price auction (there is no second bid to set a floor). By setting a reserve r > 0, the seller sells only when the bidder's value exceeds r, collecting r in those cases (probability 1 - r) and nothing otherwise. The seller's expected revenue is r(1 - r), maximized at r = 1/2. So even though the seller values the item at zero, she optimally risks not selling half the time in order to extract higher payments when she does sell. The trade-off is between the higher price extracted when a sale occurs versus the probability of no sale at all.

</details>

---

## 🔄 Apply It

**Scenario 1: Bidding on a Government Defense Contract**
Your company is competing in a sealed-bid procurement auction (a reverse auction) to supply components to a government agency. There are five other competing firms. Your true cost to fulfill the contract is $4 million — meaning you can profitably supply at any price above this. The government awards the contract to the lowest bidder who pays their own bid (a first-price format).

*What should you consider?*
- This is a first-price auction in reverse: you "bid" your price, and the lowest bidder wins and is paid that price. The analog of "bid shading" here means bidding above your true cost to preserve profit margin.
- With five competitors, the equilibrium logic from the chapter says you should bid (n-1)/n times your true value in a simple model — but here "value" is replaced by cost and the direction reverses: bid higher than cost by the appropriate shade.
- The more competitors you face, the smaller your margin of shade should be (bid closer to your true cost), because a higher competing bid pool makes it necessary to quote a more aggressive price.

<details>
<summary>Model Response</summary>

In a first-price procurement auction (lowest-bid wins), the strategic logic mirrors the buyer-side first-price auction but in reverse. You want to bid above your cost to earn a margin, but not so high that a competitor undercuts you. With six bidders total (you plus five others), the equilibrium bid-shading formula from the chapter — s(v) = ((n-1)/n)v for the uniform case — translates roughly to bidding your cost plus a markup that shrinks as the number of competitors grows. With five competitors, the equilibrium advice is to shade less aggressively than you would in a two-bidder contest. If costs are roughly uniform, a reasonable approximation is to bid (n/(n-1)) times your true cost as the floor markup — here about 6/5 times $4M = $4.8M. But you must also gather information about competitors' likely cost distributions; if you believe competitors have similar costs, you should bid very close to your cost to win. The dominant consideration is: more competitors means bid closer to your true cost floor.

</details>

---

**Scenario 2: Bidding on an Oil Drilling Lease**
You work for an oil company bidding on the rights to drill on a government tract. Geological surveys suggest the tract contains oil worth approximately $50 million in revenue, but this is uncertain. Your company's geologists estimate $52 million; you know other firms have conducted independent surveys and may have arrived at different estimates.

*What should you consider?*
- This is a common-value auction: the oil has one true value regardless of who drills, but each firm has a private noisy estimate. The winner's curse applies.
- Winning reveals that your estimate of $52M was higher than all other bidders' estimates — meaning your estimate is probably an overestimate of true value.
- You should bid not your raw estimate, but your estimate conditional on the assumption that you win — which is lower than $52M by an amount that grows with the number of competing bidders.

<details>
<summary>Model Response</summary>

This is a textbook common-value setting. The true value v of the tract is unknown, and each firm i observes v_i = v + x_i where x_i is random noise with mean zero. If you win, it means your estimate of $52M was the highest — which means your x_i was likely positive, so your raw estimate overstates the true value. The rational bid is your estimate conditional on winning: E[v | v_i = 52M, v_i > all other estimates]. This conditional expectation is substantially less than $52M, especially with many bidders, because winning becomes an increasingly strong signal of overestimation as competition grows. In practice, oil companies learned this lesson from early offshore lease auctions in the 1970s, where winning firms frequently lost money — a historically documented instance of the winner's curse. You should discount your estimate significantly and perhaps bid in the range of $40-45M or less depending on how many firms are competing.

</details>

---

**Scenario 3: Running an Online Auction for a Rare Collectible**
You are selling a rare first-edition book on an online platform. You are deciding whether to run an English ascending-bid auction (like eBay's proxy bidding system), a first-price sealed-bid auction, or to set a fixed price. You estimate there are 8-10 interested buyers whose values are private and independent.

*What should you consider?*
- The revenue equivalence theorem says your expected revenue should be the same across first-price, second-price (which eBay's proxy system approximates), and ascending-bid formats — under independent private values. So format choice may matter less than you think.
- However, a reserve price matters greatly: without one, if only one bidder shows genuine interest, you could sell far below value. Setting a reserve strictly above your own value for the book is optimal.
- The ascending-bid format provides a strategic simplicity advantage: bidders have a dominant strategy (bid true value), so you don't have to worry about sophisticated bid-shading causing strategic errors that distort the outcome.

<details>
<summary>Model Response</summary>

Revenue equivalence tells you that the expected price should be similar across formats, so the choice of English vs. first-price sealed-bid should not dramatically affect your expected revenue given enough rational bidders. The most important lever is the reserve price: set it at approximately the midpoint between your own value for the book and the maximum plausible buyer value. If you value the book at $0 (willing to sell at any price) and believe the highest plausible buyer value is around $500, a reserve near $250 is theoretically optimal for a single-bidder case. For 8-10 bidders the optimal reserve is lower but still above zero. The ascending-bid format (eBay proxy) has the practical advantage that truthful bidding is dominant, so you don't need to worry about unsophisticated buyers harming the auction's efficiency. For a rare item where buyer values are genuinely uncertain and spread, the ascending auction is a robust choice precisely because it reveals information dynamically and encourages participation.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you participated in any competitive process where you had to decide how much to "offer" without knowing others' offers — a salary negotiation, a job application, a bid on a house, or even competing for a limited-enrollment course. Now that you understand bid shading and the trade-off between winning probability and payoff size, what would you do differently? Would you have offered more or less, and why?

2. Think of a significant purchase you made where you later discovered others had paid very different prices for the same item — a used car, a house, concert tickets, or a service contract. In retrospect, do you think the seller was running something analogous to an auction? Which format did it resemble most, and did you behave like a rational bidder? What information were you missing that would have helped you?

3. Think of a time when you were on the selling side — whether of a physical object, a service, your labor, or an idea — and you set a price without fully knowing what buyers would pay. Now that you understand reserve prices and the role of commitment in auction design, how would you structure the sale differently? What mechanism would you commit to in advance, and how would you set your reserve?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain why bidding your true value is the best strategy in a second-price auction, in exactly 3 sentences, to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

In a second-price auction, the winner pays not what they bid, but what the second-highest bidder bid — so your bid only controls whether you win or lose, never how much you pay if you win. If you bid below your true value, you risk losing the item even when you could have won it at a price you'd be happy paying; if you bid above your true value, you risk winning it at a price that leaves you worse off than not winning. Since your bid can only hurt you by changing your win/loss outcome but never changes the price you'd pay, the safest move is always to bid exactly what the item is truly worth to you.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a network of five buyers connected to three sellers in a bipartite graph (as in the matching markets framework from Chapter 10 / the network market structure introduced in earlier chapters). Each seller has one unit of a good. The buyers have independent private values for each seller's good, but the values are not identical across sellers — buyer 1 values Seller A's good at $80 and Seller B's good at $60, while buyer 2 values Seller A's good at $70 and Seller B's good at $90, and so on for all five buyers.

Each seller independently runs a second-price sealed-bid auction for their good. Buyers must decide how to allocate their bids across sellers — they can only win one item (their budget constraint), but they can submit bids to multiple sellers simultaneously.

(a) If buyers bid truthfully in each auction independently, does the outcome necessarily produce a market-clearing matching? Why or why not — think about whether the highest-value buyer for each seller actually wins that seller's good in a way that avoids conflicts.

(b) Now suppose one seller observes the outcomes of the other sellers' auctions before running her own. Does this give her an advantage in setting her reserve price? How does the sequential information structure change the game relative to simultaneous sealed-bid auctions?

(c) Using the concept of a congestible network from the traffic flow chapter (Chapter 8), describe an analogy: what is the "congestion externality" that bidders impose on each other when they all submit high bids to the same seller?

**Chapters involved:** Chapter 9 (Auctions) + Chapter 8 (Network Traffic and Congestion) + the matching markets material on bipartite buyer-seller networks.

---

## 📋 Action Items

1. Before your next salary negotiation or freelance project quote, write down your true minimum acceptable number on paper before any conversation begins — then deliberately add the optimal "shade" upward based on how many competing offers the other party is likely fielding. If they are choosing among three candidates, shade up less than if they are choosing among ten. Commit to this number before you enter the room.

2. The next time you use eBay, Amazon, or any platform with auction-like pricing, find one item currently in an active auction and record the current bid and time remaining. Calculate what you believe the item's true value is to you, write it down, and use the proxy bidding system to enter exactly that value — then observe whether you win and at what price. Compare the outcome to what you would have bid under gut instinct, and reflect on whether truthful bidding served you.

3. Identify one recurring competitive situation in your professional life — submitting proposals, pricing services, applying for grants, or competing for projects — and research how many other parties typically compete. Use the formula s(v) = ((n-1)/n) × v as a rough calibration tool: if n = 3 competitors, your "bid" or price quote should shade about 33% away from your maximum to stay competitive while preserving surplus. Write down the number this produces for one real upcoming opportunity and use it as your starting anchor.

