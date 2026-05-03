# Practice Exercises: Chapter 4 — Networks in Their Surrounding Contexts

## 🧪 Comprehension Check

**Q1:** The homophily test compares the observed fraction of cross-group edges to the quantity 2pq, where p and q are the proportions of each group in the population. What does it mean conceptually when the observed fraction is significantly *greater* than 2pq, and what real-world network is given as an example of this?

<details>
<summary>Answer</summary>

When the fraction of cross-group edges significantly exceeds 2pq, the network exhibits *inverse homophily* — people are disproportionately forming ties with others who are different from them along that characteristic. The chapter's example is the romantic-relationship network from Chapter 2, where almost all high-school relationships involved opposite-sex partners, so nearly all edges are cross-gender. Inverse homophily is just as meaningful a signal as homophily itself, pointing to a force that actively drives connections across group lines rather than within them.

</details>

---

**Q2:** Selection and social influence are described as "reverse" processes of each other. Explain precisely what each process does and why it is so difficult to disentangle them from a single snapshot of a social network.

<details>
<summary>Answer</summary>

With *selection*, a person's pre-existing individual characteristics drive which social connections they form — similar people seek each other out. With *social influence*, the existing connections in the network shape a person's characteristics over time — you adopt the behaviors or attitudes of your friends. A single network snapshot showing that connected people share characteristics is consistent with both stories: they might have connected *because* they were already similar (selection), or they might have become similar *because* they connected (social influence). Only longitudinal data — tracking both connections and characteristics over time — can reveal the temporal ordering needed to distinguish the two effects, and even then both often operate simultaneously.

</details>

---

**Q3:** The chapter unifies triadic closure, focal closure, and membership closure as three instances of the same abstract process within a social-affiliation network. Describe what each type of closure involves structurally, and give a one-sentence intuitive summary for each using the Anna/Bob/Karate example.

<details>
<summary>Answer</summary>

All three are forms of *triangle closing* in a social-affiliation network that contains both person nodes and focus nodes. *Triadic closure* closes a triangle among three people: Bob introduces Anna to Claire. *Focal closure* closes a triangle where the shared vertex is a focus (activity), not a person: Karate introduces Anna to Daniel, because both already belong to the same club. *Membership closure* closes a triangle where the new edge connects a person to a focus, drawn through a friend: Anna introduces Bob to Karate, because Bob's friend Anna is already a member. The unified framework shows that selection, social influence, and the classic triadic closure effect are all manifestations of the same structural tendency to close open triangles in an expanded network.

</details>

---

**Q4:** Kossinets and Watts measured T(k) — the probability of link formation as a function of k common friends — using a university email dataset, and found that the curve rises but also turns upward sharply between k=1 and k=2. What does this upward bend reveal about the relationship between common friends and link formation, and why does it contradict the simplest independent-effects baseline model?

<details>
<summary>Answer</summary>

The simple baseline model assumes each common friend independently contributes probability p of causing a link, giving T_baseline(k) = 1 - (1-p)^k — a curve that turns slightly *downward* (diminishing marginal returns). The observed data turns *upward* from k=1 to k=2, meaning having two common friends produces more than twice the link-formation probability of having one. This super-linear jump shows that common friends are not independent: they are correlated sources of opportunity, trust, and evidence of similarity. Each additional common friend is reinforcing, not independent — consistent with the argument that homophily itself makes it likely that friends of friends share multiple common contexts, compounding the likelihood of a connection.

</details>

---

**Q5:** Schelling's segregation model produces near-complete spatial segregation from agents with a threshold of only 3 same-type neighbors. The chapter shows that an integrated checkerboard arrangement could satisfy all agents at this threshold. Why, then, does integration collapse from a random start, and what does this reveal about the relationship between local individual preferences and global social outcomes?

<details>
<summary>Answer</summary>

