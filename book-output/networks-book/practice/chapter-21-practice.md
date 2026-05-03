# Practice Exercises: Chapter 21 — Part V: Network Dynamics: Population Models

## 🧪 Comprehension Check

**Q1:** In a population model of network dynamics, what is the difference between a fixed-point equilibrium and a dynamic equilibrium, and why does this distinction matter when predicting long-run behavior in a network?
<details>
<summary>Answer</summary>

A fixed-point equilibrium is a state where the system has stopped changing — every agent's behavior is a best response to the current population distribution and no one has an incentive to deviate. A dynamic equilibrium (such as a limit cycle) is one where the population keeps shifting but in a structured, recurring pattern. The distinction matters because many population models that look like they should converge to a single stable state actually oscillate, meaning predictions about "where the population ends up" require knowing whether the dynamics converge, cycle, or are sensitive to initial conditions.

</details>

---

**Q2:** Evolutionary game theory replaces the assumption of perfectly rational actors with one of selection pressure and replication. What mechanisms cause strategies that perform well to spread through a population, and what prevents a single strategy from always taking over?
<details>
<summary>Answer</summary>

Strategies spread when agents who use them earn higher payoffs than average, since those agents are more likely to survive, reproduce, or be imitated. In replicator dynamics, the growth rate of a strategy is proportional to how much its payoff exceeds the population average payoff. However, frequency-dependence prevents total takeover: as a successful strategy becomes more common, it often starts to perform worse (because everyone else is now playing against it), creating negative feedback that preserves diversity. This is the mechanism behind evolutionarily stable strategies — a strategy that, once common, resists invasion by rare mutants.

</details>

---

**Q3:** What is an evolutionarily stable strategy (ESS), and how does it differ from a Nash equilibrium? Can a Nash equilibrium fail to be an ESS, and if so, give an intuitive example of why?
<details>
<summary>Answer</summary>

A Nash equilibrium is a strategy profile where no single player can improve by unilaterally deviating. An ESS is a stricter concept: a strategy is evolutionarily stable if, when it is adopted by nearly the entire population, any small group of mutants playing a different strategy does strictly worse and therefore cannot invade. A Nash equilibrium can fail to be an ESS when a mutant strategy earns the same payoff against the incumbent (neutrally stable), because the mutant can drift to higher frequency without selection removing it. For example, in a symmetric coordination game where two Nash equilibria exist, an equal mixture might be a Nash equilibrium but not an ESS because mutants playing one pure strategy can grow without being punished.

</details>

---

**Q4:** In the SIR (Susceptible-Infected-Recovered) model of disease spreading, what role does the basic reproduction number R₀ play, and what happens dynamically when R₀ crosses the threshold value of 1?
<details>
<summary>Answer</summary>

R₀ represents the expected number of secondary infections produced by a single infected individual in an entirely susceptible population. When R₀ < 1, each infected person infects on average less than one new person, so the infection dies out exponentially — the disease cannot sustain itself. When R₀ > 1, each infection generates more than one new infection on average, leading to exponential growth in the early phase and eventually a major epidemic. At R₀ = 1 exactly, the system is at a critical threshold. This threshold behavior is fundamental: small changes in transmissibility or contact rates can push a disease from self-limiting to epidemic, which is why epidemic control efforts target reducing R₀ below 1 through vaccination (reducing susceptibles) or behavioral change (reducing contact rates).

</details>

---

**Q5:** How does network structure affect epidemic spreading compared to the well-mixed population assumption of the classic SIR model? Why do highly connected "hubs" play a disproportionate role?
<details>
<summary>Answer</summary>

The classic SIR model assumes every individual can potentially infect every other individual with equal probability — a fully mixed population. Real networks have heterogeneous degree distributions where some nodes (hubs) have vastly more connections than average. In network-based spreading, an infected hub transmits the disease to far more neighbors than an infected low-degree node, so hubs disproportionately drive epidemic size and speed. In scale-free networks (where degree follows a power-law), this effect is so pronounced that the epidemic threshold R₀ effectively approaches zero — nearly any transmissible disease will spread. This explains why targeted immunization of hubs is far more efficient than random vaccination in suppressing epidemics.

