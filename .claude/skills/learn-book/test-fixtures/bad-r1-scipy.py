import marimo
import scipy.sparse
import networkx as nx
app = marimo.App()

@app.cell
def _layout(nx):
    G = nx.cycle_graph(5)
    pos = nx.spring_layout(G)
    return pos
