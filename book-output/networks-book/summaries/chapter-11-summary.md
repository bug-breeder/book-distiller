# Chapter 9: Auctions

## 🧠 Core Thesis
Auctions are mechanisms that elicit truthful information about buyers' private values when those values are unknown, and different auction formats — while they induce radically different bidding strategies — turn out to produce identical expected revenue for the seller, a profound result known as revenue equivalence.

## 📖 Detailed Breakdown

### The Four Canonical Auction Formats
- **What it is:** There are four standard ways to auction a single item: (1) ascending-bid (English) auctions, where the seller raises the price until one bidder remains; (2) descending-bid (Dutch) auctions, where the seller lowers the price until someone accepts; (3) first-price sealed-bid auctions, where all submit bids simultaneously and the highest bidder wins and pays their bid; and (4) second-price sealed-bid (Vickrey) auctions, where the highest bidder wins but pays only the second-highest bid.
- **Why it matters:** These four formats represent the landscape of practical auction design. Each creates a different strategic environment and different incentives for bidders, yet as the chapter shows, they are linked in deep ways.
- **How it works:** In ascending-bid auctions, bidders drop out as the price rises; the last remaining bidder wins at the price where the runner-up dropped out. In Dutch auctions, the first bidder to speak claims the item at the current price. Sealed-bid formats are simultaneous and private. In second-price auctions, named after economist William Vickrey (Nobel Prize 1996), the winner pays what the second-place bidder offered, not their own bid.
- **Key quote or example:** "Second-price auctions are called Vickrey auctions in honor of William Vickrey, who wrote the first game-theoretic analysis of auctions (including the second-price auction). Vickrey won the Nobel Memorial Prize in Economics in 1996 for this body of work."
- **Connection:** The relationships between these four formats — specifically that Dutch equals first-price and ascending-bid equals second-price in terms of strategic equivalence — become the organizing structure of the chapter.

### When Auctions Are Appropriate: The Role of Unknown Values
- **What it is:** Auctions are most useful precisely when the seller does not know buyers' true values, and buyers do not know each other's values. When values are known to all parties, a fixed price suffices and the auction adds nothing.
- **Why it matters:** This explains why auctions exist and when they make sense, grounding the whole analysis in a real economic need rather than treating auctions as arbitrary curiosities.
- **How it works:** If a seller knows every buyer's true value, he can simply post a price just below the highest buyer's value and extract the full surplus. The key insight is that whoever can commit to a mechanism gains negotiating power. A seller who commits to a fixed price captures the surplus; a buyer who commits to a maximum offer captures some surplus for herself. Auctions arise as a commitment device when values are private and the seller cannot observe them.
- **Key quote or example:** "The issue of commitment is also crucial in the context of auctions — specifically, it is important that a seller be able to reliably commit in advance to a given auction format."
- **Connection:** The distinction between private values (each bidder knows only her own value) and common values (the item has one true value that all bidders are estimating) sets up the Winner's Curse discussion in Section 9.6.

### Strategic Equivalence of Format Pairs
- **What it is:** Descending-bid (Dutch) auctions are strategically identical to first-price sealed-bid auctions, and ascending-bid (English) auctions are strategically identical to second-price sealed-bid auctions.
- **Why it matters:** This halves the work: understanding sealed-bid formats gives us insight into the interactive formats, and vice versa. It also explains why the second-price rule — which superficially looks like the seller is leaving money on the table — is actually economically coherent.
- **How it works:** In a Dutch auction, no information is revealed until someone accepts the price. Each bidder has a private threshold — the price at which they will speak — and the auction ends the instant someone hits their threshold. This threshold is exactly a sealed bid: the item goes to the highest threshold-holder, who pays exactly that threshold value. Thus Dutch = first-price. For ascending-bid auctions: rational bidders should stay in until the price hits their true value (leaving earlier is strictly worse; staying longer is strictly worse). The last person standing wins and pays the price at which the second-to-last person dropped out — which is exactly the second-highest value. Thus ascending-bid = second-price.
- **Key quote or example:** "The ascending-bid auction can be viewed as a simulation, using sealed bids, of an ascending-bid auction. Moreover, the fact that bidders want to remain in an ascending-bid auction up to exactly the point at which their true value is reached provides the intuition for what will be our main result in the next section: after formulating the sealed-bid second-price auction in terms of game theory, we will find that bidding one's true value is a dominant strategy."
- **Connection:** This equivalence motivates the dominant-strategy proof for second-price auctions and foreshadows why first-price auctions require more complex "bid shading" strategies.