Integrated arrangements like the checkerboard are mathematically valid equilibria but are almost impossible to reach from a random starting configuration. When agents begin in a random mix, unsatisfied agents move toward clusters of their own type, and this creates a compounding "unraveling" effect: their departure makes previously satisfied border agents fall below threshold, causing them to move as well, which further grows homogeneous clusters. The process is self-reinforcing and path-dependent — small early clusters snowball into large segregated regions. The deeper insight is that global segregation is not evidence that individuals *want* segregation; agents are willing to live in the minority (five neighbors of the opposite type, three of their own) and could all be simultaneously satisfied in an integrated pattern. The gap between locally achievable preferences and globally achievable outcomes is the core lesson: individual rationality operating through decentralized local moves can produce collective outcomes that no individual chose or necessarily desires.

</details>

---

## 🔄 Apply It

**Scenario 1: Diagnosing Echo Chambers on a Professional Platform**

A social media company notices that users who share the same political party affiliation are engaging with each other at much higher rates than users from different parties. The team wants to know whether this clustering is driven by users actively seeking out ideologically similar people, or by the platform's algorithm recommending content that reinforces existing connections.

*What should you consider?*
- How would you apply the homophily test (comparing cross-group interaction rates to the 2pq baseline) to determine whether a statistically significant degree of homophily exists in the first place?
- What longitudinal data would you need to distinguish selection (users seeking out similar users before interacting) from social influence (users shifting toward their connections' views after interacting)?
- What does the Wikipedia editor study (Figure 4.13) suggest about what the temporal signature of each effect looks like — specifically, which effect produces rising similarity *before* first contact?

<details>
<summary>Model Response</summary>

First, calculate the fraction of cross-party interactions (edges) and compare it to 2pq, where p and q are the proportions of each party in the user base. If the observed cross-party rate is significantly below 2pq, you have confirmed homophily; the magnitude of the gap tells you how strong it is.

To separate selection from social influence, you need longitudinal records with timestamps: track pairs of users who eventually interact for the first time, and measure their behavioral similarity (e.g., overlap in topics they post about, articles they engage with) both before and after that first interaction. Following the approach of the Wikipedia editor study, plot average similarity as a function of time relative to first contact. If similarity rises steeply *before* first contact, selection is at work — users are connecting because they are already becoming similar. If similarity continues to rise *after* first contact at a rate faster than for non-interacting pairs, social influence is adding an additional layer.

The Wikipedia findings suggest you should expect both effects, but selection may dominate immediately before contact. For policy purposes this matters enormously: if the echo chamber is primarily driven by selection, the algorithm's recommendations may be largely reflecting pre-existing user preferences; if social influence is strong, the algorithm is actively shaping those preferences. Interventions like cross-partisan content recommendations will be more effective against influence-driven homophily, while structural interventions (e.g., integrating diverse users into shared contexts, analogous to creating shared foci) are needed to address selection-driven clustering.

</details>

---

**Scenario 2: Designing a Community Integration Program**

A city government wants to reduce social segregation between two ethnic communities that have largely separated into distinct residential neighborhoods and social circles. They are considering two interventions: (A) subsidizing mixed housing in integrated blocks, and (B) funding shared community activities — sports leagues, community gardens, after-school programs — that draw members from both groups.

*What should you consider?*
- How does the Schelling model inform the risks of Intervention A? What does "unraveling" suggest about the stability of integrated housing without other supporting conditions?
- How does the concept of *focal closure* explain why Intervention B might be particularly effective at generating new cross-group social ties?
- What does the selection/social influence framework suggest about the sequencing of these interventions over time?

<details>
<summary>Model Response</summary>

The Schelling model offers a sobering caution about Intervention A alone. Even if mixed housing is subsidized, agents with relatively mild same-type preferences (threshold t=3) will leave integrated areas if their immediate neighborhood composition tips below their comfort level, triggering the unraveling cascade that turns integrated zones into segregated ones. Integrated arrangements are fragile equilibria that are easily disrupted by small perturbations. Subsidized housing must therefore be maintained at a scale sufficient to prevent local tipping — it cannot just place a few mixed blocks in an otherwise segregated landscape.

Intervention B directly leverages *focal closure*: when members of two groups share a focus (a sports league, a garden plot), they both connect to the same node in the social-affiliation network. The focal closure principle predicts that people who share a focus are significantly more likely to form a direct social tie, even without a mutual friend introducing them. The data from the Kossinets and Watts email study showed that a single shared class (focus) had roughly the same absolute effect on link formation as a single shared friend. Shared community activities thus create the structural conditions — common foci — that generate cross-group edges through focal closure.

The selection/social influence framework suggests sequencing matters. Shared activities initially work through selection (bringing people who self-select into shared spaces), but once links form, social influence begins operating — people's attitudes and behaviors gradually align with their new cross-group contacts. This means the full benefit of Intervention B compounds over time as initial ties deepen and create new cross-group triadic closure opportunities. The most durable integration strategy combines both: stable mixed environments (Intervention A) reduce the risk of Schelling-style tipping, while shared activities (Intervention B) create the foci that generate the cross-group ties that make integrated neighborhoods feel socially as well as spatially integrated.

</details>

---

**Scenario 3: Evaluating a Public Health Intervention on Drug Use**

A public health team finds that illicit drug use in a high-school network exhibits strong homophily: students who use drugs are much more likely to be friends with other drug users than a random mixing baseline would predict. The team proposes targeting a subset of high-profile, high-degree students for an anti-drug program, expecting that social influence will propagate their changed behavior throughout the network.

*What should you consider?*
- What is the critical distinction between selection and social influence, and why does it determine whether this intervention will work as intended?
- If homophily here is driven primarily by selection rather than social influence, what happens to the targeted students after the intervention — and what does the chapter say about the mechanism?
- How should the team redesign the intervention, using the concepts of foci and closure types, to increase the chance that behavior change spreads rather than merely relocating the social network?

<details>
<summary>Model Response</summary>

The intervention's logic depends entirely on social influence being the dominant mechanism: if friends using drugs causes others to use drugs, then friends stopping should cause others to stop. But the chapter, citing Cohen and Kandel's research line, shows that selection effects are in fact comparable in magnitude to social influence in adolescent peer networks. This means a substantial portion of the observed homophily may reflect drug users selecting each other as friends, not influencing each other into drug use.

If selection dominates, the targeted students who stop using drugs will not necessarily influence their existing friend group to stop. Instead, they are likely to change their social circles — forming new friendships with non-users (who are now more similar to them) while their previous friendships with drug-using peers attenuate. The drug-using behavior of their former friends is not strongly affected; the network restructures around the changed individuals rather than changing behavior through the existing network.

A better-designed intervention uses the affiliation network framework. Rather than targeting individuals and hoping influence propagates, the team should create new *shared foci* — activities, clubs, or programs — that mix drug-using and non-drug-using students together in structured contexts. Focal closure predicts that shared participation in these activities will generate new cross-group social ties. Membership closure will then draw drug-using students into these new communities through their friends. This attack on the affiliation structure, rather than individual node persuasion, addresses the root mechanism of selection by altering which foci — and therefore which people — are structurally proximate to each other.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you joined a new community — a job, a city, a club — and found that your social circle quickly converged on a particular type of person. Looking back, how much of that convergence was you actively seeking similar people (selection), and how much were you shaped by the people you happened to encounter through shared activities (focal closure and social influence)? What would you do differently now to deliberately expand the diversity of your network, given what you understand about how foci structure who you meet?

2. Think of a belief, habit, or opinion you hold today that differs significantly from what you held five years ago. To what extent can you trace that change to your social network — to specific people whose influence gradually shifted your behavior or views? Does knowing about the mechanism of social influence change how you think about the authenticity of your current beliefs, or how deliberate you want to be about which communities you embed yourself in going forward?

3. Think of a neighborhood, workplace, or institution you know well that exhibits clear demographic homophily — where people of similar backgrounds cluster together. Before reading this chapter, you might have assumed this clustering reflected the strong active preferences of the people involved. Now that you understand the Schelling model, how does your interpretation of that clustering change? What does it imply about what interventions might actually work to increase integration — and what interventions might be well-intentioned but structurally doomed?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the Schelling model of segregation in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

Imagine a city where residents of two groups are mixed randomly, and each person simply wants at least a few of their immediate neighbors to be similar to them — not a majority, just enough that they don't feel completely isolated. When people who fall below that mild threshold move to find a more comfortable spot, their departure tips the composition of the neighborhood they left, which then pushes previously comfortable neighbors below the threshold too, setting off a chain reaction. The result, which emerges reliably from computer simulations and matches real-world maps of cities like Chicago, is near-complete residential segregation — even though no individual was trying to segregate anyone and many would have been perfectly happy living in a mixed neighborhood.

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter.

**Exercise:** In Chapter 3, you learned about the concept of *neighborhood overlap* between two nodes: the fraction of their neighbors that they share in common, used to measure tie strength and predict bridge edges. In Chapter 4, you learned that the behavioral similarity measure between two Wikipedia editors (Equation 4.1) — the fraction of articles both have edited out of the total articles either has edited — is precisely the neighborhood overlap of the two editors in the bipartite affiliation network of editors and articles.

Now consider a small social-affiliation network with five people (A, B, C, D, E) and three foci (X, Y, Z), where: A belongs to X and Y; B belongs to X and Y; C belongs to Y and Z; D belongs to Z only; E belongs to X only.

(a) Draw the full social-affiliation network as a bipartite graph.

(b) Compute the behavioral similarity (neighborhood overlap in the affiliation sense) between every pair of people: A-B, A-C, A-D, A-E, B-C, B-D, B-E, C-D, C-E, D-E.

(c) Using Chapter 3's framework, which pair of people would you predict is *most* likely to form a direct social tie via focal closure? Which pair would you predict is *least* likely?

(d) Now suppose A and B already have a social tie (a friendship edge). Using the notion of tie strength from Chapter 3, is the A-B friendship likely to be a local bridge? Why or why not, given what their high neighborhood overlap tells you?

(e) Finally, connect the two chapters' ideas: explain in two sentences why the edges with *high* neighborhood overlap in the affiliation network are *least* likely to be bridges in the projected social network on people, and what this implies about the relationship between shared activities and the strong-tie / weak-tie distinction.

**Chapters involved:** Chapter 4 + Chapter 3

---

## 📋 Action Items

1. On Monday morning before checking email, open LinkedIn (or your contacts list) and identify one person you have not spoken to in over a year who belongs to a professional or social community (focus) you are also part of. Send them a brief, specific message referencing that shared focus — "I saw you're still involved in [X], I've been thinking about [specific aspect] lately." This is a deliberate act of focal closure: using a shared activity to activate a dormant tie.

2. This week, map your own affiliation network on a single sheet of paper: write down five to eight foci you currently participate in (workplaces, clubs, classes, online communities, neighborhoods), and note which two or three people you know through each one. Look at the resulting bipartite structure and identify which of your foci has the greatest overlap with others — these are your highest-leverage contexts for expanding your network through focal and triadic closure. Decide whether this distribution reflects the kind of network you want, or whether you are over-indexed in a single homophilous cluster.

3. Before the end of this week, find one published study or news article about a social intervention (a public health program, a diversity initiative, an urban policy) that implicitly assumes homophily is driven by social influence. Write three sentences in a notebook evaluating whether the assumption is stated explicitly, what evidence would be needed to confirm it, and what would happen to the intervention's effectiveness if selection were the dominant mechanism instead. This exercise builds the habit of asking the selection/influence question whenever you encounter any claim about behavior spreading through social networks.
