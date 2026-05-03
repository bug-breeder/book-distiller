# Chapter 21: Epidemics

## 🧠 Core Thesis
How diseases spread through a population is determined not just by the biological properties of the pathogen — its contagiousness and infectious period — but equally by the structure of the underlying contact network; and the same mathematical machinery that describes epidemic spreading also illuminates seemingly unrelated phenomena like genetic inheritance and the existence of Mitochondrial Eve.

## 📖 Detailed Breakdown

### Contact Networks and the Dual Nature of Epidemic Spread
- **What it is:** A contact network is a graph where each node is a person (or organism, or computer) and each edge represents a potential pathway for disease transmission. The structure of this network is as important as the biology of the pathogen itself.
- **Why it matters:** The same disease will spread very differently depending on whether the contact network is dense and well-connected or sparse and bottlenecked. Two diseases in the same population can have wildly different contact networks based on their mode of transmission — airborne diseases connect anyone who shares a bus, while sexually transmitted diseases connect only close partners.
- **How it works:** For a highly contagious airborne pathogen, the contact network includes anyone sitting nearby; for an STI the network is far sparser. This is why modeling the network is crucial. Researchers have studied how airline networks, city travel patterns, livestock interactions during foot-and-mouth disease, and computer communication topologies all shape epidemic trajectories.
- **Key quote or example:** "The pathogen and the network are closely intertwined: even within the same population, the contact networks for two different diseases can have very different structures, depending on the diseases' respective modes of transmission."
- **Connection:** This motivates the chapter's progression from simple tree-structured models (branching processes) to general network models (SIR/SIS) to dynamic networks (transient contacts).

### Biological vs. Social Contagion: The Role of Randomness
- **What it is:** While disease spread and idea spread (social contagion, covered in Chapter 19) share structural similarities, the key modeling difference is that disease transmission is treated as a random event rather than a deliberate decision.
- **Why it matters:** When two connected people interact and one has a disease, we cannot model the mechanics of exactly how transmission occurs at the molecular level. Modeling it as a random event with probability p abstracts away this complexity while still capturing the statistical behavior of the epidemic.
- **How it works:** For each contact between an infectious and susceptible person, the disease passes with probability p, independently of all other contacts. This allows the use of powerful probabilistic tools that would be unavailable if we tried to model decision-making at each contact.
- **Key quote or example:** "It is most useful to model it as random. That is, we will generally assume that when two people are directly linked in the contact network, and one of them has the disease, there is a given probability that he or she will pass it to the other."
- **Connection:** This probabilistic stance connects to the branching process model and ultimately to the coalescent process in genetics, both of which use similar random-propagation logic.

### Branching Processes: The Simplest Epidemic Model
- **What it is:** In a branching process, one initially infected person meets k others, passing the disease to each independently with probability p. Each infected person in turn meets k new people, and so on. The contact network is an infinite tree — no cycles, no re-encounters.
- **Why it matters:** Despite its simplicity, the branching process captures the essential tension between an epidemic that explodes and one that fades, and it yields a clean, provable mathematical condition for which outcome occurs.
- **How it works:** The model generates waves of infection. Wave 1 has k potential infectees, wave 2 has k² potential infectees, and so on. Whether the disease persists forever or dies out after a finite number of waves depends entirely on one quantity: the basic reproductive number R₀ = pk, which is the expected number of new cases caused by a single infected individual. The tree structure (Figure 21.1) shows the full contact network; bold edges in the figure trace actual transmission events. With high p, the epidemic spreads widely (Figure 21.1b); with low p, it dies out quickly (Figure 21.1c).
- **Key quote or example:** "Claim: If R₀ < 1, then with probability 1, the disease dies out after a finite number of waves. If R₀ > 1, then with probability greater than 0 the disease persists by infecting at least one person in each wave."
- **Connection:** The branching process is a special case of the SIR model with tI = 1 and an infinite tree as the contact network. The R₀ concept carries forward as a useful heuristic even in more complex models.

