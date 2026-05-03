# Practice Exercises: Chapter 24 — Property Rights

## 🧪 Comprehension Check

**Q1:** The Coase Theorem states that it does not matter who initially owns a property right — only that someone owns it. But the chapter also notes a key qualification that makes this claim less universal. What is that qualification, and why does it matter in practice?

<details>
<summary>Answer</summary>

The Coase Theorem ignores transaction costs. It assumes that once property rights are assigned, the affected parties can bargain freely to reach a socially optimal outcome regardless of who the initial owner is. But when many parties are involved — as in the case of a polluting factory affecting thousands of people, or a crowded restaurant with many diners and employees — the costs of identifying all affected parties, negotiating with each of them, and repeatedly re-negotiating as conditions change can become prohibitively large. In those situations, direct regulation (like an outright ban or a cap-and-trade system) may be a more practical alternative to property-rights-based bargaining, even if tradeable rights are theoretically superior.

</details>

---

**Q2:** In the Tragedy of the Commons model, the equilibrium under free access results in a fraction x-bar of cattle equal to c — twice the socially optimal fraction c/2. Why does individual rationality lead every herder to keep adding cattle even though the collective outcome is zero total revenue?

<details>
<summary>Answer</summary>

Each individual herder faces a private incentive calculation: as long as the revenue per cow f(x) is positive, adding one more cow yields positive private returns. The herder captures the full private revenue from that cow but bears only a tiny fraction of the social cost — the marginal reduction in everyone else's revenue from increased crowding. This is the classic negative externality: the herder does not compensate the other users for the harm caused by adding to the commons. So every herder adds cattle until f(x) = 0, which in the model occurs at x = c. At that point, twice as many cattle are on the commons as is optimal, and total revenue collapses to zero — a clear case where individually rational behavior produces a collectively irrational outcome.

</details>

---

**Q3:** The chapter presents two very different mechanisms for fixing the Tragedy of the Commons: joint public ownership with a per-cow grazing fee, and outright private sale. Explain why both mechanisms lead to the same socially optimal outcome and the same revenue of c²N/4 for the village.

<details>
<summary>Answer</summary>

Under joint ownership with a grazing fee, the village sets the fee at c/2 per cow. A herder adds a cow only if the revenue from grazing exceeds the fee, so in equilibrium f(x) = c/2, which solves to x = c/2 — the optimal fraction. Total revenue is f(c/2) × (c/2)N = (c/2)(c/2)N = c²N/4. Under private sale, a single large owner internalizes all the crowding costs because they own all the cattle. They choose x = c/2 to maximize their own revenue — exactly the social optimum — and the maximum price the village can charge for that commons is the buyer's profit, also c²N/4. In both cases the key is that one decision-maker (the village charging a fee, or the private owner) bears the full social cost of crowding, eliminating the externality that caused overuse.

</details>

---

**Q4:** The chapter distinguishes between rivalrous and non-rivalrous goods, and argues that assigning property rights to non-rivalrous goods creates an inefficiency that does not arise with rivalrous goods. Explain this distinction precisely and identify why the village green and a copyrighted song sit on opposite sides of the analysis.

<details>
<summary>Answer</summary>

A rivalrous good is one whose use by one person prevents or degrades its use by others — one cow's grazing depletes the grass available to another cow, and one person drinking a can of Diet Coke means there is one fewer can for others. A non-rivalrous good can be used by unlimited people simultaneously without diminishing availability — a song played by one listener is equally available to everyone else. For rivalrous goods, property rights and access restrictions are necessary to prevent overuse, as Hardin showed. For non-rivalrous goods, restricting access through property rights (e.g., charging for a copyrighted song) causes inefficiency because there is literally zero marginal cost to allowing one more person to use the good, so excluding anyone is socially wasteful. The village green is rivalrous (cows crowd each other out), so property rights improve efficiency; a copyrighted song is non-rivalrous, so property rights reduce efficiency of use even while they provide incentives for creation.

</details>

---

**Q5:** The chapter frames copyright and patent law as attempts to solve a genuine tension between two goals. Describe both sides of that tension and explain why the optimal solution cannot simply maximize either goal alone.

<details>
<summary>Answer</summary>

The tension is between providing incentives for creative or inventive activity and ensuring efficient use of the creation once it exists. Without intellectual property protections, creators cannot easily profit from their work — especially in the digital age when copying is cheap — so they have weaker financial incentives to create, and the total amount of socially valuable creative output may fall below the optimum. With strong intellectual property protections, the creator gains a monopoly and charges a price above the zero marginal cost of distributing the work, preventing some potential users from accessing it even though letting them access it would cost society nothing. Maximizing either goal alone fails: zero protection leads to potentially too little creation; infinite protection leads to permanent monopoly and massive inefficiency of use. The law therefore tries to strike a balance — copyright lasts for the creator's life plus 70 years, patents last 20 years — but the right balance is empirically contested and context-dependent (e.g., pharmaceutical R&D requires far larger upfront investment than writing a novel, making the case for patents stronger there).

