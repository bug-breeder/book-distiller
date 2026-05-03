# Practice Exercises: Chapter 8 — Modeling Network Traffic and the Price of Anarchy

## 🧪 Comprehension Check

**Q1:** In the basic highway network (Figure 8.1), why does equal division of 4000 drivers across two routes constitute a Nash equilibrium, while any unequal split does not?

<details>
<summary>Answer</summary>

At equal split (2000 per route), each driver experiences 2000/100 + 45 = 65 minutes. If any driver switched to the other route, that route would then carry 2001 cars, giving a travel time of 2001/100 + 45 = 65.01 minutes — strictly worse. So no individual has an incentive to deviate, satisfying the definition of Nash equilibrium. For any unequal split where x drivers take one route and 4000 - x the other (x not equal to 2000), the two routes produce different travel times, and every driver on the slower route has a strict incentive to switch to the faster one, which means the configuration cannot be stable.

</details>

---

**Q2:** Braess's Paradox shows that adding a zero-cost road from C to D makes every driver worse off. What is the mechanism that causes this? Why can't drivers coordinate back to the better solution?

<details>
<summary>Answer</summary>

The zero-cost C-to-D link creates a new route A-C-D-B that dominates the original routes under any traffic pattern: regardless of what others do, taking A-C then the free link then D-B is always at least as fast as either original route. This makes A-C-D-B a dominant strategy, and so every self-interested driver piles onto it. With all 4000 on the two congestion-sensitive edges (A-C and D-B), each pays 4000/100 + 0 + 4000/100 = 80 minutes, worse than the 65-minute equilibrium before. Coordination back to the even split is impossible without external enforcement because any individual who unilaterally shifts to a pure route (A-C-B or A-D-B) would face 4000/100 + 45 = 85 minutes — so the incentive to defect back to the dominant strategy is always present.

</details>

---

**Q3:** The chapter defines "potential energy" of a traffic pattern as Energy(e) = T_e(1) + T_e(2) + ... + T_e(x) for each edge, summed over all edges. Why is this quantity more useful than social cost for tracking best-response dynamics, even though social cost seems more natural?

<details>
<summary>Answer</summary>

Social cost can move up or down during best-response dynamics — a driver switching to a less congested road reduces their own travel time but may or may not improve or worsen the aggregate. The potential energy, by contrast, is guaranteed to strictly decrease with every best-response move, because the net change in potential energy when a driver switches paths equals exactly the difference between their new travel time and their old travel time, which is negative by definition of a best response. Since potential energy can only take a finite number of distinct values and is strictly decreasing, best-response dynamics must eventually halt — proving equilibrium always exists. Social cost lacks this monotone property and therefore cannot serve as the progress measure.

</details>

---

**Q4:** The Roughgarden-Tardos result states that with linear travel-time functions, the social cost at any Nash equilibrium is at most 4/3 times the social optimum. How does the potential-energy framework used in the chapter establish the weaker (but easier to prove) bound of 2?

<details>
<summary>Answer</summary>

The argument chains three inequalities. For any edge with x drivers and a linear travel-time function T_e(x), the potential energy Energy(e) lies between (1/2) * x * T_e(x) and x * T_e(x), meaning (1/2) * Social-Cost(Z) <= Energy(Z) <= Social-Cost(Z) for any traffic pattern Z. When best-response dynamics moves from the socially optimal pattern Z to the equilibrium Z', potential energy can only decrease, so Energy(Z') <= Energy(Z). Chaining these: Social-Cost(Z') <= 2 * Energy(Z') <= 2 * Energy(Z) <= 2 * Social-Cost(Z). The factor of 2 arises because potential energy is sandwiched between half and all of social cost; the tighter 4/3 bound requires a more careful analysis that is beyond the chapter's scope.

</details>

---

**Q5:** Why does the Prisoner's Dilemma from Chapter 6 serve as a structural analogy to Braess's Paradox, and where does the analogy break down?

<details>
<summary>Answer</summary>

In the Prisoner's Dilemma, adding the option to Confess (a dominant strategy) makes both players worse off than the cooperative outcome where neither confesses — just as adding the C-to-D road creates a dominant strategy (use the new route) that leaves all drivers worse off. Both cases show that expanding the strategy space can destroy a good outcome by making defection individually rational. The analogy breaks down in scale and context: the Prisoner's Dilemma involves two players and a deliberate strategic setup by an adversary (the police), while Braess's Paradox involves thousands of self-interested agents and arises from a well-intentioned infrastructure investment. The intuitive wrongness of Braess's Paradox is therefore sharper — we expect road improvements to help, not hurt.

