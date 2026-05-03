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
# Helpers
# ---------------------------------------------------------------------------

def detect_framework(code: str) -> str:
    has_pandas = "pandas" in code or "pd." in code or "DataFrame" in code
    has_pytorch = (
        "torch" in code or "nn." in code or "F." in code
        or "tensor" in code.lower() or "Dataset" in code or "DataLoader" in code
    )
    if has_pandas and has_pytorch:
        return "mixed"
    if has_pandas:
        return "pandas"
    if has_pytorch:
        return "pytorch"
    return "unknown"


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
# Public API
# ---------------------------------------------------------------------------

def parse_python_code(code: str) -> dict:
    """Parse Python source code and return a flow graph."""
    try:
        ast.parse(code)
    except SyntaxError as e:
        raise ParseError(
            "Python syntax error — check your code for typos or missing brackets.",
            detail=str(e),
        )

    framework = detect_framework(code)
    extractor = FlowExtractor()
    extractor.parse(code)
    nodes = extractor.builder.nodes
    edges = extractor.builder.edges

    if not nodes:
        raise ParseError(
            "No recognizable transformation steps found.",
            detail="Try pasting Pandas or PyTorch code with operations like read_csv, dropna, nn.Linear, ReLU, etc.",
        )

    _layout(nodes)
    return {
        "nodes": nodes,
        "edges": edges,
        "framework": framework,
    }
