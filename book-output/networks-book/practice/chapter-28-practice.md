# Practice Exercises: Chapter 21 — Epidemics

## 🧪 Comprehension Check

**Q1:** The basic reproductive number R₀ is described as having a "knife-edge" quality near R₀ = 1. What does this mean mathematically and intuitively, and why does it make public-health interventions both powerful and urgent when a disease is near this threshold?

<details>
<summary>Answer</summary>

R₀ = pk (contagion probability times number of contacts) is the expected number of new infections a single infected person produces. The knife-edge property means that the branching process model predicts a sharp dichotomy: if R₀ < 1 the disease dies out with probability 1, and if R₀ > 1 it persists with positive probability. Near R₀ = 1, a tiny change in p or k — say, slightly reducing how many people someone contacts — can push R₀ across the threshold, eliminating the risk of a large outbreak entirely. This makes interventions disproportionately valuable near the threshold: spending resources to nudge R₀ from 1.05 to 0.95 is far more impactful than the same effort applied when R₀ is already 0.5 or 2.

</details>

---

**Q2:** How does the SIR model differ from the branching process model, and in what specific way does the SIR model's behavior on non-tree networks break the clean R₀ dichotomy that holds for branching processes?

<details>
<summary>Answer</summary>

The branching process assumes an infinite tree contact network with no cycles — every new contact is a fresh, previously unexposed person. The SIR model generalizes this to arbitrary network structures while preserving the same three states (Susceptible, Infectious, Removed) and the same probabilistic transmission mechanics. On a tree, R₀ precisely determines persistence. On non-tree networks, cycles and bottleneck structures matter independently of R₀. The chapter's "channel" network example (Figure 21.3) shows that even with R₀ = 4/3 > 1, the disease dies out with probability 1 because every generation must pass through a narrow set of edges where a single "roadblock" — all four edges failing to transmit — cuts off the epidemic forever. The topology of the contact network creates constraints that R₀ alone cannot capture.

</details>

---

**Q3:** Explain the percolation view of an SIR epidemic. Why is this static reformulation useful, and what does it reveal about which individuals will ultimately be infected?

<details>
<summary>Answer</summary>

In the percolation view, before the epidemic begins, every edge in the contact network is independently labeled "open" with probability p (it will transmit the disease if the opportunity arises) or "blocked" with probability 1 − p. The SIR dynamic then collapses to a purely structural fact: a node becomes infected if and only if there is a path of entirely open edges connecting it to one of the initially infected nodes. This reformulation is useful because it converts a time-evolving stochastic process into a static graph-reachability problem — one can reason about which clusters of nodes are connected through open edges without simulating the epidemic step by step. It also connects epidemic modeling to the well-studied physics literature on percolation in porous media, importing powerful analytical tools.

</details>

---

**Q4:** What is concurrency in the context of disease transmission, and why do researchers studying HIV/AIDS consider it a more dangerous pattern of partnerships than the same number of partnerships arranged serially?

<details>
<summary>Answer</summary>

Concurrency means a person has two or more active partnerships that overlap in time rather than occurring sequentially. With serial partnerships, disease can only pass "forward" along the chain — from an earlier partner to a later one. With concurrent partnerships, all partners share exposure simultaneously, allowing the disease to move in any direction among connected individuals and linking otherwise-separate parts of the network. The chapter shows that simply "pushing together" the time windows of the same partnerships — keeping their total number and duration fixed — can transform a network where large sections are "walled off" from each other by timing into one where any infected node can potentially reach any other. Morris and Kretzschmar's simulations found that small increases in concurrency level could produce large increases in epidemic size, making this timing dimension crucial for HIV modeling and prevention strategy.

</details>

---

**Q5:** What is Mitochondrial Eve, and why does the Wright-Fisher model of population genetics predict that such a common ancestor is not merely possible but essentially inevitable — regardless of what actually happened in human prehistory?

<details>
<summary>Answer</summary>

Mitochondrial Eve is the single woman from whom all present-day humans inherit their mitochondrial DNA through an unbroken maternal line. The Wright-Fisher model explains why this is mathematically inevitable rather than historically extraordinary. In the model, a population of fixed size N reproduces each generation by having each offspring choose a single parent uniformly at random. When you trace k present-day lineages backward in time, whenever two lineages happen to pick the same parent they coalesce into one. Since there is always a positive probability of collision between any two distinct lineages (specifically 1/N per generation), the number of distinct lineages must eventually reduce to one — coalescence is guaranteed, not merely lucky. The same logic applies to mitochondrial DNA: whichever maternal lineages existed in the past, those that failed to produce daughters eventually died out, and the one that "won" becomes the common ancestor of everyone alive today. This is a consequence of random drift, not special selection of any individual.

</details>

---

## 🔄 Apply It

