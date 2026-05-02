"""
FlowTensor AST Parser
Parses PyTorch and Pandas Python code using the `ast` module.
Extracts transformation steps and builds a flow graph (nodes + edges).
NO code execution — AST analysis only (hard security boundary).
"""

import ast
from dataclasses import dataclass, field
from typing import Optional


class ParseError(Exception):
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message)
        self.detail = detail


# ---------------------------------------------------------------------------
# Operation knowledge base
# ---------------------------------------------------------------------------

PANDAS_OPS = {
    "read_csv": ("Reads a CSV file into a DataFrame", None, "DataFrame"),
    "read_excel": ("Reads an Excel file into a DataFrame", None, "DataFrame"),
    "read_json": ("Reads JSON data into a DataFrame", None, "DataFrame"),
    "read_parquet": ("Reads a Parquet file into a DataFrame", None, "DataFrame"),
    "dropna": ("Removes rows with missing (NaN) values", "DataFrame", "DataFrame (fewer rows)"),
    "fillna": ("Fills missing values with a specified value or method", "DataFrame", "DataFrame"),
    "drop": ("Drops specified rows or columns", "DataFrame", "DataFrame"),
    "rename": ("Renames columns or row labels", "DataFrame", "DataFrame"),
    "groupby": ("Groups data by one or more columns for aggregation", "DataFrame", "GroupBy"),
    "agg": ("Applies aggregation functions to grouped data", "GroupBy", "DataFrame"),
    "mean": ("Computes the mean of values", "Series/DataFrame", "scalar/Series"),
    "sum": ("Computes the sum of values", "Series/DataFrame", "scalar/Series"),
    "count": ("Counts non-null values", "Series/DataFrame", "scalar/Series"),
    "merge": ("Merges two DataFrames like a SQL join", "DataFrame", "DataFrame"),
    "join": ("Joins DataFrames on index or key columns", "DataFrame", "DataFrame"),
    "concat": ("Concatenates DataFrames along rows or columns", "list[DataFrame]", "DataFrame"),
    "sort_values": ("Sorts the DataFrame by one or more columns", "DataFrame", "DataFrame"),
    "reset_index": ("Resets the row index to the default integer index", "DataFrame", "DataFrame"),
    "set_index": ("Sets a column as the row index", "DataFrame", "DataFrame"),
    "head": ("Returns the first N rows of the DataFrame", "DataFrame", "DataFrame (N rows)"),
    "tail": ("Returns the last N rows of the DataFrame", "DataFrame", "DataFrame (N rows)"),
    "filter": ("Filters rows or columns based on a condition", "DataFrame", "DataFrame"),
    "query": ("Filters rows using a query expression string", "DataFrame", "DataFrame"),
    "apply": ("Applies a function along an axis of the DataFrame", "DataFrame", "DataFrame/Series"),
    "map": ("Maps values using a function or dictionary", "Series", "Series"),
    "astype": ("Casts a column to a different data type", "DataFrame/Series", "DataFrame/Series"),
    "pivot_table": ("Creates a pivot table summarizing data", "DataFrame", "DataFrame"),
    "melt": ("Unpivots a DataFrame from wide to long format", "DataFrame", "DataFrame"),
    "value_counts": ("Counts unique values in a column", "Series", "Series"),
    "nunique": ("Counts the number of unique values", "Series/DataFrame", "scalar/Series"),
    "describe": ("Generates descriptive statistics for the DataFrame", "DataFrame", "DataFrame"),
    "corr": ("Computes pairwise correlation between columns", "DataFrame", "DataFrame"),
    "isnull": ("Detects missing values, returning a boolean mask", "DataFrame", "DataFrame (bool)"),
    "notnull": ("Detects non-missing values, returning a boolean mask", "DataFrame", "DataFrame (bool)"),
    "duplicated": ("Returns a boolean Series for duplicate rows", "DataFrame", "Series (bool)"),
    "drop_duplicates": ("Removes duplicate rows", "DataFrame", "DataFrame"),
    "to_csv": ("Saves the DataFrame to a CSV file", "DataFrame", "None"),
    "to_excel": ("Saves the DataFrame to an Excel file", "DataFrame", "None"),
    "to_parquet": ("Saves the DataFrame to a Parquet file", "DataFrame", "None"),
    "iloc": ("Selects rows/columns by integer position", "DataFrame", "DataFrame/Series"),
    "loc": ("Selects rows/columns by label", "DataFrame", "DataFrame/Series"),
    "columns": ("Returns the column labels of the DataFrame", "DataFrame", "Index"),
    "shape": ("Returns (rows, columns) dimensions of the DataFrame", "DataFrame", "tuple"),
    "dtypes": ("Returns the data types of each column", "DataFrame", "Series"),
    "sample": ("Returns a random sample of rows", "DataFrame", "DataFrame"),
    "clip": ("Clips values at lower and upper bounds", "DataFrame/Series", "DataFrame/Series"),
    "abs": ("Returns the absolute value of numeric data", "DataFrame/Series", "DataFrame/Series"),
    "cumsum": ("Computes the cumulative sum", "Series/DataFrame", "Series/DataFrame"),
    "rolling": ("Creates a rolling window for aggregations", "DataFrame/Series", "Rolling"),
    "shift": ("Shifts data by a given number of periods", "DataFrame/Series", "DataFrame/Series"),
    "diff": ("Computes first discrete difference of element", "DataFrame/Series", "DataFrame/Series"),
}