### Dominant Strategy in Second-Price Auctions: Truthful Bidding
- **What it is:** In a sealed-bid second-price (Vickrey) auction with independent private values, bidding your exact true value is a dominant strategy — it is optimal regardless of what every other bidder does.
- **Why it matters:** This is one of the most celebrated results in mechanism design. It means a second-price auction is "strategy-proof": there is no benefit from gaming the system, and rational bidders should simply be honest.
- **How it works:** The payoff structure is key: if bidder i has true value v_i and bids b_i, and some other bid b_j is the second-highest, then payoff = v_i - b_j if b_i wins, and 0 otherwise. Crucially, the amount you pay (b_j) does not depend on your own bid — only on others' bids. Your bid only determines whether you win or lose. The proof considers two deviations: (a) raising your bid above v_i — this only changes the outcome if your true bid would have lost but the raised bid wins, meaning b_j is between v_i and b_i'. In that case you win but pay b_j > v_i, getting a negative payoff. No improvement. (b) lowering your bid below v_i — this only matters if your true bid would have won but the lower bid loses, meaning b_k is between b_i'' and v_i. You had a positive payoff of v_i - b_k and now get 0. No improvement. Figure 9.1 illustrates both cases visually on a number line.
- **Key quote or example:** "In a sealed-bid second-price auction, it is a dominant strategy for each bidder i to choose a bid b_i = v_i."
- **Connection:** The robustness of this dominant strategy — it holds even if other bidders are overbidding, colluding, or behaving irrationally — makes it practically appealing and contrasts sharply with the strategic complexity of first-price auctions.

### Bid Shading in First-Price Auctions
- **What it is:** In a first-price auction, bidding your true value is never optimal. The correct strategy is to shade your bid downward below your true value to earn a positive surplus if you win.
- **Why it matters:** This is what makes first-price auctions strategically hard: unlike second-price auctions, you must reason about your competitors' likely bids to arrive at your own optimal bid.
- **How it works:** If you bid your true value v_i and win, your payoff is v_i - v_i = 0. You might as well not participate. So you must bid below v_i. The trade-off: bid too low, and your probability of winning drops; bid too high, and your profit margin shrinks. The optimal shade depends on the number of competitors and the distribution of their values. More competitors means you must bid more aggressively (less shading) because the highest competing bid is likely to be larger.
- **Key quote or example:** "The optimal way to bid in a first-price auction is to 'shade' your bid slightly downward, so that if you win you will get a positive payoff."
- **Connection:** This leads directly to the formal equilibrium derivation in Section 9.7, where the optimal bid function s(v) = ((n-1)/n)v is derived for n bidders with values uniform on [0,1].

### All-Pay Auctions and Lobbying
- **What it is:** In an all-pay auction, every bidder pays their bid regardless of whether they win. The highest bidder wins the item.
- **Why it matters:** This format models real-world competitions where effort or expenditure must be committed before the outcome is known — lobbying, design competitions, patent races, and military conflicts all share this "all-pay" structure.
- **How it works:** Payoffs are: loser gets -b_i (loses their bid with no compensation); winner gets v_i - b_i. Since everyone faces a guaranteed cost, bids are shaded dramatically lower than in first-price auctions. The equilibrium bid function for n bidders is s(v) = ((n-1)/n) * v^n — the bid grows as the nth power of your value, so bids are much smaller for typical values when v < 1.
- **Key quote or example:** "Political lobbying can be modeled in this way: each side must spend money on lobbying, but only the successful side receives anything of value for this expenditure."
- **Connection:** Despite the very different structure, the Revenue Equivalence Theorem applies: the seller's expected revenue from an all-pay auction equals that from a first-price or second-price auction with the same bidder distribution.