</details>

---

## 🔄 Apply It

**Scenario 1: The Shared Office Kitchen**
A startup has a communal kitchen stocked with snacks paid for by the company. There is no tracking system, and any employee can take any item at any time. By the end of each week, popular items disappear by Tuesday and complaints escalate about "freeloaders." The office manager is considering several solutions: an honor-system sign-out sheet, a per-item charge deducted from payroll, or simply locking the kitchen and replacing snacks with a monthly lunch budget.

*What should you consider?*
- Is this a rivalrous or non-rivalrous resource, and what does that imply about whether a property rights solution is appropriate at all?
- How do transaction costs affect which of the three proposed mechanisms is most practical given the small scale and ongoing nature of the problem?
- How does the Tragedy of the Commons model apply here, and what fraction of snack consumption should be targeted as "optimal"?

<details>
<summary>Model Response</summary>

The shared snacks are rivalrous: one employee eating a granola bar means it is gone for everyone else, exactly like a cow grazing on the commons. This makes the situation a genuine Tragedy of the Commons, and some form of usage constraint is theoretically warranted. The honor-system sign-out sheet establishes a record but provides weak enforcement — it reduces the incentive to over-consume only slightly. A per-item charge is closest to the village-green grazing fee model: it internalizes the cost of taking an item and would drive consumption toward the level the company deems optimal. However, transaction costs matter enormously here: payroll deductions for $1.50 granola bars generate administrative overhead and resentment disproportionate to the savings. The locked kitchen / lunch budget approach essentially privatizes the snack-purchasing decision by giving employees a fixed budget to spend on their own food, eliminating the commons entirely. The optimal choice depends on the severity of overuse and the administrative cost of each mechanism — the Coase Theorem predicts the outcome will be the same whichever mechanism is chosen as long as it clearly assigns the resource, but the distributional and morale consequences differ substantially.

</details>

---

**Scenario 2: A City's Open-Access Bike-Share Program**
A mid-sized city launches a dockless e-bike share with no per-minute fee — bikes are free to ride, funded by a municipal subsidy. Within three months, bikes are found abandoned in rivers, locked to private fences in residential backyards, and clustered in affluent neighborhoods while underserved areas have none. Ridership is very high but the city is spending twice the projected maintenance budget.

*What should you consider?*
- Does the absence of a price create a Tragedy of the Commons dynamic, and if so, what specific externality is each rider imposing on others?
- What property-rights-based solutions does the chapter suggest, and how would they translate to this setting?
- Is the bike itself rivalrous, and does that change the analysis compared to an information good like a city-published cycling map?

<details>
<summary>Model Response</summary>

Yes, this is a Tragedy of the Commons. Each rider who uses a bike, parks it inconveniently, or misuses it imposes costs on future riders (reduced availability) and on the city (higher maintenance costs) without bearing those costs themselves. The bikes are rivalrous — one person riding a bike makes it unavailable to anyone else — so the Hardin framework applies directly. The socially optimal use level is not zero bikes but a level at which the marginal social benefit of an additional ride equals the marginal social cost (maintenance, redistribution labor, congestion in popular areas). Property-rights solutions from the chapter's framework include: (1) per-minute pricing that internalizes marginal costs, analogous to the per-cow grazing fee; (2) selling exclusive operating rights to a private company, analogous to selling the commons, with the company then setting prices to maximize revenue subject to demand. A municipal cycling map, by contrast, is non-rivalrous — one person reading it does not reduce its availability — so charging for it would create inefficiency without solving any commons problem. The city should implement per-minute pricing scaled to cover marginal maintenance costs, possibly with low-income subsidies to preserve access equity.

</details>

---

**Scenario 3: An Independent Software Developer's Dilemma**
A solo developer has spent two years building a novel algorithm for compressing medical imaging files that reduces storage costs by 40%. She must decide whether to patent the algorithm (20-year exclusivity), release it as open-source software, or simply use it privately in her own consulting practice. Each choice has different implications for who benefits and how much she personally profits.

*What should you consider?*
- How does the non-rivalrous nature of software and algorithms affect the social cost of each option?
- What does the chapter's analysis of patents predict will happen to adoption rates if she patents and charges licensing fees versus releasing openly?
- Under what conditions does the patent route generate more total social value, and under what conditions does open-source generate more?

<details>
<summary>Model Response</summary>