### The Knife-Edge Property of R₀ = 1
- **What it is:** The transition between epidemic persistence and extinction occurs sharply at R₀ = 1. When R₀ is just below 1, a small increase in contagiousness or number of contacts can push it above 1, suddenly creating a positive probability of a massive outbreak.
- **Why it matters:** This "knife-edge" quality has profound public health implications. Since R₀ = pk, quarantine reduces k and sanitation reduces p. Even small reductions in either quantity, if they push R₀ below 1, can eliminate the epidemic entirely. Conversely, a disease hovering just below R₀ = 1 is one behavioral change away from an outbreak.
- **How it works:** When R₀ is just above 1, the epidemic is not guaranteed to persist — there is always some probability that early transmissions all fail, causing the disease to die out "unluckily." But when R₀ > 1, there is a strictly positive probability of indefinite persistence. When R₀ < 1, that persistence probability is exactly 0.
- **Key quote or example:** "Around the critical value R₀ = 1, it can be worth investing large amounts of effort even to produce small shifts in the basic reproductive number."
- **Connection:** This knife-edge intuition resurfaces with the SIS model (where a critical contagion probability p separates quick extinction from long persistence) and in the proof in Section 21.8.

### The SIR Epidemic Model
- **What it is:** The Susceptible-Infectious-Removed (SIR) model generalizes the branching process to arbitrary contact network structures. Each node cycles through three states: S (not yet infected), I (currently infectious, for tI time steps), and R (recovered/immune, permanently removed from the epidemic).
- **Why it matters:** Real contact networks have cycles, hubs, and bottlenecks — none of which appear in the tree structure of branching processes. The SIR model works on any directed graph and is the standard workhorse of epidemic modeling.
- **How it works:** Initially some nodes are in state I and all others in state S. Each infectious node has probability p of transmitting to each susceptible neighbor in each of its tI infectious time steps. After tI steps, the node moves to state R permanently. The epidemic ends when no more I nodes exist. Figure 21.2 shows SIR unfolding on a small network across four time steps, with dark-bordered shaded nodes in state I and thin-bordered shaded nodes in state R. The branching process is the special case where tI = 1 and the contact network is an infinite tree.
- **Key quote or example:** The network in Figure 21.3 — two nodes per layer connected forward in a chain — forces disease to pass through a narrow bottleneck, meaning even with R₀ > 1, there is always probability (1/3)⁴ = 1/81 that all four edges in a given layer fail to transmit, creating a permanent roadblock. This shows how network structure can defeat a numerically favorable R₀.
- **Connection:** The SIR model's percolation view (below) and its relationship to SIS are covered in extensions; it also applies to the genetic inheritance model in Section 21.7.

### SIR Epidemics as Percolation
- **What it is:** Rather than simulating the SIR process step by step, we can equivalently pre-assign every edge in the contact network as either "open" (will transmit disease if the timing is right) with probability p, or "blocked" with probability 1-p. A node becomes infected if and only if there exists a path of open edges from an initially infected node to it.
- **Why it matters:** This static "percolation" view dramatically simplifies analysis. Instead of tracking time-evolving states, we only need to ask about connectivity in the graph after random edge deletion. It is also a well-studied topic in physics (flow through porous media) with established theoretical tools.
- **How it works:** For each edge from v to w, flip a coin with probability p of heads at the start of the process. If heads, mark the edge open; otherwise blocked. The set of infected nodes is precisely the set reachable from the initially infected nodes via open edges. Figure 21.4 shows this for the network from Figure 21.2 — the percolation view captures the same infection pattern in a single static picture.
- **Key quote or example:** "A node v will become infected during the epidemic if and only if there is a path to v from one of the initially infected nodes that consists entirely of open edges."
- **Connection:** Percolation is mathematically equivalent to SIR and enables results about epidemic size as a function of p and network topology. It also connects to graph-theoretic concepts of connected components.