### The Winner's Curse (Common Values)
- **What it is:** When an item has a common unknown value (e.g., the resale price of an asset, the oil in a tract of land), the winner of an auction should expect to have over-estimated the value — because winning means your estimate was the highest among all bidders.
- **Why it matters:** This is a systematic bias that causes winners to pay too much and potentially lose money. It has been empirically documented in oil-lease auctions, corporate takeovers, and sports contract offers.
- **How it works:** Suppose the true value is v, and each bidder i has an estimate v_i = v + x_i where x_i is random noise with mean 0. If all bidders bid their estimate, the winner is the one with the highest x_i — meaning the winner has the most positive error. Learning that you won is bad news: it signals your estimate was likely an over-estimate. Rational bidders should therefore bid not their raw estimate v_i, but their estimate conditional on winning — which is lower. The adjustment is larger with more bidders (more noise in the pool) and is present even in second-price formats.
- **Key quote or example:** "This is known as the winner's curse, and it is a phenomenon that has a rich history in the study of auctions. Richard Thaler's review of this history notes that the winner's curse appears to have been first articulated by researchers in the petroleum industry."
- **Connection:** The winner's curse breaks the dominant-strategy result of second-price auctions: with common values, bidding your estimate v_i is no longer optimal, because winning reveals information that makes v_i an over-estimate.

### Equilibrium Bidding in First-Price Auctions: The Revelation Principle and Optimal Bid Functions
- **What it is:** Using the Revelation Principle and differential equations, we can derive the exact equilibrium bid function s(v) for first-price auctions under any number of bidders and any value distribution.
- **Why it matters:** This converts the intuitive "shade your bid" insight into a precise, computable strategy, and provides the mathematical machinery to compare auction formats on revenue.
- **How it works:** For n bidders with values uniform on [0,1], the equilibrium strategy is s(v) = ((n-1)/n) * v. The derivation proceeds as follows: bidder i with value v_i wins with probability v_i^(n-1) (the probability all n-1 others have lower values). Expected payoff is G(v_i) = v_i^(n-1) * (v_i - s(v_i)). The Revelation Principle lets us analyze deviations as if the bidder "supplies a fake true value" to the strategy function. The equilibrium condition — no profitable deviation — yields the differential equation s'(v_i) = (n-1)(1 - s(v_i)/v_i), which is solved by s(v_i) = ((n-1)/n) * v_i. For general distributions F(·), the analogous equation is s'(v_i) = (n-1)(f(v_i)v_i - f(v_i)s(v_i))/F(v_i).
- **Key quote or example:** Equation (9.3): G(v_i) = v_i^(n-1)(v_i - s(v_i)). The equilibrium solution: s(v_i) = ((n-1)/n) * v_i.
- **Connection:** This confirms the earlier intuition that more competitors force more aggressive bidding. With n=2, you bid half your value. With n=10, you bid 9/10 of your value.

### Revenue Equivalence Theorem
- **What it is:** Under independent private values drawn from the same distribution, the seller's expected revenue is identical across all standard auction formats — first-price, second-price, and all-pay — when bidders follow equilibrium strategies.
- **Why it matters:** This is a landmark result in economics. It means the choice between auction formats is not primarily about revenue (they all yield the same), but about other factors like simplicity, robustness to irrational behavior, and the information revealed.
- **How it works:** For n bidders with values uniform on [0,1]: in a second-price auction, bidders bid truthfully and the seller collects the second-highest value. The expected second-highest of n uniform draws is (n-1)/(n+1). In a first-price auction, the winner bids ((n-1)/n) * v_winner. The expected highest value is n/(n+1), so the expected winning bid is ((n-1)/n) * (n/(n+1)) = (n-1)/(n+1). The two revenues are identical. The all-pay auction yields the same expected revenue for the same reason. Revenue equivalence holds broadly: for any auction where the item goes to the highest-value bidder and a bidder with value 0 expects payoff 0, the seller's expected revenue is the same.
- **Key quote or example:** "The two auctions provide exactly the same expected revenue to the seller!"
- **Connection:** Revenue equivalence explains why sellers' main concern about auction format is commitment credibility — if the seller can deviate from the announced format after observing bids (e.g., by renegotiating after a second-price auction reveals bidders' values), the mechanism breaks down.