</details>

---

## 🔄 Apply It

**Scenario 1: Hawk-Dove dynamics in a startup ecosystem**
In a regional startup ecosystem, companies can pursue aggressive patent-filing strategies ("Hawk") or collaborative, open-innovation strategies ("Dove"). When two Hawks meet over a disputed technology, they both incur costly litigation. When two Doves meet, they share the gain cooperatively. When a Hawk meets a Dove, the Hawk takes all.

*What should you consider?*
- What is the payoff matrix, and what mixed-strategy equilibrium does it predict for the ecosystem?
- Under replicator dynamics, does the population converge to this equilibrium, and how does the cost of litigation relative to the value of the technology determine the equilibrium frequency of Hawks?
- What policy intervention (e.g., patent reform that raises litigation costs) would shift the equilibrium toward more collaborative behavior?

<details>
<summary>Model Response</summary>

In the Hawk-Dove payoff matrix, let V be the value of the resource and C be the cost of conflict. Hawks playing Hawks each get (V - C)/2; a Hawk against a Dove gets V; a Dove against a Hawk gets 0; two Doves each get V/2. When C > V, pure Hawk is not a Nash equilibrium because mutual Hawk play yields negative expected payoffs. The evolutionarily stable mixed equilibrium has Hawks at frequency p* = V/C. Under replicator dynamics, the population oscillates around this equilibrium (or converges to it depending on exact dynamics) — neither strategy fully takes over. A policy raising C (e.g., mandatory litigation fees, stronger inter-firm arbitration) reduces p*, shifting the ecosystem toward more Dove behavior. Conversely, reducing V (e.g., limiting patent scope) has a similar effect. The key insight is that the equilibrium is determined by the ratio V/C, not by the absolute values of payoffs, so policymakers have multiple levers.

</details>

---

**Scenario 2: Vaccine hesitancy and herd immunity**
A city of 500,000 people is facing a respiratory illness with R₀ = 4. Public health officials are planning a voluntary vaccination campaign. Surveys show that 30% of residents are hesitant. A vaccine provides complete immunity.

*What should you consider?*
- What fraction of the population must be vaccinated to achieve herd immunity (reduce the effective reproduction number below 1)?
- If hesitancy keeps vaccination below that threshold, how does the population dynamics of the SIR model predict the epidemic will unfold?
- What behavioral-game-theoretic argument explains why individual incentives can undermine collective protection even when vaccination is safe and effective?

<details>
<summary>Model Response</summary>

The herd immunity threshold is 1 - 1/R₀ = 1 - 1/4 = 75%. With 30% of the population hesitant, the maximum achievable vaccination rate is 70%, which is just below the herd immunity threshold. Even 70% coverage brings the effective R₀ down to 4 × (1 - 0.70) = 1.2, meaning an epidemic can still occur, just more slowly and with a smaller final size. The SIR model predicts that under these conditions, a significant fraction of the unvaccinated (and some vaccinated individuals if the vaccine is imperfect) will eventually be infected. The game-theoretic trap is a free-rider problem: each individual's incentive to vaccinate depends on how many others are vaccinating. Once coverage is high enough that perceived personal risk is low, rational self-interest discourages vaccination even though each person's decision collectively erodes herd immunity. This is why voluntary campaigns alone often fail to reach the threshold and why behavioral interventions or mandates may be necessary.

</details>

---

**Scenario 3: Misinformation spreading on a social platform**
A social media platform notices that a piece of health misinformation is spreading. They have data showing the network's degree distribution is approximately scale-free, with a small number of accounts having millions of followers. The platform must decide between two moderation strategies: (A) randomly remove 20% of accounts spreading the content, or (B) identify and suspend the top 100 highest-follower accounts spreading it.

*What should you consider?*
- How does the scale-free network structure affect which strategy will be more effective?
- What does epidemic spreading theory on networks predict about the relative impact of random versus targeted removal?
- What are the practical and ethical trade-offs of the targeted approach?

<details>
<summary>Model Response</summary>