### The SIS Epidemic Model
- **What it is:** In the Susceptible-Infectious-Susceptible model, there is no Removed state. After a node's infectious period ends, it returns to the Susceptible state and can catch the disease again. This models diseases (like many STIs, the common cold, and some bacterial infections) where infection confers no lasting immunity.
- **Why it matters:** SIS epidemics behave qualitatively differently from SIR. Because nodes are never permanently removed, the disease can circulate indefinitely through the population, potentially becoming endemic. The question shifts from "will it die out?" to "how long will it last and at what prevalence?"
- **How it works:** Nodes alternate between S and I states. An SIS epidemic on a finite graph must eventually die out (with probability 1, there will eventually be a time step where all contagion attempts fail simultaneously and no infected nodes remain), but it can persist for an extremely long time. Researchers have proved knife-edge results for SIS analogous to the branching process dichotomy: at a critical contagion probability, the epidemic shifts from dying out quickly to persisting for a very long time.
- **Key quote or example:** Figure 21.5 shows an SIS epidemic on a three-person network (like a family or shared apartment) — node v starts infected, recovers, and later gets reinfected from the network.
- **Connection:** Surprisingly, SIS epidemics can be represented as SIR epidemics on a "time-expanded" contact network (Figure 21.6), where each node at each time step is treated as a distinct copy. This collapses the cyclic SIS dynamics into a forward-only SIR process.

### Synchronization of Epidemics via the SIRS Model
- **What it is:** The SIRS model adds a temporary immunity phase: after the Infectious period, a node enters the Removed state for tR time steps, then returns to Susceptible. This models diseases like measles and syphilis where immunity wears off.
- **Why it matters:** Temporary immunity combined with long-range network links can produce synchronized, wave-like oscillations in the number of infected individuals — explaining why diseases like syphilis show regular 8-11 year prevalence cycles in the US, while gonorrhea (which confers no immunity) shows no such cycles.
- **How it works:** Long-range links in the contact network allow flare-ups in distant parts of the network to become coordinated in time. When a synchronized flare-up subsides, a large fraction of the population simultaneously enters the temporarily immune R state, creating a network-wide "trough" of low susceptibility. Eventually immunity wanes, susceptibility rises again, and the next synchronized wave begins. Figure 21.7 shows simulation results: with c = 0.01 (few long-range links), n_inf(t) is noisy and unsynchronized; with c = 0.2 (moderate long-range links), intermittent synchronization appears; with c = 0.9 (many long-range links), clear regular oscillations emerge.
- **Key quote or example:** Grassly, Fraser, and Garnett's analysis of syphilis data found that the 8-11 year cycle timing matches the duration of syphilis immunity, and that synchronization between US regions increased over the 20th century — consistent with growing nationwide connectivity in the sexual contact network.
- **Connection:** The small-world network structure from Chapter 20 (local clustering plus long-range shortcuts) is the key structural ingredient producing synchronization, linking epidemic dynamics to the Watts-Strogatz model.

### Transient Contacts and the Danger of Concurrency
- **What it is:** In models with a static contact network, all edges are assumed to be present throughout the epidemic. For slowly-spreading diseases like HIV/AIDS, this is unrealistic: partnerships form and dissolve over the years-long course of the epidemic. The "transient contacts" framework annotates each edge with the time window during which it existed.
- **Why it matters:** The timing of contacts determines which transmission pathways are possible. Disease can only flow forward in time — a person who was in a partnership with someone before catching the disease cannot have transmitted it to them during that earlier partnership. Getting the time-ordering wrong leads to fundamentally incorrect predictions about who is at risk.
- **How it works:** Each edge carries a time interval [start, end]. Disease can flow from node u to node w only if u was infected before the edge's end time. In Figure 21.8(a), disease starting at u can reach y (through v and w) because the partnerships proceed in the right order. In Figure 21.8(b), reversing the timing of two partnerships means u cannot reach y despite the same underlying contact graph.
- **Key quote or example:** "In order for y to know whether he or she is at risk from a disease carried by u, it is not enough even to map out the full set of sexual partnerships; it is crucial to know information about the order of events as well."
- **Connection:** Timing effects interact with concurrency. If node v has two partnerships that overlap in time (concurrent), the disease can circulate in both directions through v simultaneously, greatly expanding the epidemic's reach compared to serial partnerships.

