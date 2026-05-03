# Practice Exercises: Chapter 15 — Sponsored Search Markets (Part 1: Setup and Introduction)

## 🧪 Comprehension Check

**Q1:** Why is a cost-per-click (CPC) pricing model more economically meaningful to advertisers than a cost-per-impression model, and what does a click signal about a user that a mere query does not?

<details>
<summary>Answer</summary>

A cost-per-impression model charges advertisers simply for having their ad displayed, regardless of whether any user engages with it — analogous to buying a billboard that people may or may not notice. A click represents a significantly stronger signal of intent: the user issued a relevant query, read the ad, and chose to visit the advertiser's site. This means advertisers are paying only for users who have expressed active, layered interest, making the expected return on each dollar spent far more predictable and defensible. The CPC model aligns advertiser costs directly with measurable user behavior rather than passive exposure.

</details>

**Q2:** Why is it impractical for a search engine to simply post fixed prices for keyword advertising slots the way a store posts prices for goods on a shelf?

<details>
<summary>Answer</summary>

The keyword advertising market involves an enormous and constantly shifting number of possible queries — from common terms like "mortgage" to hyper-specific ones like "calligraphy pens" — each attracting a different and changing pool of potential advertisers. Maintaining accurate, fair prices for every keyword combination in the face of continuously fluctuating advertiser demand would be operationally infeasible. Auctions solve this problem by letting the market itself discover prices: advertisers submit bids that reflect their own valuations, and the auction mechanism aggregates this dispersed private information into prices without the search engine needing to know each advertiser's willingness to pay in advance.

</details>

**Q3:** There are multiple ad slots on a single search results page, and higher slots are more expensive. What economic principle underlies this price differentiation, and why does slot position matter?

<details>
<summary>Answer</summary>

The principle is that different slots deliver different quantities of a valuable good — user clicks. Empirical evidence shows that users click on higher-positioned ads at substantially greater rates than lower ones, so the top slot delivers more clicks per unit time than the second slot, and so on. Because advertisers ultimately care about traffic and conversions rather than mere ad display, a slot that generates more clicks is intrinsically more valuable. This heterogeneity in slot quality transforms the auction from a simple single-item problem into a multi-item matching problem where the allocation of advertisers to slots must account for the varying click-through rates of each position.

</details>

**Q4:** The text describes a "surprisingly deep connection" between sponsored search markets and the auctions and matching markets discussed in Chapters 9 and 10. What is the conceptual link, and why is it non-obvious?

<details>
<summary>Answer</summary>

The non-obvious connection is that when valuations are known, assigning advertisers to ad slots is mathematically equivalent to a matching market: you have a set of "buyers" (advertisers) with heterogeneous valuations and a set of "goods" (slots) with heterogeneous qualities, and the goal is to find an efficient allocation and supporting prices. The deep part is that this structure, which appears naturally in labor markets and housing markets, re-emerges in the entirely different context of millisecond-scale online auctions driven by user search behavior. The further complication — that valuations are private and must be elicited through bidding — connects it to the single-item auction theory of Chapter 9, making sponsored search a multi-slot generalization of the second-price sealed-bid auction.

</details>

**Q5:** Why do queries like "mesothelioma" or "loan consolidation" command cost-per-click prices of $50 or more, while a query like "calligraphy pens" costs only around $1.70 per click? What does this price difference reveal about how advertisers think about the value of a click?

<details>
<summary>Answer</summary>

The CPC price an advertiser is willing to pay reflects their expected profit from a single additional visitor who arrives via that click. A user searching for "mesothelioma" is likely someone recently diagnosed with a serious illness who may be actively seeking legal representation — a potential client worth tens of thousands of dollars in legal fees to a law firm. A user searching for "calligraphy pens" is a hobbyist or craftsperson whose expected purchase value is modest. Advertisers are essentially setting bids equal to (or just below) their expected revenue per click, so extreme CPC prices are a direct market signal that the underlying commercial transactions at stake are extremely high-value. The price difference reveals that keyword advertising functions as a direct market for user intent, priced by the economic consequences of that intent.