### Reserve Prices
- **What it is:** A reserve price r is a minimum acceptable bid announced before the auction. The item is only sold if the highest bid meets or exceeds r.
- **Why it matters:** Even a seller who values the item at zero benefits from setting a positive reserve price, because it forces bidders to bid more aggressively to meet the threshold. The optimal reserve price is strictly greater than the seller's own value for the item.
- **How it works:** In a second-price auction with a single bidder whose value is uniform on [0,1] and a seller with value u=0: with no reserve, the seller's expected revenue is 0 (the one bidder always wins at a second-price of 0). With reserve price r, the item sells only when the bidder's value exceeds r (probability 1-r), yielding revenue r. Expected revenue = r(1-r), maximized at r = 1/2. If the seller's value is u > 0, the optimal reserve is r = (1+u)/2. The reserve price essentially simulates an additional bidder — and truthful bidding remains a dominant strategy in a second-price auction with reserve, because the reserve is equivalent to the seller bidding r.
- **Key quote or example:** "It is in fact useful for the seller to declare a reserve price even if his value for the item is u=0."
- **Connection:** Reserve prices link back to the commitment theme: a seller who announces a reserve and then sells below it when no bids qualify destroys his credibility and unravels the mechanism.

## 🔑 Key Takeaways

1. Auctions make sense when buyers have private information about their values that the seller cannot observe; with known values, a posted price suffices and captures all surplus.
2. In a second-price (Vickrey) auction, bidding your true value is a dominant strategy — optimal regardless of what all other bidders do, even irrational ones.
3. In a first-price auction, you must shade your bid below your true value; the optimal shade with n bidders on [0,1] is exactly 1/n of your value (you bid (n-1)/n of your true value).
4. More competitors in a first-price auction means less bid shading — you must bid more aggressively as the competitive field grows.
5. Dutch (descending-bid) auctions are strategically equivalent to first-price sealed-bid auctions; English (ascending-bid) auctions are strategically equivalent to second-price sealed-bid auctions.
6. The Winner's Curse: winning a common-value auction is bad news, because it means your estimate of the value was the highest — and therefore likely an over-estimate. Rational bidders adjust downward.
7. Revenue Equivalence Theorem: first-price, second-price, and all-pay auctions all yield identical expected revenue to the seller when bidders have independent private values and follow equilibrium strategies.
8. The seller benefits from being able to credibly commit to an auction format in advance. Inability to commit — for example, renegotiating after the auction reveals bidder values — can unravel the mechanism entirely.
9. Setting a reserve price above your own value for the item strictly increases expected seller revenue; the optimal reserve price is halfway between the seller's value and the maximum possible bidder value (in the single-bidder uniform case).
10. All-pay auctions model lobbying and competition where costs are sunk before the outcome; equilibrium bids are much lower than in first-price auctions, but seller revenue is the same.

## 🗺️ Mental Model / Framework

Think of an auction as a two-layer game. The first layer is the **information layer**: does the seller know buyers' values? If yes, a posted price extracts all surplus — no auction needed. If no, an auction is a mechanism for revealing that hidden information.

The second layer is the **strategic layer**: once you choose an auction format, you've defined the rules of a game, and rational players adapt. The four formats split into two strategic pairs:

- Dutch / First-price: "What is the most I'd pay to definitely win?" — bid shading required; you pay what you bid.
- English / Second-price: "What is the maximum price at which I'd still want the item?" — truthful bidding is dominant; you pay what the runner-up bid.

Across both pairs, a deeper principle operates: **revenue equivalence**. Even though the strategies are completely different, the two channels of revenue — how much people bid and how likely they are to win — adjust to cancel out, leaving the seller with identical expected revenue. Changing the auction format is like squeezing a water balloon: what you gain in one dimension is offset by a loss in another.

Reserve prices add a third lever: by setting a floor, the seller effectively "bids against herself," extracting more revenue even when competition is thin.

## 💡 "Aha!" Moments

1. **Second-price auctions are not charity.** At first glance, a seller who uses a second-price auction seems to be giving away money — why collect the second-highest bid instead of the highest? The aha is that this ignores strategic response: in a first-price auction, bidders shade their bids so that the winning bid is lower, and the reduction exactly cancels the first-price format's apparent advantage. Revenue equivalence shows the seller gets the same amount either way. The second-price rule is not generosity; it's mechanism design.

