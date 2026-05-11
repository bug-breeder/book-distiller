import marimo
app = marimo.App()

@app.cell
def _one():
    _hidden = 42
    return (_hidden,)