### Concurrency: When Overlap Amplifies Epidemics
- **What it is:** Concurrency refers to a person having two or more active partnerships that overlap in time. Even small increases in concurrency can dramatically increase epidemic size.
- **Why it matters:** Morris and Kretzschmar showed through simulations that small changes in concurrency — holding the average number and duration of partnerships fixed — could produce large changes in epidemic size. This is a public-health relevant insight for HIV/AIDS, where concurrency patterns differ across communities.
- **How it works:** In Figure 21.9(a), node v's two partnerships are serial — first with u, then with w. Disease can only flow from u to w through v, not the reverse. In Figure 21.9(b), the partnerships are concurrent — overlapping in time. Now u or w can infect the other through v in either direction. In larger networks (Figure 21.10), the effect compounds: concurrent partnerships can connect large sections of the network that would otherwise be isolated from each other by timing effects.
- **Key quote or example:** "Where the pattern in Figure 21.10(a) allowed different parts of the network to be 'walled off' from each other by the timing effects, the concurrent partnerships make it possible for any node with the disease to potentially spread it to any other."
- **Connection:** Concurrency is one specific timing pattern; the broader framework of transient contacts applies to any setting — including the diffusion of information through social networks — where the order and duration of contacts matters.

### Genealogy, Genetic Inheritance, and Mitochondrial Eve
- **What it is:** The same probabilistic spreading logic used for epidemics applies to genetic inheritance. Mitochondrial DNA is passed from mother to child, creating a purely maternal lineage. In 1987, Cann, Stoneking, and Wilson showed that all living humans' mitochondrial DNA traces back to a single woman — "Mitochondrial Eve" — who lived approximately 100,000-200,000 years ago in Africa.
- **Why it matters:** The existence of such a recent universal ancestor is not a mystical coincidence — it is mathematically inevitable given any plausible population model. The Wright-Fisher model of genetic inheritance predicts that all lineages will coalesce to a single most recent common ancestor.
- **How it works:** In the Wright-Fisher model, a population of N individuals in each generation produces N offspring in the next; each offspring picks its parent uniformly at random from the previous generation. This is analogous to an epidemic spreading backward in time. As we trace lineages backward, whenever two individuals happen to share the same parent their lineages merge (coalesce). With many lineages initially, collisions are frequent; as lineages reduce to a few, collisions become rare. Eventually all lineages coalesce to one — the most recent common ancestor (analogous to Mitochondrial Eve). The model predicts this takes approximately 2N generations, where N is population size.
- **Key quote or example:** "From the point of view of present-day mitochondrial DNA, all these women are genetically irrelevant: somewhere along the line from then to now, each of their lines of mitochondrial DNA died out."
- **Connection:** The coalescent process is formally the time-reversal of the branching process, and its mathematical analysis (Section 21.8B) mirrors the branching process analysis in structure. Every nucleotide in your genome follows a single-parent lineage that eventually coalesces, but different nucleotides may coalesce at different points and through different ancestors due to genetic recombination.