PYTORCH_OPS = {
    # nn layers
    "Linear": ("Applies a learned linear transformation: y = xW^T + b", "Tensor [N, in]", "Tensor [N, out]"),
    "Conv2d": ("Applies a 2D convolution over an input image", "Tensor [N,C,H,W]", "Tensor [N,C',H',W']"),
    "Conv1d": ("Applies a 1D convolution over a sequence", "Tensor [N,C,L]", "Tensor [N,C',L']"),
    "ConvTranspose2d": ("Applies a 2D transposed convolution (upsampling)", "Tensor [N,C,H,W]", "Tensor [N,C',H',W']"),
    "BatchNorm2d": ("Normalizes a 2D batch of feature maps to speed training", "Tensor [N,C,H,W]", "Tensor [N,C,H,W]"),
    "BatchNorm1d": ("Normalizes a 1D batch across the feature dimension", "Tensor [N,C]", "Tensor [N,C]"),
    "LayerNorm": ("Normalizes across the last D dimensions within each sample", "Tensor [...,D]", "Tensor [...,D]"),
    "Dropout": ("Randomly zeros elements during training to prevent overfitting", "Tensor", "Tensor"),
    "Dropout2d": ("Randomly zeros entire channels during training", "Tensor [N,C,H,W]", "Tensor [N,C,H,W]"),
    "MaxPool2d": ("Downsamples by taking the max value in each window", "Tensor [N,C,H,W]", "Tensor [N,C,H',W']"),
    "AvgPool2d": ("Downsamples by averaging values in each window", "Tensor [N,C,H,W]", "Tensor [N,C,H',W']"),
    "AdaptiveAvgPool2d": ("Averages feature maps to a fixed output size", "Tensor [N,C,H,W]", "Tensor [N,C,H',W']"),
    "Flatten": ("Flattens all dimensions except the batch dimension", "Tensor [N,...]", "Tensor [N, D]"),
    "Embedding": ("Maps integer token indices to dense vector representations", "Tensor [N,L]", "Tensor [N,L,D]"),
    "LSTM": ("Applies a multi-layer Long Short-Term Memory RNN", "Tensor [L,N,H_in]", "Tensor [L,N,H_out]"),
    "GRU": ("Applies a multi-layer Gated Recurrent Unit RNN", "Tensor [L,N,H_in]", "Tensor [L,N,H_out]"),
    "RNN": ("Applies a simple recurrent neural network layer", "Tensor [L,N,H_in]", "Tensor [L,N,H_out]"),
    "MultiheadAttention": ("Applies multi-head attention: attends to different positions in parallel", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "TransformerEncoderLayer": ("Single Transformer encoder block (attention + FFN)", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "TransformerDecoderLayer": ("Single Transformer decoder block (masked attention + cross-attention + FFN)", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "ReLU": ("Applies Rectified Linear Unit: f(x) = max(0, x)", "Tensor", "Tensor (non-negative)"),
    "LeakyReLU": ("Like ReLU but allows small negative values to pass through", "Tensor", "Tensor"),
    "Sigmoid": ("Applies sigmoid: f(x) = 1/(1+e^-x), squashes to [0,1]", "Tensor", "Tensor [0,1]"),
    "Tanh": ("Applies hyperbolic tangent, squashes to [-1,1]", "Tensor", "Tensor [-1,1]"),
    "Softmax": ("Normalizes values to a probability distribution (sum=1)", "Tensor", "Tensor (probs)"),
    "LogSoftmax": ("Log of Softmax — numerically stable for cross-entropy", "Tensor", "Tensor (log-probs)"),
    "GELU": ("Applies Gaussian Error Linear Unit activation", "Tensor", "Tensor"),
    "SiLU": ("Applies Sigmoid Linear Unit (Swish) activation: x * sigmoid(x)", "Tensor", "Tensor"),
    "Sequential": ("Chains multiple layers to run in sequence", "Tensor", "Tensor"),
    "ModuleList": ("Holds a list of modules as an indexed list", "Tensor", "Tensor"),
    # functional ops
    "relu": ("Applies Rectified Linear Unit: max(0, x)", "Tensor", "Tensor (non-negative)"),
    "sigmoid": ("Applies sigmoid activation, squashes values to [0,1]", "Tensor", "Tensor [0,1]"),
    "tanh": ("Applies hyperbolic tangent activation, squashes to [-1,1]", "Tensor", "Tensor [-1,1]"),
    "softmax": ("Normalizes tensor to probability distribution", "Tensor", "Tensor (probs)"),
    "dropout": ("Randomly zeroes elements for regularization", "Tensor", "Tensor"),
    "cross_entropy": ("Computes cross-entropy loss between predictions and targets", "Tensor, Tensor", "scalar"),
    "mse_loss": ("Computes mean squared error between predictions and targets", "Tensor, Tensor", "scalar"),
    "binary_cross_entropy": ("Computes binary cross-entropy loss", "Tensor, Tensor", "scalar"),
    "matmul": ("Multiplies two matrices/tensors together", "Tensor, Tensor", "Tensor"),
    "mm": ("Performs matrix multiplication of two 2D tensors", "Tensor [N,M], Tensor [M,K]", "Tensor [N,K]"),
    "bmm": ("Performs batch matrix multiplication", "Tensor [B,N,M], Tensor [B,M,K]", "Tensor [B,N,K]"),
    "cat": ("Concatenates tensors along a specified dimension", "list[Tensor]", "Tensor"),
    "stack": ("Stacks tensors along a new dimension", "list[Tensor]", "Tensor"),
    "view": ("Reshapes a tensor without copying data", "Tensor", "Tensor (reshaped)"),
    "reshape": ("Returns a tensor with the same data and new shape", "Tensor", "Tensor (reshaped)"),
    "transpose": ("Swaps two dimensions of a tensor", "Tensor", "Tensor (transposed)"),
    "permute": ("Reorders all dimensions according to the given order", "Tensor", "Tensor (permuted)"),
    "squeeze": ("Removes dimensions of size 1", "Tensor", "Tensor (squeezed)"),
    "unsqueeze": ("Adds a new dimension of size 1 at the given position", "Tensor", "Tensor (unsqueezed)"),
    "mean": ("Computes mean across one or more dimensions", "Tensor", "Tensor/scalar"),
    "sum": ("Computes sum across one or more dimensions", "Tensor", "Tensor/scalar"),
    "max": ("Returns the maximum values along a dimension", "Tensor", "Tensor/scalar"),
    "min": ("Returns the minimum values along a dimension", "Tensor", "Tensor/scalar"),
    "norm": ("Computes the vector/matrix norm", "Tensor", "scalar"),
    "zeros": ("Creates a tensor filled with zeros", None, "Tensor"),
    "ones": ("Creates a tensor filled with ones", None, "Tensor"),
    "randn": ("Creates a tensor with values sampled from N(0,1)", None, "Tensor"),
    "rand": ("Creates a tensor with uniform random values in [0,1)", None, "Tensor"),
    "tensor": ("Creates a tensor from existing data", "data", "Tensor"),
    "from_numpy": ("Creates a tensor from a NumPy array (shares memory)", "ndarray", "Tensor"),
    "flatten": ("Flattens a contiguous range of dimensions", "Tensor", "Tensor (flattened)"),
    "clamp": ("Clamps tensor values to a min/max range", "Tensor", "Tensor (clamped)"),
    "abs": ("Computes the element-wise absolute value", "Tensor", "Tensor"),
    "exp": ("Computes element-wise natural exponential e^x", "Tensor", "Tensor"),
    "log": ("Computes element-wise natural logarithm", "Tensor", "Tensor"),
    "sqrt": ("Computes element-wise square root", "Tensor", "Tensor"),
    "pow": ("Raises tensor elements to the given power", "Tensor, scalar", "Tensor"),
    "einsum": ("Computes arbitrary tensor contractions using Einstein notation", "Tensor(s)", "Tensor"),
    "chunk": ("Splits a tensor into N equal chunks along a dimension", "Tensor", "list[Tensor]"),
    "split": ("Splits a tensor into pieces of given size along a dimension", "Tensor", "list[Tensor]"),
    "gather": ("Gathers values along an axis using index tensor", "Tensor", "Tensor"),
    "scatter": ("Writes values into a tensor at specified positions", "Tensor", "Tensor"),
    "where": ("Selects elements from two tensors based on a condition", "bool Tensor, Tensor, Tensor", "Tensor"),
    "masked_fill": ("Fills elements where a mask is True with a scalar value", "Tensor, bool mask", "Tensor"),
    "topk": ("Returns the top-k largest values and their indices", "Tensor", "Tensor values, Tensor indices"),
    "argmax": ("Returns the index of the maximum value along a dimension", "Tensor", "Tensor (indices)"),
    "argmin": ("Returns the index of the minimum value along a dimension", "Tensor", "Tensor (indices)"),
    "pad": ("Pads a tensor with a constant value on specified sides", "Tensor", "Tensor (padded)"),
    "interpolate": ("Resizes/upsamples a tensor to a target size", "Tensor", "Tensor (resized)"),
    "normalize": ("Normalizes a tensor to unit norm along a dimension", "Tensor", "Tensor (unit norm)"),
    "one_hot": ("Converts integer labels to one-hot encoded vectors", "Tensor (int)", "Tensor (one-hot)"),
    "grid_sample": ("Samples a tensor at specified grid coordinates", "Tensor, grid Tensor", "Tensor"),
}

TORCH_CREATION_OPS = {"zeros", "ones", "randn", "rand", "tensor", "from_numpy", "arange", "linspace", "eye"}


# ---------------------------------------------------------------------------
# Framework detection helpers
# ---------------------------------------------------------------------------

def detect_framework(code: str) -> str:
    has_pandas = "pandas" in code or "import pd" in code or "pd." in code or "DataFrame" in code
    has_pytorch = "torch" in code or "nn." in code or "F." in code or "tensor" in code.lower()
    if has_pandas and has_pytorch:
        return "mixed"
    if has_pandas:
        return "pandas"
    if has_pytorch:
        return "pytorch"
    return "unknown"


def classify_node_type(op_name: str, framework: str) -> str:
    if op_name in PANDAS_OPS:
        return "pandas"
    if op_name in PYTORCH_OPS:
        return "pytorch"
    if op_name in TORCH_CREATION_OPS:
        return "input"
    return "intermediate"


# ---------------------------------------------------------------------------
# AST visitor
# ---------------------------------------------------------------------------

@dataclass
class RawStep:
    op: str
    var_name: Optional[str] = None
    args_source: Optional[str] = None
    lineno: int = 0


class FlowExtractor(ast.NodeVisitor):
    """
    Visits a Python AST and extracts transformation steps.
    Handles:
      - pd.read_csv(), df.dropna(), df.groupby().agg()  (Pandas)
      - nn.Linear(), F.relu(), torch.matmul()           (PyTorch)
      - model = nn.Sequential(...)
      - Direct assignments: x = tensor([...])
    """

    def __init__(self):
        self.steps: list[RawStep] = []

    def _record(self, op: str, var_name: Optional[str], lineno: int):
        self.steps.append(RawStep(op=op, var_name=var_name, lineno=lineno))

    def visit_Assign(self, node: ast.Assign):
        # LHS: try to get the variable name
        var_name = None
        if node.targets and isinstance(node.targets[0], ast.Name):
            var_name = node.targets[0].id

        self._extract_from_expr(node.value, var_name)
        self.generic_visit(node)

    def visit_Expr(self, node: ast.Expr):
        self._extract_from_expr(node.value, None)
        self.generic_visit(node)

    def _extract_from_expr(self, node: ast.expr, var_name: Optional[str]):
        """Recursively extract meaningful calls from an expression."""
        if isinstance(node, ast.Call):
            op = self._get_call_name(node)
            if op:
                self._record(op, var_name, getattr(node, "lineno", 0))
            # Recurse into the function's object (handles chained calls)
            self._extract_from_expr(node.func, None)
            for arg in node.args:
                self._extract_from_expr(arg, None)

        elif isinstance(node, ast.Attribute):
            # e.g. df.groupby("x")  -- just recurse into value
            self._extract_from_expr(node.value, None)

    def _get_call_name(self, node: ast.Call) -> Optional[str]:
        """Returns the bare operation name from a Call node, or None."""
        func = node.func

        # torch.nn.Linear(...)  or  nn.Linear(...)  or  F.relu(...)
        if isinstance(func, ast.Attribute):
            return func.attr

        # torch.randn(...)  or  pd.read_csv(...)
        if isinstance(func, ast.Name):
            return func.id

        return None


# ---------------------------------------------------------------------------
# Shape inference helpers
# ---------------------------------------------------------------------------

def _infer_shape_from_args(node: ast.Call) -> Optional[str]:
    """Try to pull a shape from the call arguments (best-effort)."""
    try:
        if not node.args:
            return None
        first = node.args[0]
        if isinstance(first, (ast.Constant,)):
            return str(first.value)
        if isinstance(first, (ast.List, ast.Tuple)):
            parts = []
            for elt in first.elts:
                if isinstance(elt, ast.Constant):
                    parts.append(str(elt.value))
                else:
                    parts.append("?")
            return "[" + ", ".join(parts) + "]"
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_python_code(code: str) -> dict:
    """
    Parse Python source code (PyTorch or Pandas) and return a flow graph.
    Raises ParseError if the code cannot be understood.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ParseError(
            "Python syntax error — check your code for typos or missing brackets.",
            detail=str(e),
        )

    extractor = FlowExtractor()
    extractor.visit(tree)

    framework = detect_framework(code)

    # Filter to only known operations
    known_steps = [
        s for s in extractor.steps
        if s.op in PANDAS_OPS or s.op in PYTORCH_OPS
    ]

    # If no known ops, still show something useful
    if not known_steps:
        # Try to show all function calls as "unknown" intermediate nodes
        all_steps = extractor.steps
        if not all_steps:
            raise ParseError(
                "No recognizable data transformation steps found. Try pasting Pandas or PyTorch code.",
                detail="FlowTensor understands Pandas and PyTorch operations. Example: df = pd.read_csv('data.csv'); df = df.dropna()",
            )
        known_steps = all_steps[:12]

    # Build nodes
    nodes = []
    edges = []
    x_gap = 320
    y_gap = 140
    max_per_col = 4

    for i, step in enumerate(known_steps):
        col = i // max_per_col
        row = i % max_per_col
        pos_x = 60 + col * x_gap
        pos_y = 60 + row * y_gap

        node_type = classify_node_type(step.op, framework)

        # Lookup description and shapes
        if step.op in PANDAS_OPS:
            desc, in_shape, out_shape = PANDAS_OPS[step.op]
        elif step.op in PYTORCH_OPS:
            desc, in_shape, out_shape = PYTORCH_OPS[step.op]
        else:
            desc = f"Calls the {step.op}() function"
            in_shape = None
            out_shape = None

        label = f"{step.op}()"
        node_id = f"node_{i}"

        nodes.append({
            "id": node_id,
            "type": node_type,
            "label": label,
            "description": desc,
            "input_shape": in_shape,
            "output_shape": out_shape,
            "position_x": pos_x,
            "position_y": pos_y,
        })

        # Connect to the previous node
        if i > 0:
            edges.append({
                "id": f"edge_{i-1}_{i}",
                "source": f"node_{i-1}",
                "target": node_id,
            })

    return {
        "nodes": nodes,
        "edges": edges,
        "framework": framework,
    }
