"""
FlowTensor AST Parser v2
Parses PyTorch and Pandas Python code using the `ast` module.
Builds a rich flow graph that understands:
- Class definitions (group header + method bodies)
- transforms.Compose pipelines (each transform expanded as a sequential node)
- DataLoader detection with kwargs surfaced as label badges
- For loops with body extraction (incl. .to(device) GPU transfers)
- Variable assignment tracking (train_ds = ImageDataset(...))
NO code execution — AST analysis only (hard security boundary).
"""

import ast
from dataclasses import dataclass
from typing import Optional


class ParseError(Exception):
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message)
        self.detail = detail


# ---------------------------------------------------------------------------
# Operation knowledge bases
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
    "sample": ("Returns a random sample of rows", "DataFrame", "DataFrame"),
    "clip": ("Clips values at lower and upper bounds", "DataFrame/Series", "DataFrame/Series"),
    "abs": ("Returns the absolute value of numeric data", "DataFrame/Series", "DataFrame/Series"),
    "cumsum": ("Computes the cumulative sum", "Series/DataFrame", "Series/DataFrame"),
    "rolling": ("Creates a rolling window for aggregations", "DataFrame/Series", "Rolling"),
    "shift": ("Shifts data by a given number of periods", "DataFrame/Series", "DataFrame/Series"),
    "diff": ("Computes first discrete difference of element", "DataFrame/Series", "DataFrame/Series"),
    "resample": ("Resamples time-series data to a new frequency", "DataFrame", "DataFrame"),
}