### Advanced Analysis: Proving the R₀ Dichotomy
- **What it is:** The formal proof that branching processes die out with probability 1 when R₀ < 1 and persist with positive probability when R₀ > 1, using a recursive formula for the persistence probability.
- **Why it matters:** The proof illustrates how expected values alone are not sufficient to establish persistence — they can grow to infinity even if persistence probability goes to zero. The full argument requires tracking the recurrence qn = 1 - (1 - pqn-1)^k, finding its fixed points, and using a graphical argument on the function f(x) = 1 - (1-px)^k.
- **How it works:** Let qn be the probability the disease persists for at least n waves. Then qn = 1 - (1 - pqn-1)^k (Equation 21.6), because the disease fails to reach level n precisely when all k of the root's contacts fail to sustain it for n-1 more levels, and each such failure has probability 1 - pqn-1. The sequence q0=1, q1, q2,... converges to q* as n goes to infinity. Graphically, this is the limit of repeated application of f(x) = 1-(1-px)^k starting at x=1. When R₀ = pk > 1, the derivative of f at x=0 is pk > 1, meaning f starts above y=x for small positive x but falls below y=x at x=1; thus f must cross y=x at some point x* strictly between 0 and 1, and the sequence converges to this positive fixed point — confirming q* > 0. When R₀ < 1, f lies entirely below y=x on (0,1), and the sequence descends to 0, confirming q* = 0 (Figures 21.17, 21.18, 21.19).
- **Key quote or example:** The expected number at level n is E[Xn] = (pk)^n = R₀^n (Equation 21.2). When R₀ < 1 this goes to 0, proving q* = 0. When R₀ > 1, the expected value goes to infinity, but this alone does not prove q* > 0 — a more careful fixed-point argument is needed.
- **Connection:** This section also analyzes coalescent processes (Section 21.8B), deriving that the expected time to coalescence for k lineages in a population of size N is approximately E[X] = 2N(1 - 1/k), using the same linearity-of-expectation techniques applied to the branching process analysis.

### Coalescent Process Mathematics
- **What it is:** A formal derivation of how long it takes for k lineages sampled from a population of N to coalesce to a single common ancestor, using the Wright-Fisher model run backward in time.
- **Why it matters:** This gives a quantitative prediction consistent with the empirical finding of Mitochondrial Eve, and shows that once k becomes moderately large, the expected time is approximately 2N — nearly independent of k, meaning the last two lineages take about as long to find a common parent as all the initial merging combined.
- **How it works:** Starting with k distinct lineages, two of them collide (share a parent) in each generation with probability approximately j(j-1)/(2N) when there are j active lineages. Once a collision reduces lineages from j to j-1, we wait for the next collision at rate (j-1)(j-2)/(2N), and so on until coalescence. The expected waiting time at each stage is 2N/[j(j-1)], and summing across all stages from k down to 2 gives E[X] = 2N(1/2·1 + 1/3·2 + ... + 1/k(k-1)) = 2N(1 - 1/k) by telescoping (Equations 21.8 and 21.9). The analysis uses two approximations — ignoring terms of order 1/N² and assuming at most one two-way collision per generation — both of which are valid when N is much larger than k.
- **Key quote or example:** "Once k becomes moderately large, the expected time to coalescence depends only very weakly on k; it is roughly 2N as k grows... essentially half the expected time is being spent once the lineages have merged down to just two."
- **Connection:** The coalescent process is dual to the branching process — one runs forward (disease spreading out), the other backward (lineages merging in). The same probabilistic reasoning on tree structures underlies both.

## 🔑 Key Takeaways

1. The structure of the contact network matters as much as the biology of the pathogen; a highly contagious disease can still die out quickly if forced through a narrow network bottleneck.
2. The basic reproductive number R₀ = pk (probability of transmission × number of contacts) is the single most important summary statistic of an epidemic: if R₀ < 1, the disease dies out with certainty; if R₀ > 1, it persists with positive probability.
3. The R₀ = 1 threshold has a knife-edge quality — small changes in contagiousness or contact rate that push R₀ across 1 can trigger or eliminate an epidemic, which is why quarantine (reducing k) and sanitation (reducing p) are both powerful public-health tools, especially when R₀ is near 1.
4. Even when R₀ > 1, an epidemic can still "get unlucky" and die out early; even an ultra-contagious disease can vanish before taking hold.
5. An SIR epidemic on any network is equivalent to a percolation process: edges are randomly declared open or blocked, and infected nodes are exactly those reachable from the initial infected set via open paths.
6. The timing of contacts matters, not just the topology: who is connected to whom is not enough to predict disease spread — you also need to know when those connections were active.
7. Concurrency (overlapping partnerships) dramatically amplifies HIV-like epidemics compared to serial partnerships with the same total number and duration of contacts.
8. Network synchronization — regular epidemic waves seen in diseases like measles and syphilis — arises from the combination of temporary immunity and long-range connections, not necessarily from external societal forces.
9. Mitochondrial Eve's existence is a mathematical inevitability, not a coincidence: in any population where offspring randomly inherit from parents, all lineages must eventually coalesce to a single most recent common ancestor.
10. The expected time to coalescence of k lineages in a population of size N is approximately 2N generations — nearly independent of k for large k, because the last two lineages account for about half the total waiting time.