</details>

---

## 🔄 Apply It

**Scenario 1: The New Subway Line That Slowed Everyone Down**
A city opens a new subway connector between two busy transfer stations, offering near-zero wait time between lines. Transit planners celebrate the "upgrade," but within weeks average commute times across the whole network have increased. Riders and politicians are baffled.

*What should you consider?*
- Does the new connector act like the C-to-D free road — becoming a dominant strategy that attracts riders away from previously balanced routes onto two congestion-sensitive segments?
- What does the new equilibrium look like? Are there route combinations that were previously unattractive but are now dominant?
- Would temporarily closing the connector (as Seoul did with its highway) restore the better equilibrium, and how would you measure whether it worked?

<details>
<summary>Model Response</summary>

This is a textbook instance of Braess's Paradox in a transit network. The connector, because it has near-zero wait time, creates a new route that dominates previously used paths under any load condition. Rational commuters individually switch to this route, flooding the two congestion-sensitive legs (say, the feeder lines into each transfer station). The Nash equilibrium in the new network has everyone on the dominant route, producing higher aggregate travel times than the balanced split that existed before. To diagnose this, the planner should map the network as a directed graph, identify which edges have load-dependent travel times (the congestion-sensitive legs), and compute the equilibrium traffic pattern both with and without the connector. The fix is counterintuitive: close the connector during peak hours or impose a congestion toll on it to suppress the dominant-strategy effect and restore balance across routes. The Seoul case — where destroying a six-lane highway improved travel times — is the canonical real-world validation that this approach works.

</details>

---

**Scenario 2: Load Balancing in a Content Delivery Network**
An engineering team managing a content delivery network (CDN) adds a high-bandwidth, low-latency cross-link between two regional data centers to improve throughput. After deployment, end-to-end latency for users in both regions increases. The SRE team suspects the new link is causing problems but cannot explain why.

*What should you consider?*
- Internet routing protocols (like BGP or OSPF) perform something analogous to best-response dynamics — each router selects the locally best path. Does the new cross-link create a dominant routing path that concentrates traffic on two already-sensitive bottleneck links?
- What is the equilibrium traffic pattern before and after the cross-link? Compute the social cost (total latency across all flows) in both cases.
- Could a traffic-shaping policy (analogous to a toll on the C-to-D road) route some flows away from the dominant path to recover a better aggregate outcome?

<details>
<summary>Model Response</summary>

The CDN situation is structurally identical to Braess's Paradox: the new cross-link with near-zero latency connects two nodes in the middle of the network, creating a route that passes through two load-sensitive bottleneck links (the ingress and egress pipes of each data center). Routers, following best-path logic, all prefer the new route regardless of how loaded it is — the cross-link's low intrinsic cost makes it dominant under any traffic distribution. The equilibrium has all flows concentrated on those two bottleneck links, raising aggregate latency above the pre-upgrade level when flows were balanced across independent paths. The fix mirrors the paradox's resolution: implement traffic shaping or weighted equal-cost multipath (ECMP) routing that artificially limits the fraction of flows routed through the cross-link, forcing some traffic onto the previously-balanced paths. This is equivalent to imposing a toll — raising the perceived cost of the dominant path so that the equilibrium spreads load more evenly. The team can verify the diagnosis by computing the social optimum (minimum total latency) and confirming it is achievable only when some flows bypass the cross-link.

</details>

---

**Scenario 3: Designing Tolls After a Highway Expansion Makes Things Worse**
A regional toll authority built a new express connector between two congested corridors. Travel times worsened, and analysis confirms Braess's Paradox is operating. The authority cannot demolish the connector (political and contractual constraints), but it can set toll prices on any road segment. You are the consultant.

*What should you consider?*
- Which edge is acting as the "free C-to-D link" drawing all traffic? A toll on that edge raises its perceived travel cost, potentially suppressing the dominant strategy.
- What toll level would shift the equilibrium back to the balanced split that prevailed before the connector was built? Use the structure of the travel-time functions to compute it.
- Is there a revenue-neutral design (toll on one segment, subsidy on another) that restores the social optimum without net government expenditure — as illustrated in Exercise 4 of the chapter?

<details>
<summary>Model Response</summary>

