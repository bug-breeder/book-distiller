# Practice Exercises: Chapter 17 — Network Effects

## 🧪 Comprehension Check

**Q1:** In a market without network effects, the equilibrium quantity x* is socially optimal. Why does adding network effects destroy this social optimality, and what is the direction of the distortion?

<details>
<summary>Answer</summary>

Without network effects, each consumer's decision affects only herself, so the market price correctly reflects all costs and benefits and the equilibrium x* maximizes social welfare. With network effects, each new buyer raises the value of the product for all existing buyers — a positive externality that the new buyer does not receive compensation for and does not take into account. This means potential buyers just above the equilibrium threshold z* choose not to buy, even though their joining would generate benefits for existing buyers that outweigh their own personal loss. As a result, markets with network effects systematically underprovide the good relative to the social optimum: the equilibrium audience size is too small.

</details>

---

**Q2:** What makes the equilibrium z' in a network-effects market a "tipping point" rather than just an ordinary unstable equilibrium, and what are the practical consequences for firms trying to launch a new product?

<details>
<summary>Answer</summary>

The equilibrium z' is unstable in a very specific, asymmetric way: any perturbation drives the system strongly away from z', not back toward it. If actual adoption falls even slightly below z', downward pressure accelerates the decline toward zero users. If adoption rises slightly above z', upward pressure propels the market toward the high stable equilibrium z''. This means a firm cannot grow gradually from a small user base — the product is essentially worthless until adoption crosses z'. Practical consequences are stark: firms must achieve a critical mass of users before the tipping point through strategies like introductory free pricing, subsidizing early adopters, or targeting influential "fashion leaders," because any strategy that hopes to slowly accumulate users will fail if it never gets past z'.

</details>

---

**Q3:** The chapter introduces "self-fulfilling expectations equilibria." Explain what this concept means mathematically (using the equation p* = r(z)f(z)) and why it leads to multiple equilibria when network effects are present.

<details>
<summary>Answer</summary>

A self-fulfilling expectations equilibrium at quantity z means: if everyone believes that exactly a z fraction of the population will buy the product, then exactly a z fraction will in fact want to buy it at the going price. For a consumer x who expects z users, her willingness to pay is r(x)f(z) — the product of her intrinsic interest r(x) and the network benefit f(z). The marginal buyer at the boundary of adoption is consumer z, who is just willing to pay the price, giving the equilibrium condition p* = r(z)f(z). Because f(z) is increasing in z, the function r(z)f(z) is not simply decreasing — it rises first as the network benefit grows, then falls as z approaches 1 and r(z) approaches 0. This inverted-U shape means a horizontal price line p* can intersect r(z)f(z) at zero, one, or two interior points, producing multiple possible equilibria simultaneously. The same price and same product can result in zero adoption or large adoption depending entirely on what consumers believe.

</details>

---

**Q4:** The dynamic model replaces the static equilibrium concept with a function g(z) that maps shared expectations to actual outcomes. How does the relationship between the curve z-hat = g(z) and the 45-degree line z-hat = z determine which equilibria are stable and which are unstable?

<details>
<summary>Answer</summary>

The function g(z) gives the actual fraction of people who purchase when everyone expects a z fraction to purchase. An equilibrium requires that expectations are fulfilled, i.e., g(z) = z — precisely the points where the curve z-hat = g(z) intersects the 45-degree line z-hat = z. Stability depends on how the curve crosses the line. At a crossing where the curve rises from below the line to above it (crossing from below), there is upward pressure when z is slightly below and downward pressure when z is slightly above — meaning perturbations return to the crossing, making it stable. At a crossing where the curve falls from above the line to below it (crossing from above), both sides push away from the point, making it unstable. This pictorial analysis, pioneered by Granovetter and Schelling in the 1970s, shows that stable equilibria attract the population from surrounding starting points while unstable equilibria act as branch points that the system flies away from.

</details>

---

**Q5:** When individual effects are mixed with population-level effects (f(0) > 0), the chapter shows that small changes in price can cause discontinuous, dramatic jumps in equilibrium audience size. Explain the mechanism behind this "bottleneck" phenomenon and why it does not arise in the pure network-effects model (f(0) = 0).

<details>
<summary>Answer</summary>