2. **Winning is evidence that you over-estimated.** In a common-value auction, there are many bidders each with a noisy estimate of the true value. If you win, it means everyone else bid lower — which means their estimates were lower. The most natural reason their estimates were lower is that your estimate was unusually high, i.e., unusually wrong in the upward direction. So winning an auction over many competitors is systematically bad news about whether you got a good deal. This is deeply counterintuitive: the act of winning is itself a signal that you may have overbid.

3. **Lobbying is an all-pay auction.** The parallel between political lobbying and an all-pay auction reveals something disturbing: in lobbying, everyone who spends money loses that money regardless of the outcome. The "winner" (the side that gets the policy they want) gains the value, but all losers have paid their "bids" (lobbying expenditures) for nothing. Revenue equivalence then implies the total resources dissipated in a lobbying competition are equivalent to what a seller would collect in a standard auction — a pure deadweight loss from society's perspective.

## 🔗 Connections to Other Chapters

This chapter builds directly on **Chapter 8** (traffic equilibrium and game theory applied to networks) as a second major application of game-theoretic reasoning to economic behavior. The tools of Nash equilibrium, dominant strategies, and payoff analysis from **Chapter 6** are applied throughout — particularly in the formal treatment of second-price and first-price auctions as games.

The chapter explicitly anticipates **Chapter 12** (bargaining), noting that when both buyer and seller know each other's values but neither can commit to a mechanism, bargaining takes place — making commitment the key distinguishing feature of auctions.

Most importantly, the chapter sets up **Chapter 15** (keyword advertising auctions), where search engines like Google and Yahoo run generalized second-price auctions to sell advertising slots. The second-price mechanism and the concept of truthful bidding developed here are directly extended to multi-slot, multi-bidder environments in that chapter.

The private-values framework developed here also connects to the treatment of **markets with multiple buyers and sellers connected by networks** in later chapters, where the ideas about surplus allocation and mechanism commitment reappear in more complex matching contexts.

## 📝 In My Own Words (ELI5)

Imagine you found something cool — say, a rare baseball card — and you want to sell it. The problem is you have no idea how much people would pay for it. Different collectors might value it very differently, and they won't just tell you their price because they'd rather pay less.

So you run an auction.

There are four ways to do this. In an **English auction** (like eBay), you start low and keep raising the price until only one person still wants it at that price. In a **Dutch auction** (like a flower market in the Netherlands), you start high and lower the price until someone grabs it. In a **first-price sealed auction**, everyone writes their offer on a piece of paper, you open them all, and the highest offer wins — and pays that price. In a **second-price auction**, same thing, but the winner only pays the second-highest offer.

Here's the surprising part about second-price auctions: the smartest thing to do is to write down exactly what the card is really worth to you — your honest value. Why? Because your bid only decides whether you win or lose, not what you pay. What you pay is whatever the next person offered. So if you bid lower to try to save money, you might lose the auction when you could have won and still gotten a good deal. If you bid higher, you might win but pay more than you wanted. The honest bid is always best.

First-price auctions are trickier. If you write down exactly what it's worth to you and win, you pay your whole value and get nothing out of the deal. So instead you shade your bid — you write down something less. But how much less? That depends on how many other people are bidding. Lots of competitors means you can't shade much, because someone else will outbid you. Few competitors means you can shade more.

Here's the mind-blowing part: even though second-price and first-price auctions lead to completely different bids, the seller ends up with the same amount of money on average. The bidders shade their bids in first-price auctions by exactly the right amount to compensate for the seller getting only the second-highest bid in a second-price auction. It all evens out. This is called revenue equivalence.

Now there's a catch when people are bidding on something they plan to resell — like an oil field or a painting for investment. In that case, everyone is guessing the same unknown future value. If you win the auction, it means your guess was higher than everyone else's. But the other people had roughly the same information as you — so if they all guessed lower, maybe your guess was just too optimistic. Winning is actually a warning sign that you over-paid. This is the Winner's Curse, and smart bidders account for it by shading their bids even further down.

Finally, even if you (the seller) don't care about the card at all, you should still announce a minimum price — a reserve price. Why? Because it forces bidders to bid higher to have a chance of winning. A reserve price halfway between your value and the maximum anyone would pay is actually the best strategy for maximizing what you earn.