The strategy is to use congestion pricing to internalize the externalities that individual drivers impose on each other. First, identify the connector edge that carries zero (or near-zero) intrinsic cost and is acting as the dominant-strategy magnet. A toll equal to the congestion cost imposed on others — the difference between the marginal and average travel time on the bottleneck edges — will shift individual incentives so that the socially optimal traffic pattern becomes a Nash equilibrium. Concretely, if the socially optimal split has x* drivers on the top route and the rest on the bottom, compute what toll on the connector makes a driver indifferent between the connector path and a pure route at that split. The toll revenue from the connector can be recycled as a subsidy on the bottleneck edges (reducing their perceived cost slightly) to design a revenue-neutral scheme, as the textbook's Exercise 4 illustrates. This approach is exactly what economists call "first-best" congestion pricing: prices are set so that private incentives align with social welfare, and the Nash equilibrium coincides with the social optimum.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you or your team added a resource — a new tool, an extra meeting, a shortcut process — that was supposed to make work faster but instead seemed to slow everyone down. Now that you understand Braess's Paradox and the mechanism by which dominant strategies can crowd out balanced solutions, what would you look for to diagnose whether that resource created a similar dynamic? What would you do differently?

2. Think of a situation in your workplace or community where individual people all acted rationally in their own interest, but the collective outcome was clearly worse for everyone — traffic, meeting scheduling, open-plan noise, shared resource exhaustion. What does the concept of Nash equilibrium versus social optimum reveal about why no one changed their behavior even though a better outcome was visible? What lever (analogous to a toll or road closure) might have been available to shift the equilibrium?

3. Think of a time when you were the "system designer" — setting up a process, a policy, or a platform — and you assumed that giving people more options would make outcomes better. What would you now stress-test before rolling out new options? How would you check whether a new option creates a dominant strategy that degrades collective performance, and how would you build in a mechanism to suppress or price that strategy if it does?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain Braess's Paradox in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

When everyone in a traffic network independently chooses the fastest route for themselves, the system settles into a stable state called a Nash equilibrium — where no single driver can improve their own travel time by switching. Adding a new, very fast road sounds like it should help, but it can create a shortcut that becomes irresistible to every driver individually, pulling all traffic onto two congested bottleneck roads and making everyone's commute longer than before. This is Braess's Paradox: a network "upgrade" can make the self-interested equilibrium worse for everyone, and the only fixes are counterintuitive ones like closing the new road or charging a toll to discourage its use.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** In Chapter 6, you learned that the Prisoner's Dilemma has a unique Nash equilibrium (both players Confess) that is strictly worse for both players than mutual cooperation (neither Confesses). In this chapter, you learned that adding a zero-cost edge to a traffic network can make the unique Nash equilibrium worse for all drivers than the equilibrium that existed without the new edge.

Now consider the following challenge: Construct a two-player version of a traffic game where each player controls a fleet of trucks that must ship goods from city A to city B, and each player independently routes their trucks across the network to minimize their own total shipping time. The network has the diamond structure from Figure 8.1 (two routes through C and D, with load-sensitive edges A-C and D-B and fixed-time edges C-B and A-D). First, find the Nash equilibrium when no C-to-D link exists. Then, a logistics company installs a new direct connecting road from C to D with zero travel time. Show that this new road makes both players' equilibrium shipping times increase — and explain why this outcome is structurally analogous to both players choosing to Confess in the Prisoner's Dilemma. Finally, propose a toll on the C-to-D road that each player would voluntarily agree to pay before the road is built, which would prevent the Braess outcome while leaving both players better off than under the bad equilibrium.

**Chapters involved:** Chapter 8 + Chapter 6

---

## 📋 Action Items

1. On Monday morning before checking email, draw the directed graph of a real system you work with — a deployment pipeline, a data processing workflow, or a team approval chain — and label each edge with whether its "travel time" is fixed (independent of load) or load-sensitive (slows down as more tasks use it). Then identify whether any recently added shortcut or tool is acting like a zero-cost C-to-D link, attracting all work to two congestion-sensitive bottlenecks. Write one sentence describing what you found.

2. This week, pick one shared resource in your organization that everyone uses (a Slack channel, a shared calendar slot, a common code review queue) and compute the rough "social cost": total time lost across all users in the current Nash equilibrium. Then identify what the social optimum would look like if someone could assign people to different resources, and estimate the gap. Present this gap to one decision-maker with the framing: "We are paying an X% premium over the minimum possible because of uncoordinated individual choices."

3. Before your next infrastructure, process, or product decision that adds a new option or resource, write down the answer to this question: "Is the thing I am adding likely to become a dominant strategy — something that every rational actor will prefer regardless of what others do?" If yes, design a friction mechanism (a small cost, approval step, or quota) to prevent it from being universally dominant, so that the system can reach a balanced rather than a congested equilibrium.
