import marimo
app = marimo.App()

@app.cell
def _bad(mo):
    return mo.md("hello"), mo.vstack([mo.md("world")])