</details>

---

## 🔄 Apply It

**Scenario 1: Launching a Niche E-Commerce Store**
You have just launched an online store selling handmade wooden chess sets. Your average order value is $180 and your profit margin is 40%, giving you roughly $72 in profit per sale. You want to run keyword ads on Google for the term "handmade chess sets" and need to decide the maximum you should bid per click.

*What should you consider?*
- What is your conversion rate — out of every 100 visitors who click your ad, how many actually purchase? This determines your expected profit per click.
- At what CPC does advertising become unprofitable, and how does competition from other chess retailers affect where prices actually land?
- Should you bid differently on exact-match ("handmade chess sets") versus broader queries ("chess sets"), given the intent signal each carries?

<details>
<summary>Model Response</summary>

Start with the economics of a single click. If your profit per sale is $72 and your conversion rate is, say, 2% (a reasonable e-commerce baseline), your expected profit per click is $72 × 0.02 = $1.44. This is your break-even CPC — bidding above this means you lose money on average. In practice you should bid somewhat below this to preserve margin. The chapter's framework makes clear that this private valuation is exactly what you should be submitting in the auction: your true expected value per click. If competitors have higher margins or better conversion rates, they can sustainably outbid you and occupy higher slots, which is economically efficient — the slot goes to whoever values it most. You might also recognize that "handmade chess sets" is a higher-intent query than "chess sets," so a user clicking from the former query is more likely to convert, justifying a higher bid for that specific keyword. Finally, you should track actual conversion data and update your bids regularly, since your initial conversion rate estimate may be wrong.

</details>

**Scenario 2: A Hospital System Evaluating Ad Spend**
A regional hospital network is considering bidding on medical keyword terms like "back pain specialist" and "knee replacement surgery." They know from patient data that a new surgical patient generates, on average, $15,000 in revenue and that roughly 0.5% of people who click their ad ultimately become patients.

*What should you consider?*
- How does the hospital's expected value per click compare to the stratospheric CPCs the chapter describes for high-stakes medical queries?
- Is it rational for the hospital to bid high even if the CPC seems shockingly expensive in absolute terms?
- How does the quality and specificity of the keyword affect the conversion rate assumption?

<details>
<summary>Model Response</summary>

The hospital's expected value per click is $15,000 × 0.005 = $75. This means the hospital could rationally bid up to $75 per click before advertising becomes unprofitable — which falls squarely within the range the chapter describes for high-stakes medical and legal queries. The seemingly "outrageous" CPC is not irrational at all; it is a rational equilibrium outcome driven by the enormous value of the underlying transaction. The chapter's insight applies directly: CPC prices reflect advertisers' estimates of expected revenue per clicking user, and in markets where the downstream transaction is worth thousands of dollars, $50–$75 per click is entirely defensible. Additionally, a query like "knee replacement surgery cost" is likely to carry a higher conversion rate than "knee pain," because the former user is further along the decision funnel — demonstrating how keyword specificity affects the valuation calculation and should lead to differentiated bids across keywords.

</details>

**Scenario 3: A Small Tutoring Company Competing Against Well-Funded Rivals**
You run a local math tutoring service and want to advertise on "SAT prep tutor." You discover that large national tutoring chains like Princeton Review and Kaplan are also bidding on this keyword and almost certainly occupy the top two slots. Your monthly budget is $500.

*What should you consider?*
- Given that higher slots get more clicks, should you always try to win the top slot, or can a lower slot still be profitable?
- How does the multi-slot structure of the auction change your strategy compared to a winner-take-all single-slot auction?
- Is there a keyword targeting strategy that might sidestep direct competition with larger rivals?

<details>
<summary>Model Response</summary>