When f(0) = 0, the product has zero value with zero users, so z = 0 is always a stable equilibrium and any organic growth must first push past an unstable tipping point — a requirement that blocks gradual growth from scratch. When f(0) > 0, the product has standalone value even to a single user, so z = 0 is no longer an equilibrium and an audience can grow organically from zero. However, the dynamics from zero may converge to a relatively small first stable equilibrium z*, because a "bottleneck" in the g(z) curve keeps the trajectory from reaching the much larger stable equilibrium z**. When the price is reduced slightly, the g(z) curve shifts upward, and the bottleneck near (z*, z*) disappears — the curve no longer crosses the 45-degree line in that region. The dynamics starting from zero now carry the audience all the way past the former obstacle to the high equilibrium near z**. This is discontinuous: a tiny price change converts a market with modest reach into one with mass adoption, because the bottleneck that was choking off growth suddenly becomes a passageway.

</details>

---

## 🔄 Apply It

**Scenario 1: Launching a B2B Collaboration Platform**
A startup has built a project-management and communication tool aimed at mid-sized law firms. The tool is technically superior to the market leader, but law firms only see value if their external co-counsel firms also use the same platform (for shared document access and messaging). The startup has a limited marketing budget and is deciding between offering the product free for six months to any firm that signs up versus targeting a small number of high-profile, well-connected firms for free.

*What should you consider?*
- Where is the tipping point (z') in this market, and which strategy is more likely to get above it?
- How does the network structure among law firms (who regularly co-counsels with whom) affect whether the population-level model or a more granular network model is the right tool to think with?
- What happens to the startup's revenue model after early subsidized adoption — can it raise prices post-tipping-point, and what does the stable equilibrium z'' look like?

<details>
<summary>Model Response</summary>

The core challenge is crossing the tipping point z', below which the product has minimal value (no co-counsel firms use it) and above which network effects accelerate adoption. Blanket free trials spread effort thinly and may not push any dense cluster of interconnected firms past z'; the "fashion leaders" strategy targets firms whose adoption would immediately create value for many others, exploiting the actual network topology rather than treating the market as a uniform population. Because law firm relationships are highly clustered (firms regularly work with a specific set of partners), the population-level model is an approximation — Chapter 19's cascading adoption in explicit networks is more precise here. Post-tipping, the startup can raise prices because the large user base raises every firm's willingness to pay through f(z); this is exactly the loss-leading introductory pricing strategy the chapter describes as viable when early losses are offset by later stable-equilibrium profits. The key risk is a competitor also subsidizing adoption and getting over its own tipping point first, potentially locking the market.

</details>

---

**Scenario 2: A Social Platform Facing a Rival**
An established social-networking site (Site A) has 60% market penetration. A new entrant (Site B) is objectively better — its user experience scores twice as high in every survey — but it currently has 5% penetration. Both sites have network effects: their value depends almost entirely on how many of your contacts use them. The CEO of Site B is considering whether to attempt a direct switch of users from Site A.

*What should you consider?*
- The chapter notes that being first over the tipping point matters more than being "best." What does this imply for Site B's prospects?
- How do multiple equilibria interact with consumer expectations? Can Site B shift consumer beliefs without yet shifting behavior?
- What specific strategies might lower z' for Site B or raise it for Site A, and what role does pricing play?

<details>
<summary>Model Response</summary>

Site A's 60% penetration almost certainly places it well above its own tipping point z'' — meaning it sits in the basin of a stable equilibrium that resists perturbation. Site B, despite superior quality, faces a critical problem: its r_B(x)f(z) function may be higher than Site A's r_A(x)f(z) at equal z, but at z = 5%, Site B's network value is tiny and Site A's is large. The chapter's competition analysis shows the inferior product that gets over its tipping point first can permanently dominate. Site B must focus on shifting shared expectations — making people believe Site B will be large — before actual behavior changes, because expectations are self-fulfilling. Strategies include securing high-visibility public commitments from anchor users (celebrities, institutions), offering free migration tools to reduce switching costs (which is effectively lowering p* for Site B's side), and targeting communities where Site A penetration is weakest so local tipping points are more reachable. Simultaneously, if Site B can increase switching costs on Site A (e.g., by encouraging exclusive content on its own platform), this raises z' for Site A's continued dominance in those segments.

</details>

---

**Scenario 3: The El Farol Problem at Work**
A company's IT department has mandated that all 200 employees use a shared internal wiki for documentation. The wiki is only useful if enough colleagues contribute; employees have privately told their managers that they will actively use it only if at least 100 others do. The HR team has noticed that in the first two months since launch, roughly 90 people are actively using it — well below the threshold — and participation is slowly declining each week.

*What should you consider?*
- Is this a positive-externality or negative-externality coordination problem, and what does that imply about the equilibrium structure?
- The dynamic model predicts convergence to stable equilibria. Where is this system converging given the current trajectory, and why?
- What intervention could shift the system past the tipping point, and how does the IT department's ability to make adoption mandatory change the analysis?