**Scenario 1: Designing a University Quarantine Policy**
A new respiratory illness has appeared on a university campus. The campus epidemiologist estimates that each infected student contacts approximately 20 others while contagious, and the transmission probability per contact is about 0.06. The university president wants to know whether the outbreak will grow or fade on its own, and which intervention — reducing gatherings (cutting contacts) or promoting hand-washing (cutting transmission probability) — offers more leverage per dollar.

*What should you consider?*
- Calculate R₀ = pk = 0.06 × 20 = 1.2, which is above 1, meaning the epidemic will persist with positive probability rather than dying out naturally.
- Since R₀ = p × k, both levers are mathematically symmetric in their effect on R₀ — a 20% reduction in either p or k reduces R₀ by 20%. The question becomes which intervention can achieve a given percentage reduction more cheaply.
- The knife-edge effect near R₀ = 1 means that getting R₀ below 1 is the critical goal; any intervention that achieves this will guarantee the outbreak dies out, making a targeted, sufficient reduction far more valuable than partial reductions in both dimensions simultaneously.

<details>
<summary>Model Response</summary>

With R₀ = 1.2, the disease will grow. The campus needs interventions that push R₀ below 1, requiring at least a 17% reduction in R₀. Because R₀ = pk, reducing either p or k by 17% achieves this. In practice, the two levers affect different behaviors: canceling large events reduces k (contacts), while hygiene campaigns reduce p (per-contact transmission probability). Neither is universally cheaper; the right approach is to estimate the cost per percentage point of reduction for each and allocate budget to whichever is more efficient — or to pursue both if needed to cross the threshold. The critical insight from the chapter is that the target is not "reduce R₀ somewhat" but specifically "get R₀ below 1," because that is the threshold at which the disease is guaranteed to die out rather than merely slowed. Spending enough to reach R₀ = 0.95 is far more valuable than spending half that to reach R₀ = 1.05, even though the numerical difference in R₀ is the same.

</details>

---

**Scenario 2: Explaining Measles' Wave Behavior Across Cities**
A public health analyst notices that measles cases in major U.S. cities follow a cyclical pattern, and that over the 20th century the outbreaks in different cities became increasingly synchronized with each other. She initially attributes this to shared external factors like school calendars or seasonal weather. Her colleague suggests network structure plays a role. How should she think about this?

*What should you consider?*
- The SIRS model (where recovered individuals have temporary immunity before returning to susceptible) can produce oscillations even without any external forcing, because after a large outbreak, the population of susceptibles is temporarily depleted, creating a trough before immunity wanes and the susceptible pool rebuilds.
- Synchronization across cities requires a mechanism for different geographic regions to "coordinate" their flare-ups — the chapter identifies long-range links (weak ties, travel routes, airline connections) as the key ingredient that transmits timing information across otherwise-separate local clusters.
- The empirical finding that synchronization increased over the 20th century is consistent with the increasing connectivity of the U.S. transportation network, not simply with social changes in behavior.

<details>
<summary>Model Response</summary>

The analyst's colleague is pointing to a well-supported mechanism. In the SIRS framework, oscillations arise internally from the combination of temporary immunity (which depletes susceptibles after each peak) and the eventual waning of immunity (which restores them). What converts local independent oscillations into synchronized national waves is the density of long-range connections in the contact network. As the Kuperman and Abramson simulation results show (Figure 21.7), networks with very few long-range links (low c) show no global synchronization; networks with many long-range links (high c) produce clear, coherent national waves. The increase in synchronization over the 20th century aligns with the growth of national transportation infrastructure — more cross-regional travel means more long-range links, coupling local outbreaks together. The analyst should test this by looking at whether the timing of increased synchronization matches the expansion of major transportation networks, and whether diseases without temporary immunity (like gonorrhea) show similar synchronization trends — which the Grassly, Fraser, and Garnett comparison of syphilis and gonorrhea suggests they do not.

</details>

---

**Scenario 3: Tracing HIV Risk in a Longitudinal Partner Study**
An epidemiologist is mapping sexual contact networks to understand HIV transmission pathways. She has interview data listing who each participant's partners were, but she realizes that knowing only the static network — who connected to whom — is insufficient for determining transmission risk. Two participants, Alice and Bob, both had the same three partners over five years, but in different orders and with different overlap. How should she reason about their comparative risk profiles?

*What should you consider?*
- The timing and overlap of partnerships matters: concurrent partnerships (time windows overlapping) create bidirectional exposure across all active partners simultaneously, while serial partnerships allow disease to flow only forward in time along the chain.
- For a disease like HIV with a long infectious period, even modest levels of concurrency dramatically expand the set of individuals who are mutually reachable through temporally valid transmission paths.
- When constructing transmission risk assessments, it is necessary to know not just the graph structure (who connected to whom) but also the time-stamped intervals for each partnership, because the same set of partners arranged differently in time can yield completely different infection potential.

<details>
<summary>Model Response</summary>