The multi-slot structure the chapter introduces is directly relevant here: you do not need the top slot to benefit from keyword advertising. A lower slot delivers fewer clicks per day, but clicks it does deliver still carry strong purchase intent. If your margin per student justifies even a few clicks per week, a lower slot can be profitable even while the top slots go to better-funded competitors. This is a key insight from the matching-market framing: efficient allocation means each slot goes to whoever values it most given the price, and lower slots settle at lower prices, opening the door for smaller players. Strategically, you might also shift budget toward more specific, lower-competition keywords — "SAT math tutor [your city]" or "algebra tutoring for 9th graders" — where your local presence is a genuine differentiator and where the pool of competing bidders is much smaller, allowing you to occupy a top slot at an affordable CPC.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you searched for something online and clicked on a sponsored ad rather than an organic result. What was the query, and what does your click tell you — in retrospect — about the intent signal you were sending to advertisers at that moment? How does understanding the CPC model change how you interpret the ads you see?

2. Think of a time when you were trying to sell or promote something — a product, a service, an event, even yourself in a job application — and you paid for broad exposure (a flyer, a mass email, a general job board) rather than reaching people at the moment they expressed relevant interest. What would it have looked like to reach those people at their "receptive moment," and how might the outcome have differed?

3. Think of a business or organization you are familiar with that has not yet thought carefully about what a single customer is worth to them in dollar terms. Now that you understand that keyword bid prices are essentially a market's estimate of expected value per click, how would you go about calculating that number for your organization — and what would knowing it change about how you make spending decisions?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the cost-per-click auction model for keyword advertising in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

When you type a query into a search engine, companies that sell products related to your query compete in a rapid auction for the right to show you their advertisement alongside the results. Unlike traditional advertising where you pay just to be seen, these advertisers only pay when you actually click their ad — which means they are paying for a moment when you have already shown genuine interest in what they sell. Because slots higher on the page get clicked more often and are therefore more valuable, advertisers bid differently for each position, and the auction automatically sorts them so that the companies who value a click most end up in the best spots.

</details>

---

## 🧩 Synthesis Challenge

**Exercise:** In Chapter 9, we studied the sealed-bid second-price (Vickrey) auction for a single item and saw that truthful bidding — submitting your true valuation — is a dominant strategy. Now consider the sponsored search setting introduced in Chapter 15, where there are multiple ad slots of decreasing value (decreasing click-through rates). Design a thought experiment with 3 advertisers (Alice, Bob, Carol) and 2 slots (top slot delivers 100 clicks/day, bottom slot delivers 40 clicks/day). Assign each advertiser a private value per click: Alice = $3, Bob = $2, Carol = $1. (a) What is the socially efficient allocation — who should get which slot? (b) If this were a single-item auction for only the top slot, what would the second-price auction outcome be? (c) What new complications arise when you try to extend second-price logic to two slots simultaneously — specifically, what price should the winner of the top slot pay, and why can't you simply apply the single-item rule twice?

**Chapters involved:** Chapter 15 + Chapter 9

---

## 📋 Action Items

1. Before checking email on Monday morning, open Google and search for one product or service that your employer, your side project, or your own freelance work sells. Click "Sponsored" to see who is currently buying ads on that query, note the approximate number of ads shown, and estimate — based on the chapter's logic — what those advertisers likely believe a single click is worth to them. Write the number down.

2. This week, go to Google's Keyword Planner (free with a Google Ads account) and look up the estimated CPC range for three keywords relevant to a business you care about. For each keyword, work backward from the CPC to estimate what expected revenue per click an advertiser would need to justify that price at a 2% conversion rate. Compare this to actual transaction values in that market.

3. Pick one recurring purchase decision your organization makes that involves reaching potential customers or users broadly (a newsletter, a social post, a flyer). On Wednesday, write a one-paragraph memo to yourself estimating the expected value of one highly-intent visitor to your offering — what they might buy, at what margin, at what probability. Use this number to evaluate whether targeted keyword advertising would be more cost-effective than your current approach.