PYTORCH_OPS = {
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
    "MultiheadAttention": ("Applies multi-head attention", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "TransformerEncoderLayer": ("Single Transformer encoder block", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "TransformerDecoderLayer": ("Single Transformer decoder block", "Tensor [L,N,D]", "Tensor [L,N,D]"),
    "ReLU": ("Applies Rectified Linear Unit: f(x) = max(0, x)", "Tensor", "Tensor (non-negative)"),
    "LeakyReLU": ("Like ReLU but allows small negative values to pass through", "Tensor", "Tensor"),
    "Sigmoid": ("Applies sigmoid: f(x) = 1/(1+e^-x), squashes to [0,1]", "Tensor", "Tensor [0,1]"),
    "Tanh": ("Applies hyperbolic tangent, squashes to [-1,1]", "Tensor", "Tensor [-1,1]"),
    "Softmax": ("Normalizes values to a probability distribution (sum=1)", "Tensor", "Tensor (probs)"),
    "LogSoftmax": ("Log of Softmax — numerically stable for cross-entropy", "Tensor", "Tensor (log-probs)"),
    "GELU": ("Applies Gaussian Error Linear Unit activation", "Tensor", "Tensor"),
    "SiLU": ("Applies Sigmoid Linear Unit (Swish) activation", "Tensor", "Tensor"),
    "Sequential": ("Chains multiple layers to run in sequence", "Tensor", "Tensor"),
    "ModuleList": ("Holds a list of modules as an indexed list", "Tensor", "Tensor"),
    "relu": ("Applies Rectified Linear Unit: max(0, x)", "Tensor", "Tensor (non-negative)"),
    "sigmoid": ("Applies sigmoid activation, squashes values to [0,1]", "Tensor", "Tensor [0,1]"),
    "tanh": ("Applies hyperbolic tangent activation", "Tensor", "Tensor [-1,1]"),
    "softmax": ("Normalizes tensor to probability distribution", "Tensor", "Tensor (probs)"),
    "dropout": ("Randomly zeroes elements for regularization", "Tensor", "Tensor"),
    "cross_entropy": ("Computes cross-entropy loss between predictions and targets", "Tensor, Tensor", "scalar"),
    "mse_loss": ("Computes mean squared error", "Tensor, Tensor", "scalar"),
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
    "einsum": ("Computes arbitrary tensor contractions", "Tensor(s)", "Tensor"),
    "chunk": ("Splits a tensor into N equal chunks along a dimension", "Tensor", "list[Tensor]"),
    "split": ("Splits a tensor into pieces of given size", "Tensor", "list[Tensor]"),
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
    # Optimizers (treated as PyTorch ops for description lookup)
    "Adam": ("Adam optimizer — adaptive moment estimation", "model.parameters()", "Optimizer"),
    "AdamW": ("Adam with decoupled weight decay", "model.parameters()", "Optimizer"),
    "SGD": ("Stochastic gradient descent optimizer", "model.parameters()", "Optimizer"),
    "RMSprop": ("RMSprop optimizer — adaptive learning rate", "model.parameters()", "Optimizer"),
    "step": ("Applies one optimizer step to update parameters", "Optimizer", "updated weights"),
    "zero_grad": ("Clears gradient buffers before the next backward pass", "Optimizer", "(side-effect)"),
    "backward": ("Computes gradients via backpropagation", "Tensor (loss)", "(.grad on params)"),
    # Loss functions
    "CrossEntropyLoss": ("Cross-entropy loss for classification", "Tensor, Tensor", "scalar"),
    "MSELoss": ("Mean-squared-error loss", "Tensor, Tensor", "scalar"),
    "BCELoss": ("Binary cross-entropy loss", "Tensor, Tensor", "scalar"),
    "NLLLoss": ("Negative log-likelihood loss", "Tensor, Tensor", "scalar"),
    "L1Loss": ("L1 loss (mean absolute error)", "Tensor, Tensor", "scalar"),
    "StepLR": ("Decays learning rate by gamma every step_size epochs", "Optimizer", "Scheduler"),
}

TORCH_CREATION_OPS = {"zeros", "ones", "randn", "rand", "tensor", "from_numpy", "arange", "linspace", "eye"}

TRANSFORM_OPS = {
    "Resize": "Resizes images to a target H×W size.",
    "ToTensor": "Converts a PIL/numpy image to a [C,H,W] float tensor in [0,1].",
    "Normalize": "Normalizes a tensor channel-wise using mean and std.",
    "RandomCrop": "Randomly crops a region of the image.",
    "RandomHorizontalFlip": "Randomly flips the image horizontally with p=0.5.",
    "RandomVerticalFlip": "Randomly flips the image vertically with p=0.5.",
    "RandomRotation": "Randomly rotates the image by an angle.",
    "ColorJitter": "Randomly perturbs brightness/contrast/saturation/hue.",
    "CenterCrop": "Crops the center region of the image.",
    "Grayscale": "Converts the image to grayscale.",
    "Pad": "Adds padding around the image.",
    "RandomResizedCrop": "Randomly crops then resizes to a fixed size.",
    "RandomAffine": "Random affine transformation of the image.",
    "GaussianBlur": "Applies a Gaussian blur to the image.",
}


# ---------------------------------------------------------------------------
# NumPy operation knowledge base (additive — independent of pandas/pytorch)
# ---------------------------------------------------------------------------

# Each entry: op_name → (category, description, input_shape, output_shape)
# category is one of: data_source, transform, aggregate, filter, merge, output
NUMPY_OPS: dict[str, tuple[str, str, Optional[str], Optional[str]]] = {
    # DATA SOURCE — array creation
    "array":        ("data_source", "Creates a NumPy array from existing data.", None, "ndarray"),
    "zeros":        ("data_source", "Creates a new array filled with zeros, useful for initializing weights or masks.", None, "ndarray"),
    "ones":         ("data_source", "Creates a new array filled with ones.", None, "ndarray"),
    "zeros_like":   ("data_source", "Creates an array of zeros with the same shape as a given array.", "ndarray", "ndarray"),
    "ones_like":    ("data_source", "Creates an array of ones with the same shape as a given array.", "ndarray", "ndarray"),
    "empty":        ("data_source", "Creates an uninitialized array of the given shape.", None, "ndarray"),
    "full":         ("data_source", "Creates an array filled with a constant value.", None, "ndarray"),
    "arange":       ("data_source", "Creates an evenly spaced sequence of numbers, like Python's range() but returns an array.", None, "ndarray"),
    "linspace":     ("data_source", "Creates evenly spaced numbers over a specified interval — useful for plotting.", None, "ndarray"),
    "rand":         ("data_source", "Generates random numbers from a uniform distribution between 0 and 1.", None, "ndarray"),
    "randn":        ("data_source", "Generates random numbers from a standard normal distribution (mean=0, std=1).", None, "ndarray"),
    "randint":      ("data_source", "Generates random integers from a discrete uniform distribution.", None, "ndarray"),
    "load":         ("data_source", "Loads arrays from a .npy or .npz file.", None, "ndarray"),
    "loadtxt":      ("data_source", "Loads data from a text file into an array.", None, "ndarray"),

    # TRANSFORM — shape changing
    "reshape":      ("transform", "Rearranges the array into a new shape without changing its data. Total elements must stay the same.", "ndarray", "ndarray (reshaped)"),
    "resize":       ("transform", "Returns a new array with the specified shape, repeating data if needed.", "ndarray", "ndarray (resized)"),
    "transpose":    ("transform", "Flips the axes of the array — rows become columns and vice versa.", "ndarray", "ndarray (transposed)"),
    "squeeze":      ("transform", "Removes axes of length 1 from the array.", "ndarray", "ndarray (squeezed)"),
    "expand_dims":  ("transform", "Inserts a new axis of length 1 at the given position.", "ndarray", "ndarray (expanded)"),
    "flatten":      ("transform", "Returns a 1D copy of the array.", "ndarray", "ndarray (1D)"),
    "ravel":        ("transform", "Returns a contiguous flattened 1D view of the array.", "ndarray", "ndarray (1D)"),

    # TRANSFORM — math / linear algebra
    "dot":          ("transform", "Computes the dot product — for 2D arrays this is matrix multiplication.", "ndarray, ndarray", "ndarray"),
    "matmul":       ("transform", "Performs matrix multiplication of two arrays.", "ndarray, ndarray", "ndarray"),
    "cross":        ("transform", "Computes the cross product of two vectors.", "ndarray, ndarray", "ndarray"),
    "outer":        ("transform", "Computes the outer product of two vectors.", "ndarray, ndarray", "ndarray (2D)"),
    "inner":        ("transform", "Computes the inner product of two arrays.", "ndarray, ndarray", "scalar/ndarray"),
    "exp":          ("transform", "Computes element-wise natural exponential e^x.", "ndarray", "ndarray"),
    "log":          ("transform", "Computes element-wise natural logarithm.", "ndarray", "ndarray"),
    "sqrt":         ("transform", "Computes element-wise square root.", "ndarray", "ndarray"),
    "abs":          ("transform", "Computes element-wise absolute value.", "ndarray", "ndarray"),
    "power":        ("transform", "Raises array elements to the given power.", "ndarray, scalar", "ndarray"),
    "linalg.norm":  ("transform", "Computes the magnitude (length) of a vector or matrix norm.", "ndarray", "scalar"),
    "linalg.inv":   ("transform", "Computes the multiplicative inverse of a square matrix.", "ndarray", "ndarray"),
    "linalg.eig":   ("transform", "Computes eigenvalues and right eigenvectors of a square array.", "ndarray", "(ndarray, ndarray)"),

    # AGGREGATE — reductions
    "sum":          ("aggregate", "Computes the sum across the array or along an axis.", "ndarray", "scalar/ndarray"),
    "mean":         ("aggregate", "Computes the average value across the array or along an axis.", "ndarray", "scalar/ndarray"),
    "std":          ("aggregate", "Computes the standard deviation — measures how spread out the values are.", "ndarray", "scalar/ndarray"),
    "var":          ("aggregate", "Computes the variance across the array or along an axis.", "ndarray", "scalar/ndarray"),
    "min":          ("aggregate", "Returns the minimum value across the array or along an axis.", "ndarray", "scalar/ndarray"),
    "max":          ("aggregate", "Returns the maximum value across the array or along an axis.", "ndarray", "scalar/ndarray"),
    "argmin":       ("aggregate", "Returns the index of the minimum value along an axis.", "ndarray", "ndarray (indices)"),
    "argmax":       ("aggregate", "Returns the index of the maximum value along an axis.", "ndarray", "ndarray (indices)"),
    "median":       ("aggregate", "Computes the median value along an axis.", "ndarray", "scalar/ndarray"),
    "percentile":   ("aggregate", "Computes the q-th percentile of the data along an axis.", "ndarray", "scalar/ndarray"),

    # FILTER — masking / selection
    "where":        ("filter", "Returns elements from one array or another based on a condition — like a vectorized if/else.", "ndarray", "ndarray"),
    "clip":         ("filter", "Constrains all values to stay within [min, max] — useful for gradient clipping.", "ndarray", "ndarray (clipped)"),
    "nonzero":      ("filter", "Returns the indices of non-zero elements.", "ndarray", "tuple[ndarray]"),
    "extract":      ("filter", "Returns elements of an array satisfying a condition.", "ndarray", "ndarray (1D)"),

    # MERGE — combining
    "concatenate":  ("merge", "Joins multiple arrays together along a specified axis.", "list[ndarray]", "ndarray"),
    "stack":        ("merge", "Joins arrays along a new axis.", "list[ndarray]", "ndarray"),
    "vstack":       ("merge", "Stacks arrays vertically (row-wise).", "list[ndarray]", "ndarray"),
    "hstack":       ("merge", "Stacks arrays horizontally (column-wise).", "list[ndarray]", "ndarray"),
    "dstack":       ("merge", "Stacks arrays along the third axis (depth).", "list[ndarray]", "ndarray"),
    "block":        ("merge", "Assembles arrays from blocks specified by a nested list.", "nested list[ndarray]", "ndarray"),
    "append":       ("merge", "Appends values to the end of an array.", "ndarray, ndarray", "ndarray"),

    # OUTPUT — saving / exporting
    "save":             ("output", "Saves an array to a binary .npy file.", "ndarray", "None"),
    "savez":            ("output", "Saves several arrays into a single .npz archive.", "ndarray(s)", "None"),
    "savetxt":          ("output", "Saves an array to a text file.", "ndarray", "None"),
    "set_printoptions": ("output", "Configures how NumPy arrays are printed.", None, "None"),
}

# Per-category emitted FlowNodeType (re-uses the existing visual system).
_NUMPY_CAT_TO_TYPE = {
    "data_source": "input",
    "output":      "output",
    "transform":   "pytorch",     # blue parallelogram via existing OP_TO_CATEGORY
    "aggregate":   "pytorch",     # purple via OP_TO_CATEGORY
    "filter":      "pandas",      # coral via OP_TO_CATEGORY
    "merge":       "pandas",      # gold via OP_TO_CATEGORY
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def detect_framework(code: str) -> str:
    has_pandas = "pandas" in code or "pd." in code or "DataFrame" in code
    has_pytorch = (
        "torch" in code or "nn." in code or "F." in code
        or "tensor" in code.lower() or "Dataset" in code or "DataLoader" in code
    )
    has_numpy = "numpy" in code or "np." in code
    if has_pandas and has_pytorch:
        base = "mixed"
    elif has_pandas:
        base = "pandas"
    elif has_pytorch:
        base = "pytorch"
    elif has_numpy:
        return "numpy"
    else:
        return "unknown"
    if has_numpy:
        return f"{base}+numpy"
    return base


def _safe_unparse(node) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return ""


def _truncate(s: str, n: int) -> str:
    if len(s) <= n:
        return s
    return s[: max(0, n - 1)] + "…"


def _kwargs_dict(call: ast.Call) -> dict:
    out = {}
    for kw in call.keywords:
        if kw.arg is None:
            continue
        out[kw.arg] = _safe_unparse(kw.value)
    return out


def _get_call_name(node: ast.Call) -> Optional[str]:
    f = node.func
    if isinstance(f, ast.Attribute):
        return f.attr
    if isinstance(f, ast.Name):
        return f.id
    return None


def _is_compose_call(node) -> bool:
    if not isinstance(node, ast.Call):
        return False
    return _get_call_name(node) == "Compose"


def _format_call_args(call: ast.Call, max_len: int = 24) -> str:
    parts = []
    for a in call.args:
        parts.append(_safe_unparse(a))
    for kw in call.keywords:
        if kw.arg is None:
            parts.append(f"**{_safe_unparse(kw.value)}")
        else:
            parts.append(f"{kw.arg}={_safe_unparse(kw.value)}")
    return _truncate(", ".join(parts), max_len)


def _attr_receiver(func) -> Optional[str]:
    """For x.foo() return 'x'; for self.X.foo() return 'self.X'."""
    if isinstance(func, ast.Attribute):
        v = func.value
        if isinstance(v, ast.Name):
            return v.id
        if isinstance(v, ast.Attribute) and isinstance(v.value, ast.Name) and v.value.id == "self":
            return f"self.{v.attr}"
    return None


# ---------------------------------------------------------------------------
# Flow builder
# ---------------------------------------------------------------------------

class FlowBuilder:
    def __init__(self):
        self.nodes: list[dict] = []
        self.edges: list[dict] = []
        self._next = 0
        self._last_id: Optional[str] = None

    def add(self, *, type: str, label: str, description: str = "",
            input_shape: Optional[str] = None, output_shape: Optional[str] = None,
            group: Optional[str] = None) -> str:
        nid = f"node_{self._next}"
        self._next += 1
        self.nodes.append({
            "id": nid,
            "type": type,
            "label": label,
            "description": description,
            "input_shape": input_shape,
            "output_shape": output_shape,
            "position_x": 0,
            "position_y": 0,
            "group": group,
        })
        if self._last_id:
            self.edges.append({
                "id": f"edge_{self._last_id}_{nid}",
                "source": self._last_id,
                "target": nid,
            })
        self._last_id = nid
        return nid


# ---------------------------------------------------------------------------
# Extractor
# ---------------------------------------------------------------------------

class FlowExtractor:
    def __init__(self):
        self.builder = FlowBuilder()
        # Variable name → class name (ImageDataset). Pre-seeded with discovered classes.
        self.var_to_class: dict[str, str] = {}
        self.user_classes: set[str] = set()

    def parse(self, code: str):
        tree = ast.parse(code)
        # First pass: collect user-defined class names so we can recognize calls
        for stmt in tree.body:
            if isinstance(stmt, ast.ClassDef):
                self.user_classes.add(stmt.name)
        # Second pass: walk statements in order
        for stmt in tree.body:
            self._stmt(stmt, group=None)
        return self.builder

    # --- statement dispatcher ---
    def _stmt(self, stmt, group: Optional[str]):
        if isinstance(stmt, ast.ClassDef):
            self._handle_classdef(stmt)
        elif isinstance(stmt, ast.Assign):
            self._handle_assign(stmt, group)
        elif isinstance(stmt, ast.AnnAssign) and stmt.value is not None:
            fake = ast.Assign(targets=[stmt.target], value=stmt.value)
            self._handle_assign(fake, group)
        elif isinstance(stmt, ast.AugAssign):
            return
        elif isinstance(stmt, ast.For):
            self._handle_for(stmt, group)
        elif isinstance(stmt, ast.If):
            for s in stmt.body:
                self._stmt(s, group)
            for s in stmt.orelse:
                self._stmt(s, group)
        elif isinstance(stmt, ast.With):
            for s in stmt.body:
                self._stmt(s, group)
        elif isinstance(stmt, ast.While):
            for s in stmt.body:
                self._stmt(s, group)
            for s in stmt.orelse:
                self._stmt(s, group)
        elif isinstance(stmt, ast.Try):
            for s in stmt.body:
                self._stmt(s, group)
            for handler in stmt.handlers:
                for s in handler.body:
                    self._stmt(s, group)
            for s in stmt.orelse:
                self._stmt(s, group)
            for s in stmt.finalbody:
                self._stmt(s, group)
        elif isinstance(stmt, ast.Return):
            self._handle_return(stmt, group)
        elif isinstance(stmt, ast.Expr):
            self._handle_expr_stmt(stmt.value, group)
        elif isinstance(stmt, ast.FunctionDef):
            # Top-level def: walk its body inline
            for s in stmt.body:
                self._stmt(s, group)
        else:
            return

    # --- classes ---
    def _handle_classdef(self, cls: ast.ClassDef):
        bases = [_safe_unparse(b) for b in cls.bases]
        base_str = ", ".join(bases) if bases else ""
        group_name = f"{cls.name} class"
        self.builder.add(
            type="intermediate",
            label=f"class {cls.name}",
            description=f"Class definition" + (f" extending {base_str}" if base_str else ""),
            output_shape=cls.name,
        )
        for m in cls.body:
            if isinstance(m, ast.FunctionDef):
                self._handle_method(m, cls.name, group_name)

    def _handle_method(self, method: ast.FunctionDef, class_name: str, group: str):
        name = method.name
        if name == "__init__":
            for s in method.body:
                self._init_stmt(s, group)
        elif name == "__len__":
            self.builder.add(
                type="output",
                label="len(dataset)",
                description="Returns the number of items in the dataset.",
                input_shape="Dataset",
                output_shape="int",
                group=group,
            )
        elif name == "__getitem__":
            for s in method.body:
                self._stmt(s, group)
        elif name == "forward":
            for s in method.body:
                self._stmt(s, group)
        else:
            self.builder.add(
                type="intermediate",
                label=f"{class_name}.{name}()",
                description=f"Method `{name}` of {class_name}",
                group=group,
            )
            for s in method.body:
                self._stmt(s, group)

    # --- __init__ self.X = ... ---
    def _init_stmt(self, stmt, group):
        if not isinstance(stmt, ast.Assign):
            self._stmt(stmt, group)
            return
        target = stmt.targets[0]
        if (
            isinstance(target, ast.Attribute)
            and isinstance(target.value, ast.Name)
            and target.value.id == "self"
        ):
            attr = target.attr
            value = stmt.value
            if _is_compose_call(value):
                self._handle_compose(value, attr, group)
                return
            if isinstance(value, ast.Call) and _get_call_name(value) == "DataLoader":
                self._handle_dataloader(value, attr, group)
                return
            value_repr = _truncate(_safe_unparse(value), 30)
            self.builder.add(
                type="input",
                label=f"self.{attr}",
                description=f"Stores `{attr}` from constructor: {value_repr}",
                output_shape=self._infer_value_kind(value),
                group=group,
            )
            return
        self._stmt(stmt, group)

    def _infer_value_kind(self, value) -> Optional[str]:
        if isinstance(value, ast.Name):
            return f"<{value.id}>"
        if isinstance(value, ast.List):
            return f"list ({len(value.elts)})"
        if isinstance(value, ast.Dict):
            return "dict"
        if isinstance(value, ast.Constant):
            return type(value.value).__name__
        if isinstance(value, ast.Call):
            return _get_call_name(value) or "value"
        return None

    # --- transforms.Compose ---
    def _handle_compose(self, call: ast.Call, attr_name: str, group):
        header_label = f"self.{attr_name}" if attr_name and not attr_name.startswith("self.") else (attr_name or "transform")
        self.builder.add(
            type="input",
            label=header_label,
            description="Composed transform pipeline (transforms.Compose).",
            output_shape="Transform pipeline",
            group=group,
        )
        if not call.args:
            return
        first = call.args[0]
        if not isinstance(first, (ast.List, ast.Tuple)):
            return
        for elt in first.elts:
            if isinstance(elt, ast.Call):
                self._emit_transform(elt, group)

    def _emit_transform(self, call: ast.Call, group):
        op = _get_call_name(call) or "?"
        args_repr = _format_call_args(call, max_len=22)
        label = f"{op}({args_repr})" if args_repr else f"{op}()"
        desc = TRANSFORM_OPS.get(op, f"Image transform: {op}")
        in_s, out_s = self._transform_shape(op, call)
        self.builder.add(
            type="pytorch",
            label=_truncate(label, 30),
            description=desc,
            input_shape=in_s,
            output_shape=out_s,
            group=group,
        )

    def _transform_shape(self, op: str, call: ast.Call):
        if op == "Resize":
            arg = _safe_unparse(call.args[0]) if call.args else ""
            return "[H,W,C]", f"{arg} resized" if arg else "resized"
        if op == "ToTensor":
            return "[H,W,C] uint8", "[C,H,W] float [0,1]"
        if op == "Normalize":
            return "[C,H,W] float", "[C,H,W] normalized"
        if op in ("CenterCrop", "RandomCrop", "RandomResizedCrop"):
            return "[H,W,C]", "cropped"
        if op == "Grayscale":
            return "[H,W,C]", "[H,W,1]"
        return None, None

    # --- DataLoader ---
    def _handle_dataloader(self, call: ast.Call, var_name: Optional[str], group):
        kw = _kwargs_dict(call)
        badges = []
        if "batch_size" in kw:
            badges.append(f"batch={kw['batch_size']}")
        if "shuffle" in kw:
            badges.append(f"shuffle={kw['shuffle']}")
        if "num_workers" in kw:
            badges.append(f"workers={kw['num_workers']}")
        ds = _safe_unparse(call.args[0]) if call.args else ""
        head = var_name or "DataLoader"
        label = f"{head} · " + " · ".join(badges) if badges else head
        self.builder.add(
            type="input",
            label=_truncate(label, 50),
            description=f"DataLoader wrapping `{ds}`. Batches and optionally shuffles the dataset.",
            input_shape=f"{ds} (Dataset)" if ds else "Dataset",
            output_shape="iterable[batch]",
            group=group,
        )

    # --- assignments ---
    def _handle_assign(self, stmt: ast.Assign, group):
        target = stmt.targets[0]
        var_name: Optional[str] = target.id if isinstance(target, ast.Name) else None
        value = stmt.value

        if isinstance(value, ast.Call):
            op = _get_call_name(value)

            # Device transfers: x.to("cuda")
            if op == "to":
                self._emit_to_node(value, var_name, group)
                return

            # DataLoader assignment
            if op == "DataLoader":
                self._handle_dataloader(value, var_name, group)
                return

            # transforms.Compose at top level
            if op == "Compose":
                self._handle_compose(value, var_name or "transform", group)
                return

            # Known torch/pandas operation — emit as a typed op node
            if op in PYTORCH_OPS or op in PANDAS_OPS:
                self._emit_known_op(value, op, group)
                return

            # User-defined class instantiation: train_ds = ImageDataset(...)
            if op and op in self.user_classes:
                args_repr = _format_call_args(value, max_len=24)
                cls_name = op
                label_var = var_name or op.lower()
                self.builder.add(
                    type="input",
                    label=_truncate(f"{label_var} ({cls_name})", 40),
                    description=f"Instantiates `{cls_name}`" + (f" with ({args_repr})" if args_repr else ""),
                    output_shape=cls_name,
                    group=group,
                )
                if var_name:
                    self.var_to_class[var_name] = cls_name
                return

            # Fallback: method/function call we don't specifically know
            self._emit_call_node(value, group)
            return
        # Non-Call assignments are skipped in the graph
        return

    def _emit_to_node(self, call: ast.Call, var_name: Optional[str], group):
        receiver = _attr_receiver(call.func)
        device_arg = _safe_unparse(call.args[0]) if call.args else ""
        clean_dev = device_arg.strip("\"'").upper() or "GPU"
        if "CUDA" in clean_dev:
            clean_dev = "GPU (CUDA)"
        target_name = var_name or receiver or "tensor"
        self.builder.add(
            type="pytorch",
            label=_truncate(f"{target_name} → {clean_dev}", 36),
            description=f"Moves `{receiver or target_name}` to {clean_dev} device.",
            input_shape="Tensor (CPU)",
            output_shape=f"Tensor ({clean_dev})",
            group=group,
        )

    def _emit_known_op(self, call: ast.Call, op: str, group):
        if op in PANDAS_OPS:
            desc, in_s, out_s = PANDAS_OPS[op]
            ntype = "pandas"
        else:
            desc, in_s, out_s = PYTORCH_OPS[op]
            ntype = "input" if op in TORCH_CREATION_OPS else "pytorch"
        self.builder.add(
            type=ntype,
            label=f"{op}()",
            description=desc,
            input_shape=in_s,
            output_shape=out_s,
            group=group,
        )

    def _emit_call_node(self, call: ast.Call, group):
        op = _get_call_name(call) or "call"
        receiver = _attr_receiver(call.func)
        args_repr = _format_call_args(call, max_len=20)

        if receiver and receiver != "self":
            label_full = f"{receiver}.{op}({args_repr})" if args_repr else f"{receiver}.{op}()"
        else:
            label_full = f"{op}({args_repr})" if args_repr else f"{op}()"

        ntype = "intermediate"
        desc = f"Calls `{op}`"
        in_s = out_s = None

        # Heuristic specials common in PyTorch dataset code
        if op in ("_load_image", "load_image"):
            ntype = "pytorch"
            desc = "Loads an image from disk into memory."
            out_s = "Image [H,W,C]"
        elif op == "transform" and receiver == "self":
            ntype = "pytorch"
            desc = "Applies the transform pipeline to the input."
            in_s, out_s = "Image", "Tensor [C,H,W]"
            label_full = "self.transform(image)"

        self.builder.add(
            type=ntype,
            label=_truncate(label_full, 32),
            description=desc,
            input_shape=in_s,
            output_shape=out_s,
            group=group,
        )

    # --- expression statements (e.g., optimizer.step(), loss.backward()) ---
    def _handle_expr_stmt(self, expr, group):
        if not isinstance(expr, ast.Call):
            return
        op = _get_call_name(expr)
        if op == "to":
            self._emit_to_node(expr, None, group)
            return
        if op in PYTORCH_OPS or op in PANDAS_OPS:
            self._emit_known_op(expr, op, group)
            return
        if op:
            self._emit_call_node(expr, group)

    # --- for loops ---
    def _handle_for(self, stmt: ast.For, group):
        target_str = _safe_unparse(stmt.target)
        iter_str = _safe_unparse(stmt.iter)
        loop_label = f"for {target_str} in {iter_str}"
        self.builder.add(
            type="intermediate",
            label=_truncate(loop_label, 40),
            description=f"Loops over `{iter_str}`, processing each `{target_str}`.",
            output_shape="iter",
            group=group,
        )
        inner_group = f"loop: {target_str}"
        for s in stmt.body:
            self._stmt(s, inner_group)
        # Don't forget the for/else clause (runs after loop completes normally)
        for s in stmt.orelse:
            self._stmt(s, group)

    # --- return ---
    def _handle_return(self, stmt: ast.Return, group):
        if stmt.value is None:
            return
        repr_str = _truncate(_safe_unparse(stmt.value), 30)
        self.builder.add(
            type="output",
            label=f"return {repr_str}",
            description="Returns the result from the function.",
            output_shape="returned value",
            group=group,
        )


# ---------------------------------------------------------------------------
# Layout
# ---------------------------------------------------------------------------

def _layout(nodes: list[dict]):
    """Simple top-to-bottom layout. Top-level nodes at x=60, grouped at x=380."""
    x_top = 60
    x_grouped = 380
    y_gap = 110
    y = 60
    for n in nodes:
        n["position_y"] = y
        n["position_x"] = x_grouped if n.get("group") else x_top
        y += y_gap


# ---------------------------------------------------------------------------
# NumPy parser (additive — runs alongside existing pandas/pytorch parsing)
# ---------------------------------------------------------------------------

_NUMPY_ROOT_NAMES = {"np", "numpy"}


def is_numpy_code(tree: ast.AST) -> bool:
    """Detects whether the AST contains NumPy usage.

    Looks for `import numpy` (with or without alias), `from numpy import ...`,
    or any attribute access whose root value is a Name `np` or `numpy`.
    """
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "numpy" or alias.name.startswith("numpy."):
                    return True
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            if mod == "numpy" or mod.startswith("numpy."):
                return True
        elif isinstance(node, ast.Attribute):
            v = node.value
            if isinstance(v, ast.Name) and v.id in _NUMPY_ROOT_NAMES:
                return True
            if isinstance(v, ast.Attribute):
                root = v.value
                while isinstance(root, ast.Attribute):
                    root = root.value
                if isinstance(root, ast.Name) and root.id in _NUMPY_ROOT_NAMES:
                    return True
    return False


def _np_chain_op(func: ast.AST) -> Optional[str]:
    """For an Attribute func whose root is `np`/`numpy`, return the op name.

    Returns the simple op name (e.g. "reshape" for np.reshape, "rand" for
    np.random.rand). For namespaced ops we also return a dotted variant
    (e.g. "linalg.norm") so callers can prefer the more specific entry.
    """
    if not isinstance(func, ast.Attribute):
        return None
    parts: list[str] = [func.attr]
    cur: ast.AST = func.value
    while isinstance(cur, ast.Attribute):
        parts.append(cur.attr)
        cur = cur.value
    if not (isinstance(cur, ast.Name) and cur.id in _NUMPY_ROOT_NAMES):
        return None
    parts.reverse()  # e.g. ["linalg", "norm"] or ["random", "rand"]
    if len(parts) >= 2:
        dotted = ".".join(parts)
        if dotted in NUMPY_OPS:
            return dotted
    return parts[-1]


def _np_shape_annotation(op: str, call: ast.Call) -> Optional[str]:
    """Extracts a simple, literal-only shape annotation for known numpy ops.

    Returns None when nothing can be inferred without evaluating variables.
    """
    def lit_tuple(node: ast.AST) -> Optional[str]:
        # Accept ast.Tuple or ast.List of constants
        if isinstance(node, (ast.Tuple, ast.List)):
            elts = []
            for e in node.elts:
                if isinstance(e, ast.Constant):
                    elts.append(repr(e.value) if isinstance(e.value, str) else str(e.value))
                else:
                    return None
            return "(" + ", ".join(elts) + ")"
        return None

    if op in {"reshape", "resize"}:
        # np.reshape(arr, (x, y)) OR np.reshape(arr, x, y)
        if len(call.args) >= 2:
            shape = lit_tuple(call.args[1])
            if shape:
                return f"→ shape {shape}"
            # Multi-positional integers form: np.reshape(arr, x, y)
            rest = call.args[1:]
            if all(isinstance(a, ast.Constant) and isinstance(a.value, int) for a in rest):
                vals = ", ".join(str(a.value) for a in rest)
                return f"→ shape ({vals})"
        return "shape: dynamic"

    if op in {"zeros", "ones", "empty", "full", "zeros_like", "ones_like"}:
        if call.args:
            shape = lit_tuple(call.args[0])
            if shape:
                return f"shape: {shape}"
            if isinstance(call.args[0], ast.Constant) and isinstance(call.args[0].value, int):
                return f"shape: ({call.args[0].value},)"
        return "shape: dynamic"

    if op in {"concatenate", "stack", "vstack", "hstack", "dstack"}:
        # axis kwarg or positional
        axis_val: Optional[str] = None
        for kw in call.keywords:
            if kw.arg == "axis" and isinstance(kw.value, ast.Constant):
                axis_val = str(kw.value.value)
        if axis_val is None and len(call.args) >= 2 and isinstance(call.args[1], ast.Constant):
            axis_val = str(call.args[1].value)
        if axis_val is not None:
            tag = {"0": "rows", "1": "cols"}.get(axis_val, f"axis {axis_val}")
            return f"axis={axis_val} ({tag})"
        return None

    if op == "transpose":
        return "axes reversed"

    return None


def parse_numpy_nodes(tree: ast.AST, source_lines: list[str]) -> list[dict]:
    """Detects NumPy operations and returns FlowNode-shaped dicts.

    Called separately, never replaces existing parsers. Walks the entire
    AST and emits one node per recognized numpy call (including nested
    calls, e.g. `np.clip(np.std(...))` produces both nodes). Boolean
    indexing patterns like `arr[arr > 0]` are emitted as FILTER nodes.
    """
    nodes: list[dict] = []
    seen_calls: set[int] = set()

    def emit(op: str, call: Optional[ast.Call], *, override_label: Optional[str] = None,
             override_desc: Optional[str] = None) -> None:
        meta = NUMPY_OPS.get(op)
        if meta is None:
            return
        category, desc, in_s, out_s = meta
        ntype = _NUMPY_CAT_TO_TYPE.get(category, "intermediate")
        if call is not None:
            args_repr = _format_call_args(call, max_len=24)
            label = f"np.{op}({args_repr})" if args_repr else f"np.{op}()"
        else:
            label = f"np.{op}"
        label = override_label or _truncate(label, 36)
        annotation = _np_shape_annotation(op, call) if call is not None else None
        if annotation:
            shown_out = f"{out_s} · {annotation}" if out_s else annotation
        else:
            shown_out = out_s
        nodes.append({
            "id": f"numpy_{len(nodes)}",
            "type": ntype,
            "label": label,
            "description": override_desc or desc,
            "input_shape": in_s,
            "output_shape": shown_out,
            "position_x": 0,
            "position_y": 0,
            "group": None,
            "_lineno": getattr(call, "lineno", 0) if call is not None else 0,
            "_col": getattr(call, "col_offset", 0) if call is not None else 0,
        })

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if id(node) in seen_calls:
                continue
            op = _np_chain_op(node.func)
            if op and op in NUMPY_OPS:
                seen_calls.add(id(node))
                emit(op, node)
        elif isinstance(node, ast.Subscript):
            # Boolean indexing: arr[arr > 0] / arr[mask] where mask is a comparison
            slc = node.slice
            inner = slc.value if isinstance(slc, ast.Index) else slc  # py<3.9 compat
            if isinstance(inner, (ast.Compare, ast.BoolOp, ast.UnaryOp)):
                arr_repr = _truncate(_safe_unparse(node.value), 20) or "arr"
                cond_repr = _truncate(_safe_unparse(inner), 24)
                desc = "Boolean indexing — selects elements where the condition is True."
                nodes.append({
                    "id": f"numpy_{len(nodes)}",
                    "type": "pandas",  # FILTER bucket via existing OP_TO_CATEGORY
                    "label": _truncate(f"{arr_repr}[{cond_repr}]", 36),
                    "description": desc,
                    "input_shape": "ndarray",
                    "output_shape": "ndarray (filtered)",
                    "position_x": 0,
                    "position_y": 0,
                    "group": None,
                    "_lineno": getattr(node, "lineno", 0),
                    "_col": getattr(node, "col_offset", 0),
                })

    # Sort by source position so the appended block reads top-to-bottom.
    nodes.sort(key=lambda n: (n.pop("_lineno", 0), n.pop("_col", 0)))
    # Re-id sequentially to keep ids stable.
    for i, n in enumerate(nodes):
        n["id"] = f"numpy_{i}"
    return nodes


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_python_code(code: str) -> dict:
    """Parse Python source code and return a flow graph (flat + hierarchical)."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ParseError(
            "Python syntax error — check your code for typos or missing brackets.",
            detail=str(e),
        )

    framework = detect_framework(code)

    # Flat (legacy) view — full file as a single linear graph
    flat_extractor = FlowExtractor()
    flat_extractor.parse(code)
    flat_nodes = flat_extractor.builder.nodes
    flat_edges = flat_extractor.builder.edges

    # Additive: append numpy nodes if numpy is detected.
    # This runs ALONGSIDE existing parsing — the pandas/pytorch logic above
    # is untouched, and we never delete nodes it produced. We only append
    # the new numpy-categorized nodes after the existing list and add a
    # single connecting edge so they form a continuous flow.
    if is_numpy_code(tree):
        source_lines = code.splitlines()
        np_nodes = parse_numpy_nodes(tree, source_lines)
        if np_nodes:
            if flat_nodes:
                # Connect last existing node to the first numpy node.
                last_id = flat_nodes[-1]["id"]
                flat_edges.append({
                    "id": f"edge_{last_id}_{np_nodes[0]['id']}",
                    "source": last_id,
                    "target": np_nodes[0]["id"],
                })
            # Sequential edges among the appended numpy nodes.
            for a, b in zip(np_nodes, np_nodes[1:]):
                flat_edges.append({
                    "id": f"edge_{a['id']}_{b['id']}",
                    "source": a["id"],
                    "target": b["id"],
                })
            flat_nodes.extend(np_nodes)

    _layout(flat_nodes)

    # Hierarchical view — Level 1 blocks
    blocks = _build_blocks(tree)

    if not flat_nodes and not blocks:
        raise ParseError(
            "No recognizable transformation steps found.",
            detail="Try pasting Pandas or PyTorch code with operations like read_csv, dropna, nn.Linear, ReLU, etc.",
        )

    return {
        "nodes": flat_nodes,
        "edges": flat_edges,
        "framework": framework,
        "level": 1,
        "blocks": blocks,
    }


# ---------------------------------------------------------------------------
# Hierarchical block builder (Level 1 / Level 2)
# ---------------------------------------------------------------------------

LOSS_FN_NAMES = {
    "CrossEntropyLoss", "MSELoss", "BCELoss", "NLLLoss", "L1Loss",
    "BCEWithLogitsLoss", "SmoothL1Loss",
}
OPTIMIZER_NAMES = {"Adam", "AdamW", "SGD", "RMSprop", "Adagrad", "Adadelta"}
DATASET_BASES = {"Dataset", "IterableDataset"}
MODEL_BASES = {"Module", "nn.Module"}


def _names_in(node) -> set[str]:
    """All bare Name and attribute leaf identifiers used inside a subtree."""
    found = set()
    for n in ast.walk(node):
        if isinstance(n, ast.Name):
            found.add(n.id)
        elif isinstance(n, ast.Attribute):
            found.add(n.attr)
    return found


def _calls_in(node) -> list[ast.Call]:
    return [n for n in ast.walk(node) if isinstance(n, ast.Call)]


def _classify_class(cls: ast.ClassDef) -> tuple[str, str]:
    """Return (category, color). category is one of: data, model, generic."""
    base_strs = {_safe_unparse(b).split(".")[-1] for b in cls.bases}
    if base_strs & DATASET_BASES:
        return "data", "green"
    if base_strs & {"Module"} or any(
        _safe_unparse(b) in MODEL_BASES for b in cls.bases
    ):
        return "model", "blue"
    return "generic", "blue"


def _classify_function(func: ast.FunctionDef) -> tuple[str, str]:
    names = _names_in(func)
    if names & (LOSS_FN_NAMES | OPTIMIZER_NAMES) or {"backward", "step", "zero_grad"} & names:
        return "training", "red"
    return "generic", "purple"


def _summarize_class(cls: ast.ClassDef) -> str:
    methods = [m for m in cls.body if isinstance(m, ast.FunctionDef)]
    method_count = len(methods)
    # Count nn.* assignments in __init__
    layer_count = 0
    for m in methods:
        if m.name == "__init__":
            for n in ast.walk(m):
                if isinstance(n, ast.Assign) and isinstance(n.value, ast.Call):
                    name = _safe_unparse(n.value.func)
                    if name.startswith("nn.") or name.split(".")[-1] in PYTORCH_OPS:
                        layer_count += 1
    if layer_count:
        return f"{method_count} methods · {layer_count} layers"
    return f"{method_count} method{'s' if method_count != 1 else ''}"


def _summarize_function(func: ast.FunctionDef) -> str:
    parts: list[str] = []
    # Loop ranges
    for n in ast.walk(func):
        if isinstance(n, ast.For):
            it = n.iter
            if isinstance(it, ast.Call) and _get_call_name(it) == "range":
                if it.args:
                    rng = _safe_unparse(it.args[0])
                    parts.append(f"{rng} epochs")
                    break
    # Optimizer
    for n in ast.walk(func):
        if isinstance(n, ast.Call):
            name = _get_call_name(n)
            if name in OPTIMIZER_NAMES:
                parts.append(f"{name} optimizer")
                break
    # Loss
    for n in ast.walk(func):
        if isinstance(n, ast.Call):
            name = _get_call_name(n)
            if name in LOSS_FN_NAMES:
                parts.append(name)
                break
    if parts:
        return " · ".join(parts)
    # Fallback: count significant statements
    n_stmts = sum(
        1 for s in func.body if not isinstance(s, (ast.Pass, ast.Expr))
    ) or len(func.body)
    return f"{n_stmts} statement{'s' if n_stmts != 1 else ''}"


def _summarize_main(stmts: list) -> str:
    parts: list[str] = []
    for n in stmts:
        for sub in ast.walk(n):
            if isinstance(sub, ast.Call):
                name = _get_call_name(sub)
                if name in OPTIMIZER_NAMES and "optimizer" not in " ".join(parts):
                    parts.append(f"{name} optimizer")
                elif name in LOSS_FN_NAMES and name not in parts:
                    parts.append(name)
    if not parts:
        n_calls = sum(len(_calls_in(s)) for s in stmts)
        return f"{n_calls} operation{'s' if n_calls != 1 else ''}"
    return " · ".join(parts[:3])


def _extract_method_nodes(method: ast.FunctionDef, user_class_names: set) -> tuple[list, list]:
    extractor = FlowExtractor()
    extractor.user_classes = set(user_class_names)
    if method.name == "__init__":
        for s in method.body:
            extractor._init_stmt(s, group=None)
    else:
        for s in method.body:
            extractor._stmt(s, group=None)
    nodes = extractor.builder.nodes
    edges = extractor.builder.edges
    _layout(nodes)
    return nodes, edges


def _extract_stmts_nodes(stmts: list, user_class_names: set) -> tuple[list, list]:
    extractor = FlowExtractor()
    extractor.user_classes = set(user_class_names)
    for s in stmts:
        extractor._stmt(s, group=None)
    nodes = extractor.builder.nodes
    edges = extractor.builder.edges
    _layout(nodes)
    return nodes, edges


def _build_blocks(tree: ast.Module) -> list[dict]:
    user_class_names = {s.name for s in tree.body if isinstance(s, ast.ClassDef)}
    user_func_names = {s.name for s in tree.body if isinstance(s, ast.FunctionDef)}
    user_block_ids = user_class_names | user_func_names

    blocks: list[dict] = []
    block_ast: dict[str, list] = {}  # block id -> list of AST nodes to scan for calls
    main_stmts: list = []

    for stmt in tree.body:
        if isinstance(stmt, ast.ClassDef):
            blocks.append(_build_class_block(stmt, user_class_names))
            # Scan all method bodies for outgoing calls
            block_ast[stmt.name] = [
                n for m in stmt.body if isinstance(m, ast.FunctionDef) for n in m.body
            ]
        elif isinstance(stmt, ast.FunctionDef):
            blocks.append(_build_function_block(stmt, user_class_names))
            block_ast[stmt.name] = list(stmt.body)
        elif isinstance(stmt, (ast.Import, ast.ImportFrom)):
            continue
        else:
            main_stmts.append(stmt)

    if main_stmts:
        blocks.append(_build_main_block(main_stmts, user_class_names, user_block_ids))
        block_ast["__main__"] = main_stmts

    # Connections: AST-based detection
    for b in blocks:
        b["connections"] = _detect_connections(
            b, block_ast.get(b["id"], []), user_class_names, user_func_names
        )

    # Layout: left-to-right by category
    _layout_blocks(blocks)

    return blocks


def _build_class_block(cls: ast.ClassDef, user_class_names: set) -> dict:
    category, color = _classify_class(cls)
    bases = [_safe_unparse(b) for b in cls.bases]
    methods = [m for m in cls.body if isinstance(m, ast.FunctionDef)]
    attrs: list[str] = []
    for m in methods:
        if m.name == "__init__":
            for s in m.body:
                if (
                    isinstance(s, ast.Assign)
                    and len(s.targets) == 1
                    and isinstance(s.targets[0], ast.Attribute)
                    and isinstance(s.targets[0].value, ast.Name)
                    and s.targets[0].value.id == "self"
                ):
                    attrs.append(s.targets[0].attr)

    children: list[dict] = []
    op_total = 0
    for m in methods:
        nodes, edges = _extract_method_nodes(m, user_class_names)
        op_total += len(nodes)
        children.append({
            "id": f"{cls.name}.{m.name}",
            "type": "method",
            "name": m.name,
            "op_count": len(nodes),
            "nodes": nodes,
            "edges": edges,
        })

    return {
        "id": cls.name,
        "type": "class",
        "name": cls.name,
        "summary": _summarize_class(cls),
        "color": color,
        "category": category,
        "bases": bases,
        "attributes": attrs,
        "op_count": op_total,
        "children": children,
        "connections": [],
    }


def _build_function_block(func: ast.FunctionDef, user_class_names: set) -> dict:
    category, color = _classify_function(func)
    nodes, edges = _extract_method_nodes(func, user_class_names)
    return {
        "id": func.name,
        "type": "function",
        "name": func.name,
        "summary": _summarize_function(func),
        "color": color,
        "category": category,
        "bases": [],
        "attributes": [],
        "op_count": len(nodes),
        "children": [{
            "id": f"{func.name}.body",
            "type": "function_body",
            "name": "body",
            "op_count": len(nodes),
            "nodes": nodes,
            "edges": edges,
        }],
        "connections": [],
    }


def _build_main_block(stmts: list, user_class_names: set, user_block_ids: set) -> dict:
    nodes, edges = _extract_stmts_nodes(stmts, user_class_names)
    # Choose color/category based on what main does
    names = set()
    for s in stmts:
        names |= _names_in(s)
    if names & (LOSS_FN_NAMES | OPTIMIZER_NAMES) or {"backward", "step"} & names:
        category, color = "training", "red"
    else:
        category, color = "main", "purple"
    return {
        "id": "__main__",
        "type": "module",
        "name": "main",
        "summary": _summarize_main(stmts),
        "color": color,
        "category": category,
        "bases": [],
        "attributes": [],
        "op_count": len(nodes),
        "children": [{
            "id": "__main__.body",
            "type": "function_body",
            "name": "body",
            "op_count": len(nodes),
            "nodes": nodes,
            "edges": edges,
        }],
        "connections": [],
    }


def _detect_connections(
    block: dict,
    body_nodes: list,
    user_class_names: set,
    user_func_names: set,
) -> list[dict]:
    """Find edges from this block to other blocks via AST analysis.

    Detects:
    - inherits: class bases that resolve to user-defined classes
    - calls: direct calls to user functions, instantiations of user classes,
             and calls on variables tracked back to a user class instance
    """
    out: list[dict] = []
    seen: set[tuple] = set()
    self_id = block["id"]
    user_blocks = user_class_names | user_func_names

    # Inheritance
    if block["type"] == "class":
        for base in block.get("bases", []):
            base_short = base.split(".")[-1]
            if base_short in user_class_names and base_short != self_id:
                key = (base_short, "inherits")
                if key not in seen:
                    out.append({"to": base_short, "type": "inherits", "label": "extends"})
                    seen.add(key)

    # Track variable -> user-class assignments so `model = ConvNet(); model(x)`
    # resolves the latter call to ConvNet.
    var_to_class: dict[str, str] = {}

    def record_assign_target(target: ast.AST, value: ast.AST) -> None:
        # Resolve the user class produced by `value`, if any.
        cls = _resolves_to_user_class(value, user_class_names)
        if not cls:
            return
        if isinstance(target, ast.Name):
            var_to_class[target.id] = cls
        elif (
            isinstance(target, ast.Attribute)
            and isinstance(target.value, ast.Name)
            and target.value.id == "self"
        ):
            var_to_class[f"self.{target.attr}"] = cls

    def emit_call(target_id: str) -> None:
        if target_id == self_id or target_id not in user_blocks:
            return
        key = (target_id, "calls")
        if key in seen:
            return
        out.append({"to": target_id, "type": "calls", "label": "calls"})
        seen.add(key)

    def visit(node: ast.AST) -> None:
        # Record assignments first so subsequent statements can resolve calls.
        if isinstance(node, ast.Assign):
            for t in node.targets:
                record_assign_target(t, node.value)
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            record_assign_target(node.target, node.value)

        if isinstance(node, ast.Call):
            func = node.func
            # Direct: foo(...) where foo is a user function or class
            if isinstance(func, ast.Name):
                if func.id in user_blocks:
                    emit_call(func.id)
            # Variable call: model(x) where model: ConvNet
            elif isinstance(func, ast.Attribute):
                # self.attr(...) or var.method(...)
                if isinstance(func.value, ast.Name) and func.value.id in var_to_class:
                    emit_call(var_to_class[func.value.id])
                elif (
                    isinstance(func.value, ast.Attribute)
                    and isinstance(func.value.value, ast.Name)
                    and func.value.value.id == "self"
                ):
                    key = f"self.{func.value.attr}"
                    if key in var_to_class:
                        emit_call(var_to_class[key])
            # Calling a tracked variable directly: model(x)
            # (ast.Call with func=Name handled above when name is a user block)
            # Handle the case where func is a Name pointing to a tracked instance.
            if isinstance(func, ast.Name) and func.id in var_to_class:
                emit_call(var_to_class[func.id])

        for child in ast.iter_child_nodes(node):
            visit(child)

    for stmt in body_nodes:
        visit(stmt)

    return out


def _resolves_to_user_class(value: ast.AST, user_class_names: set) -> str | None:
    """If `value` is `UserClass(...)` (possibly chained), return the class name."""
    if isinstance(value, ast.Call):
        f = value.func
        if isinstance(f, ast.Name) and f.id in user_class_names:
            return f.id
        if isinstance(f, ast.Attribute) and f.attr in user_class_names:
            return f.attr
    return None


def _layout_blocks(blocks: list[dict]) -> None:
    """Left-to-right flow: data → model → training/main."""
    order = {"data": 0, "model": 1, "generic": 1, "training": 2, "main": 2}
    cols: dict[int, list[dict]] = {}
    for b in blocks:
        col = order.get(b.get("category", "generic"), 1)
        cols.setdefault(col, []).append(b)

    col_w = 320
    row_h = 200
    x_pad = 80
    y_pad = 60
    for col_idx in sorted(cols.keys()):
        for row_idx, b in enumerate(cols[col_idx]):
            b["position_x"] = x_pad + col_idx * col_w
            b["position_y"] = y_pad + row_idx * row_h