## 🗺️ Mental Model / Framework

**The Two-Sided Spreading Machine**

Think of epidemic dynamics as a machine with two inputs and one output:
- Input 1: The pathogen's properties, summarized as p (transmission probability per contact) and tI (infectious period length).
- Input 2: The contact network's properties — its topology, density, degree distribution, presence of bottlenecks, and timing structure of edges.
- Output: The epidemic trajectory — does it explode, fizzle, synchronize, persist indefinitely?

The machine has a critical dial: R₀ = p × (average contacts per infectious period). Below 1, the machine always shuts off. Above 1, it can run indefinitely.

But the machine is not fully described by R₀ alone. Network structure overrides R₀ in subtle ways: a bottlenecked network kills epidemics that R₀ > 1 would sustain; a small-world network synchronizes waves that local-only contact would never produce; concurrent partnerships connect subgraphs that serial partnerships would isolate.

The same machine, run in reverse, describes genetic inheritance: instead of disease spreading forward through a contact tree, genetic lineages merge backward through a genealogical tree until they coalesce at a common ancestor. Both directions — spreading out and merging in — are governed by the same probabilistic logic on networks.

**Decision tree for epidemic outcome:**
- Is R₀ < 1? → Dies out with certainty (regardless of network structure in branching process; may differ on general networks).
- Is R₀ > 1 and network is tree-like? → Persists with positive probability.
- Is R₀ > 1 but network has severe bottlenecks? → May still die out almost surely despite favorable R₀.
- Are contacts transient and concurrent? → Timing determines reachability; concurrency vastly expands outbreak potential.
- Does disease confer temporary immunity and network has long-range links? → Expect synchronized epidemic waves.

## 💡 "Aha!" Moments

1. **R₀ > 1 does not guarantee an epidemic.** Even with R₀ = 10, there is always some probability the disease dies out before it gets started. Random variation in early transmission can extinguish even the most contagious pathogen — the first few infected people might all "get lucky" and fail to infect anyone. This is not just a theoretical curiosity; it means extremely aggressive early containment of a new pathogen can succeed even against a disease that would otherwise cause a massive epidemic.

2. **The timing of partnerships is as important as their existence.** If you know every person someone with HIV has ever had contact with, you still cannot determine who is at risk without knowing the order of those contacts. A map of relationships at a single point in time (like a high school social network diagram) fundamentally cannot capture epidemic risk for slowly spreading diseases — you also need the temporal sequence. This insight means that epidemiological contact tracing for HIV must record the timeline, not just the network.

3. **Mitochondrial Eve is inevitable, not miraculous.** The existence of a single woman whose mitochondrial DNA is ancestral to all living humans sounds like an astonishing biological coincidence, but the Wright-Fisher model shows it is mathematically guaranteed to happen in any finite population where reproduction is random. In fact, every gene — not just mitochondrial DNA — traces back to a most recent common ancestor, though that ancestor may differ for each gene. Eve's "specialness" is only that she is the most recent common ancestor for the specific mitochondrial lineage, not that she was the only woman alive, or even the most important person genetically.

## 🔗 Connections to Other Chapters