The epidemiologist needs to treat the contact network as a temporal graph — one where edges exist only during specific time intervals. Alice and Bob may have identical static contact networks (same partners, same total number of partnerships) but radically different temporal structures. If Alice's partnerships were concurrent (all overlapping in time), then any of her three partners could potentially infect any of the others through her, and she is exposed to all three partners' networks simultaneously. If Bob's partnerships were serial (each ending before the next began), disease can only flow forward: an earlier partner can infect Bob and through him a later partner, but not the reverse. The chapter's Figure 21.8 example makes this concrete — shifting the order of two partnerships can determine whether a disease can reach a particular node at all, even holding the underlying graph fixed. For HIV risk modeling, the epidemiologist should record the start and end dates of each partnership and reconstruct the temporal contact network before drawing any conclusions about transmission pathways or comparative risk.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you changed your social behavior during a disease outbreak — perhaps during COVID-19 — by reducing contacts or avoiding certain places. Now that you understand R₀ = pk, and the knife-edge effect near R₀ = 1, how would you think differently about which specific behaviors to prioritize? Were you reducing k (number of contacts) or p (per-contact transmission probability), and did you have a sense of whether you needed to do "just enough" to cross a threshold or whether gradual reduction was sufficient?

2. Think of a rumor, trend, or piece of information that spread rapidly through your social circle or organization and then suddenly disappeared. What would you do differently now that you understand the SIR and branching process models — specifically, how would you try to identify whether the "die-out" was due to a low R₀ (the idea wasn't that transmissible), saturation of susceptibles (everyone had already heard it), or a bottleneck in the contact network structure?

3. Think of a time when the timing of events in your professional or personal network made a crucial difference — a connection you made at one conference that opened a door, or an introduction that came too late to matter. Now that you understand transient contacts and the concept that temporal ordering of edges determines what can flow through a network, how does this change how you think about the sequencing of relationship-building activities in your own life or work?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the basic reproductive number R₀ in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

When a sick person moves through a population, R₀ is simply the average number of new people they infect before recovering. If R₀ is less than 1, each infected person infects fewer than one other on average, so the disease infects fewer and fewer people each generation and eventually vanishes on its own. If R₀ is greater than 1, each person infects more than one other on average, so the disease grows from generation to generation and can spread through the entire population — which is why public health officials focus so intensely on pushing R₀ below 1 through vaccines, masks, and social distancing.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a previous chapter.

**Exercise:** Consider a small-world network (as described in Chapter 20) built by starting with a ring of 1,000 nodes where each node is connected to its 4 nearest neighbors, and then rewiring each edge with probability c to a random long-range contact. You run an SIRS epidemic on this network with contagion probability p = 0.3, infectious period t_I = 3 steps, and immunity period t_R = 10 steps.

Part A: For c = 0.01 versus c = 0.5, predict the qualitative difference in epidemic dynamics you would expect based on the synchronization analysis from Chapter 21. Explain your reasoning in terms of how long-range links couple the flare-up timing across different parts of the ring.

Part B: The small-world network from Chapter 20 was introduced to explain why social networks have both high clustering (due to local links) and short average path lengths (due to long-range links). Explain how these two structural properties — clustering and short path length — have opposite effects on epidemic spread: clustering tends to waste transmission events on already-infected cliques, while short path length allows the disease to reach new susceptibles quickly. How does varying c trade off these two effects?

Part C: Using the R₀ concept from Chapter 21, argue whether increasing c from 0.01 to 0.5 should raise or lower the effective R₀ of the epidemic at the early stages of an outbreak, and why the network structure affects R₀ even though the per-contact transmission probability p is held fixed.

**Chapters involved:** Chapter 21 (Epidemics: branching processes, R₀, SIRS synchronization) + Chapter 20 (Small-World Networks: clustering, long-range links, the Watts-Strogatz construction)

---

## 📋 Action Items

1. On Monday morning, before checking email, calculate R₀ for one real infectious disease you have encountered in the news recently (influenza, norovirus, COVID-19 variants). Look up the estimated R₀ value and the two components it rests on — typical contact rate and per-contact transmission probability — and identify which of the two components public health agencies were targeting with their recommended interventions. Write down in one paragraph why the interventions were or were not sufficient to push R₀ below 1.

2. This week, map your own contact network for one day: note every person-to-person interaction you have and whether it is a persistent relationship or a transient contact (a one-time encounter at a coffee shop versus a recurring colleague). Identify which contacts are concurrent (you interact with multiple people simultaneously in a shared setting) versus serial (one-on-one interactions at separate times). Reflect on how your personal "contact network structure" would affect the spread of a respiratory illness relative to an STI — two diseases whose contact networks, as the chapter explains, are fundamentally different in structure even within the same population.

3. Before the end of the week, find a current news article about any ongoing disease outbreak and identify which of the four models from the chapter best describes the situation: branching process (early outbreak, no network cycles), SIR (disease confers lasting immunity, spreading through a defined community), SIS (disease like the common cold where reinfection is possible), or SIRS (disease with temporary immunity, like flu). Write two sentences explaining your choice and one sentence predicting what the epidemic trajectory should look like based on the model's behavior.