The algorithm is non-rivalrous: one hospital using it to compress scans does not reduce another hospital's ability to use the same algorithm. This means the socially optimal price for licensing the algorithm is zero — any positive price will exclude some hospitals that would benefit, at no cost savings to anyone else. Patenting and charging licensing fees introduces exactly the monopoly inefficiency the chapter describes for intellectual property: some users who value the algorithm less than the license fee will not adopt it, even though letting them use it would cost the developer nothing. On the other hand, if the developer cannot monetize her two years of work, she has weaker incentives to invest similar effort in the future, and other developers face weaker incentives as well. The patent route generates more total social value when: (1) the R&D investment required is large relative to the developer's ability to self-fund; (2) adoption is relatively price-inelastic (hospitals will pay regardless); or (3) the algorithm needs expensive ongoing maintenance. Open-source generates more total social value when adoption is highly price-sensitive (many potential users are resource-constrained clinics), when rapid widespread adoption creates network effects, or when community contributions will improve the algorithm faster than solo development. The chapter's framework predicts that the developer's private optimum (maximize personal profit) will not align with the social optimum (maximize total adoption) under a patent regime.

</details>

---

## ✍️ Reflection Prompts

1. Think of a shared resource you use regularly — a neighborhood park, an office printer, a shared cloud storage drive, or a group chat. Have you ever witnessed it being overused or degraded because no one felt responsible for its upkeep? Now that you understand the Tragedy of the Commons and the role of property rights, what specific mechanism (a fee, a usage limit, private ownership, or a public governance rule) would you advocate for, and why would it be better than what currently exists?

2. Think of a creative work — a piece of software, a piece of music, a photograph, a written analysis — that you or someone you know produced and shared freely without any copyright enforcement. How did the absence of intellectual property protection affect the creator's incentive to produce similar work in the future? Would a limited-term copyright have changed the outcome, and who would have benefited or been harmed by it?

3. Think of a time when you negotiated (formally or informally) with someone over a resource that both of you wanted to use — a shared car, a vacation date, a budget line at work. Did the negotiation reach a mutually agreeable outcome? In light of Coase's Theorem, what role did the clarity of "who had the right" play in whether the negotiation succeeded, and how would the outcome have differed if the property right had been assigned to the other party?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the Coase Theorem — the most central insight of this chapter — in exactly 3 sentences to someone who has never studied economics.

<details>
<summary>Model Explanation</summary>

When two people disagree over who gets to do something — like whether one can smoke while the other breathes — what matters most is not who gets handed the right at the start, but simply that someone gets a clear, tradeable right. Once that right exists, the two people can negotiate: if the benefit to the smoker is worth more than the harm to the non-smoker, the smoker will pay enough to buy the right, and smoking will happen; if the harm is greater, no deal is struck, and smoking stops — exactly the outcome that is best for both of them together. The catch is that this works cleanly only when negotiating is cheap, which is why real-world solutions like anti-pollution laws or cap-and-trade systems are often needed when many people are affected and individual bargaining becomes impractical.

</details>

---

## 🧩 Synthesis Challenge

**Exercise:** In Chapter 8, the book analyzed traffic congestion as a negative externality where each driver adds to congestion costs borne by all other drivers, and showed that a congestion toll set equal to the marginal external cost drives traffic to the socially optimal level. Now apply both the Coase Theorem framework from Chapter 24 and the Tragedy of the Commons model from Chapter 24 to a city highway with free access. First, model the highway as a commons: define what the "revenue per cow" function corresponds to in this setting, identify the free-access equilibrium versus the optimal usage level, and calculate what per-trip toll would achieve the optimum. Second, apply Coase's Theorem: describe two alternative initial property rights assignments (e.g., drivers have the right to use the road freely versus residents have the right to congestion-free air) and explain how negotiation under each assignment would — in theory — reach the same socially optimal traffic volume, and why in practice the transaction costs make direct tolling more feasible.

**Chapters involved:** Chapter 24 + Chapter 8

---

## 📋 Action Items

1. On Monday morning before checking email, identify one shared resource in your household, workplace, or community that shows signs of overuse or degradation (a clogged shared inbox, an overgrown communal garden, a shared budget that runs out mid-month). Write down in one paragraph which of the chapter's mechanisms — per-unit pricing, usage quotas, private ownership, or public governance with rules — would most plausibly fix the problem and why, given the transaction costs involved in your specific situation.

2. Before your next work meeting this week, look up the patent or copyright status of one technology or piece of content your organization relies on (a software library, a dataset, a stock photo service, a research paper). Note how long the protection lasts, estimate what it costs your organization, and ask yourself whether the creator's incentive problem was large enough to justify that cost — writing a two-sentence answer in your notes.

3. This week, the next time you are in a negotiation over a shared resource — scheduling a meeting room, splitting a bill, dividing a work assignment — explicitly name who has the default "right" at the start of the conversation. Observe whether naming that baseline speeds up or changes the negotiation, and note afterward whether the final outcome would have been different if the default right had been assigned to the other party, as Coase's Theorem predicts it should not be.