**Builds on:**
- **Chapter 19 (Diffusion of Innovations):** The social contagion models there used decision-based spreading; this chapter's disease models use probabilistic spreading. The structures are analogous but the mechanisms differ. The chapter explicitly notes that randomized models can sometimes apply to social contagion too, especially when individual decision processes are too complex to model explicitly.
- **Chapter 20 (Small-World Networks):** The Watts-Strogatz model of a ring network with some long-range rewired edges is the exact contact network used to demonstrate epidemic synchronization in Section 21.5. Long-range links that reduce average path length (the small-world effect studied in Chapter 20) also produce the coordinated timing of epidemic flare-ups analyzed here.

**Sets up and connects forward:**
- The percolation interpretation of SIR epidemics connects to graph-theoretic results on giant components and phase transitions, which are related to ideas about network robustness and fragmentation.
- The branching process and coalescent process mathematics introduced here (particularly the use of recursive formulas, fixed-point arguments, and linearity of expectation on trees) are general probabilistic tools that apply broadly across network science topics.
- The Wright-Fisher model and coalescent theory are foundational to modern population genetics and genomic analysis, including methods used to reconstruct human migration patterns from DNA data.

## 📝 In My Own Words (ELI5)

Imagine a disease outbreak like a game of telephone played on a map where people pass a ball to their neighbors.

**The map matters.** If the map looks like a big bushy tree where everyone branches out in all directions, a disease with even a modest chance of passing the ball can spread to tons of people. But if the map looks like a long hallway where everyone is in a single line, the ball has to get past each person one by one — and any single fumble stops everything.

**The magic number R₀** is just asking: on average, how many new people does one sick person infect? If that number is below 1, the disease shrinks every generation and disappears. If it's above 1, it grows. The tricky part is that even with R₀ above 1, there's always a chance the very first few sick people just happen to get unlucky and not spread it to anyone, so the outbreak fizzles before it starts. And even with R₀ below 1, a really unlucky run can cause it to spread further than expected — but it always dies out eventually.

**Three types of epidemic models, three different stories:**
- SIR: Once you recover, you're immune forever. The disease burns through people and runs out of fuel. Short, sharp, finite.
- SIS: You recover but can get sick again. The disease keeps circulating. Can last a very long time.
- SIRS: You're temporarily immune, then become susceptible again. This creates waves — everyone gets sick at once, then everyone is briefly immune, then they all become susceptible again around the same time. This is why measles comes in cycles.

**Timing matters for slow diseases.** For something like HIV that spreads over years, it's not enough to know who knows whom — you need to know when they were together. If Alice was friends with Bob from January to June, and Bob became friends with Carol in July, Alice's disease can reach Carol. But if Bob was friends with Carol in January to June, and Alice became his friend in July, the disease can't travel backward in time to reach Carol. Also, if Bob is friends with Alice and Carol at the same time (concurrent partnerships), the disease can spread much more efficiently in both directions simultaneously.

**The genetics connection is the most mind-bending part.** Think about how your mother's mitochondria were inherited from her mother, who got them from her mother, all the way back in time. Now everyone alive on Earth is doing this simultaneously. As we trace everyone's lineage backward, eventually two people's lineages happen to share the same great-great-...-grandmother. Once lineages share an ancestor, they merge into one. Keep going back far enough, and all the lineages collapse into one single woman — Mitochondrial Eve. This is not a coincidence or a religious claim; it's a mathematical certainty. In any population where children randomly inherit from parents, all lineages must eventually meet at one point. The math says this takes about 2N generations, where N is the population size. For humans, that math works out to roughly 100,000-200,000 years ago — exactly what the DNA evidence shows.

The big insight tying everything together: whether you're modeling a flu outbreak, an HIV epidemic, the measles cycle, or tracing your ancestry back to a common foremother, you are doing the same fundamental thing — following something (a pathogen, a gene) as it propagates randomly through a network of connected individuals. Change the network, change the outcome. Change the timing, change the outcome. But the mathematical framework — probabilities on networks — is the same throughout.

✓ chapter-28-summary.md done (word count: 4127)