<details>
<summary>Model Response</summary>

This is a pure positive-externality coordination problem: the wiki's value rises as more people contribute, exactly the network-effects structure of Section 17.2. With f(0) = 0 (the wiki has no value if empty) and a threshold of 100, the tipping point z' corresponds to 100 users out of 200. At 90 users and declining, the system is below z' and in the basin of attraction of the z = 0 equilibrium — the dynamics predict further decline toward zero active users, consistent with the observed trend. The chapter's toolkit suggests two interventions: (a) lower the effective "price" (effort required) by providing templates, auto-population of content, or gamification that makes contributing easier for everyone, which shifts the tipping point downward; or (b) mandate adoption for a targeted group large enough to push observed usage above 100, which changes the initial condition so dynamics now point toward the high stable equilibrium. Mandatory adoption effectively solves the coordination failure by eliminating the expectational gap — employees no longer need to predict what others will do because the decision is made for them, which is precisely what removes the self-fulfilling property of the bad equilibrium.

</details>

---

## ✍️ Reflection Prompts

1. Think of a technology or platform you adopted because your colleagues, friends, or professional network were already using it — not because you thought it was the best option. What would you do differently now that you understand that your individual adoption decision contributed to locking in that platform's dominance, possibly at the expense of a better alternative?

2. Think of a time when a product or community you valued fell apart rapidly after a small number of key people left — the service became less useful, more people left, and the decline accelerated. What would you do differently now that you understand stable and unstable equilibria, and how you might have recognized the system was sitting near its tipping point before the collapse began?

3. Think of a situation where you were deciding whether to join a group activity — a professional association, an online community, a workplace initiative — and you held back because you weren't sure enough others would participate to make it worthwhile. What would you do differently now that you understand self-fulfilling expectations, and how might you have acted to shift shared beliefs rather than waiting passively for a threshold to be crossed on its own?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the concept of a tipping point in a network-effects market in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

Some products — like social media platforms or messaging apps — become more valuable to you the more other people use them, so your decision to buy depends on how many others you expect to buy. This creates a critical threshold: if the number of users is below it, the product feels too empty to be worth buying, so people stop, and the user base collapses toward zero; but if the number of users is above it, the product feels valuable enough that even more people join, pushing adoption up to a large stable level. This threshold is called the tipping point, and it explains why an inferior product that reaches mass adoption first can permanently beat a superior competitor that never manages to get enough early users to tip its market.

</details>

---

## 🧩 Synthesis Challenge

**Exercise:** In Chapter 6, you learned about Nash equilibria and coordination games, including the Hawk-Dove game structure where two players benefit from choosing different strategies. In Chapter 17, the El Farol Bar problem is shown to be a 100-player version of exactly this structure. Design an analysis of the following scenario using both frameworks:

A city has two coffee shops equidistant from a university. Each morning, 10 graduate students each independently decide which shop to visit. Each student's experience is best if no more than 5 others are at the same shop (otherwise it's too crowded to work), and worst if they are at a shop alone (no social energy). Identify the pure-strategy Nash equilibria and the mixed-strategy Nash equilibrium. Then analyze the dynamic stability of any outcome in which exactly 5 students go to each shop, using the Chapter 17 framework of whether this is a stable or unstable equilibrium.

**Chapters involved:** Chapter 17 + Chapter 6

---

## 📋 Action Items

1. On Monday morning before checking email, pick one platform or tool you currently use professionally (Slack, LinkedIn, a project management tool) and write down two concrete ways its value to you depends on how many of your colleagues use it — then estimate whether your organization's usage is above or below the tipping point where you think it becomes self-sustaining. This makes the abstract model concrete in your daily life.

2. Before your next team meeting this week, identify one internal initiative (a shared document system, a communication channel, a new process) that has stalled at low adoption. Apply the tipping-point framework: estimate the threshold needed for self-sustaining use, diagnose whether current adoption is above or below it, and propose one specific intervention — such as mandating a pilot group, reducing the effort to participate, or securing a visible commitment from a high-status team member — that could shift the system past the threshold.

3. Find one real-world example this week of a product that failed despite being technically superior to the market winner (Betamax vs. VHS, Google+ vs. Facebook, or a current example in your own industry). Write three sentences explaining the failure in terms of the chapter's concepts: which product crossed the tipping point first, why being first mattered more than being best, and what the losing product might have done differently in its early launch strategy to change the outcome.
