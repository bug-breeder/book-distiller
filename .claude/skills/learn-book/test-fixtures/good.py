import marimo
app = marimo.App(width="medium")

@app.cell(hide_code=True)
def _imports():
    import marimo as mo
    import matplotlib.pyplot as plt
    import io
    return io, mo, plt

@app.cell(hide_code=True)
def _picker(mo):
    my_picker = mo.ui.dropdown(options=["a", "b"], value="a")
    return (my_picker,)

@app.cell(hide_code=True)
def _display(mo, my_picker):
    return mo.md(f"You picked: {my_picker.value}")

if __name__ == "__main__":
    app.run()