In a scale-free network, random removal of 20% of nodes has minimal impact on connectivity and spreading because most removed nodes are low-degree and contribute little to transmission. The giant component (the main spreading pathway) remains intact. Targeted removal of hubs, by contrast, is enormously effective: removing the top 100 accounts — which in a scale-free network may account for a disproportionate share of total reach — can fragment the spreading network, dramatically reduce the effective R₀ of the misinformation, and potentially push it below the epidemic threshold. Epidemic theory on heterogeneous networks confirms that hub-targeted interventions require far fewer removals to suppress spreading than random interventions. The practical trade-off is that targeting high-follower accounts is more visible, politically contentious, and subject to accusations of censorship bias, whereas random removal is less effective but easier to defend as neutral. The ethical tension lies in disproportionately silencing large accounts versus allowing dangerous content to spread widely; any effective intervention must weigh both the network-theoretic efficiency gains and the fairness concerns of targeted action.

</details>

---

## ✍️ Reflection Prompts

1. Think of a time when you adopted a behavior (a diet, a productivity system, a communication style) because many people around you were doing it, even though you were not fully convinced it was optimal. Now that you understand how population dynamics can sustain suboptimal equilibria — because no one has an incentive to deviate unilaterally — what does that experience reveal about the difference between "common" and "best," and how would you evaluate popular practices differently going forward?

2. Think of a community, team, or organization you belong to where norms feel stuck — where people seem to maintain a behavior that most privately dislike, like excessive formality in meetings or a culture of overwork. What would you do differently now that you understand the concept of an evolutionarily stable strategy and why even a collectively preferred alternative can fail to invade if it performs worse when rare?

3. Think of a time you witnessed or participated in a rapid behavioral shift — a social movement spreading online, a rumor sweeping through a school, a panic buying episode. What would you look for differently now that you understand epidemic thresholds, the role of early adopters, and how network structure (rather than just message quality) determines whether something spreads or dies out?

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain the concept of an evolutionarily stable strategy to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

An evolutionarily stable strategy is a behavioral rule that, once most members of a group are following it, is self-protecting — any small group of individuals trying a different approach will do worse and eventually disappear. It is stable not because someone designed it to be fair or optimal, but because it passes a simple evolutionary test: if nearly everyone does X, then doing Y instead must hurt you. This means many of the behavioral norms we see in the world — aggression levels, cooperation rates, signaling habits — persist not because they are the best possible arrangements, but because they are immune to invasion by alternatives once they become common.

</details>

---

## 🧩 Synthesis Challenge

**Exercise:** Consider a network where agents play a coordination game (like choosing between two technology standards) and the network has a scale-free degree distribution. Using what you know about network structure and epidemic spreading thresholds from Part V, predict how a new technology standard would spread if it is initially adopted only by a small random set of low-degree nodes versus if it is adopted first by the top five highest-degree hubs. Then use the game-theoretic concept of tipping points from the earlier cascades chapters to explain under what conditions the new standard becomes self-sustaining, and whether the hub-first adoption path can guarantee convergence to the new equilibrium.

**Chapters involved:** Chapter 21 (Part V — Network Dynamics: Population Models) + Chapter 19 (Cascading Behavior in Networks)

---

## 📋 Action Items

1. On Monday morning before checking email, draw the payoff matrix for one repeated social interaction in your life (a negotiation with a colleague, a recurring coordination problem with a partner or roommate) and identify whether the current outcome looks like a Nash equilibrium, an ESS, or neither — then write one sentence about what would have to change for a better equilibrium to become stable.

2. This week, look up the current R₀ estimate for one disease that has been in the news recently (influenza, COVID-19 variants, RSV) and calculate the implied herd immunity threshold; then find the current estimated vaccination or immunity rate for your country and assess whether the population is above or below that threshold — write a two-paragraph interpretation of what the SIR model predicts will happen next.

3. Before Friday, pick one online community you participate in (a subreddit, a Slack workspace, a Twitter/X list) and map out — even informally — which five accounts or members seem to have the most connections or influence; then reason through what would happen to information flow in that community if those five nodes went silent, applying the hub-removal logic from network epidemic theory to a real case you can observe directly.
