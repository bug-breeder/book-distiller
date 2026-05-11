# Pyodide / marimo Authoring Rules (R1–R9)

These nine bug classes pass `marimo check` but break the WASM browser runtime. Every chapter notebook MUST avoid all of them.

## R1 — Library whitelist

Allow only: `marimo`, `numpy`, `matplotlib.pyplot`, `io`, `random`, `math`, `collections`, `networkx` (math chapters only, with R6 caveat).
Forbid: `scipy`, `pandas`, `plotly`, `sklearn`, `seaborn`, `requests`, `bs4`.
**Why:** these aren't pre-installed in Pyodide; importing them throws ModuleNotFoundError at boot.

## R2 — Cell variable uniqueness

Every top-level name in a cell becomes a marimo "definition" and MUST be unique across the entire notebook OR prefixed with `_` to be cell-local.
**Why:** marimo errors with "Multiple definitions of name `foo`."

## R3 — `_`-prefixed names cannot cross cells

If a value needs to be read in another cell, give it a unique non-underscored name.
```python
# WRONG — _picker is cell-local
@app.cell
def _one(mo):
    _picker = mo.ui.dropdown(options=["a"])
    return (_picker,)

# RIGHT
@app.cell
def _one(mo):
    my_picker = mo.ui.dropdown(options=["a"])
    return (my_picker,)
```

## R4 — Widget creation and `.value` access in separate cells

A `mo.ui.X(...)` and the read of its `.value` must be in different cells.
```python
# WRONG — same-cell .value
@app.cell
def _bad(mo):
    chosen = mo.ui.dropdown(options=["a"]).value
    return chosen

# RIGHT — split picker + display
@app.cell
def _picker(mo):
    picker = mo.ui.dropdown(options=["a"])
    return (picker,)

@app.cell
def _display(mo, picker):
    return mo.md(f"You picked {picker.value}")
```

## R5 — No tuple-expression returns

`return mo.md("..."), mo.vstack(...)` parses as a tuple; marimo renders only one element.
```python
# WRONG
return mo.md("hi"), mo.vstack([item])

# RIGHT
return mo.vstack([mo.md("hi"), item])
```

## R6 — No scipy-requiring networkx functions

Avoid `nx.spring_layout`, `nx.kamada_kawai_layout`, `nx.to_scipy_sparse_array`.
Use `nx.circular_layout`, `nx.random_layout`, or a hand-built dict:
```python
rng = random.Random(42)
pos = {n: (rng.random(), rng.random()) for n in G.nodes()}
```

## R7 — No orphan nodes or unreferenced options

Every node referenced anywhere must be in the master node list. Same for edges, dropdown options, scenarios. Mismatch causes `NetworkXError: Node 'X' has no position` or silent KeyError.

## R8 — `mo.ui.radio` returns the label string, not the index

Conditionals must check `==` against the exact option string:
```python
if my_radio.value == "Contrast Principle":
    feedback = "Correct!"
```

## R9 — Post-export figures symlink (skill-level concern, not agent-level)

After `marimo export html-wasm`, if the notebook references `figures/...`, the skill must run `ln -sf public/figures dist/figures`. Marimo's export puts assets at `dist/public/figures/` but notebook references are relative.

## Matplotlib output pattern (use this exactly)

```python
@app.cell(hide_code=True)
def _plot(mo, plt, io):
    _fig, _ax = plt.subplots(figsize=(7, 4))
    # ... plotting ...
    _buf = io.BytesIO()
    _fig.savefig(_buf, format="png", dpi=140, bbox_inches="tight")
    plt.close(_fig)
    _buf.seek(0)
    return mo.image(_buf.read(), width="100%")
```
