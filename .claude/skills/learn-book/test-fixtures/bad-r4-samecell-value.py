import marimo
app = marimo.App()

@app.cell
def _bad(mo):
    picked = mo.ui.dropdown(options=["x"]).value
    return picked
