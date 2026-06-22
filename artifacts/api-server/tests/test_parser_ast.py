"""Unit tests for parser_ast.parse_python_code."""

import textwrap

import pytest

from parser_ast import ParseError, parse_python_code


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _labels(result: dict) -> list[str]:
    """Extract node labels from a parse result."""
    return [n["label"] for n in result["nodes"]]


def _block_names(result: dict) -> list[str]:
    """Extract top-level block names from the hierarchical view."""
    return [b["name"] for b in result.get("blocks", [])]


# ---------------------------------------------------------------------------
# 1. PyTorch nn.Module subclass
# ---------------------------------------------------------------------------

PYTORCH_MODULE_CODE = textwrap.dedent("""\
    import torch
    import torch.nn as nn

    class SimpleNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(784, 128)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(128, 10)

        def forward(self, x):
            x = self.fc1(x)
            x = self.relu(x)
            x = self.fc2(x)
            return x
""")


class TestPyTorchModule:
    def test_returns_nodes_and_edges(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        assert isinstance(result, dict)
        assert "nodes" in result
        assert "edges" in result
        assert "blocks" in result
        assert len(result["nodes"]) > 0

    def test_contains_expected_layers(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        labels = _labels(result)
        label_text = " ".join(labels)
        assert "self.fc1" in label_text
        assert "self.relu" in label_text or "ReLU" in label_text
        assert "self.fc2" in label_text

    def test_blocks_contain_class(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        block_names = _block_names(result)
        assert "SimpleNet" in block_names

    def test_framework_detected(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        assert "pytorch" in result["framework"]


# ---------------------------------------------------------------------------
# 2. Pandas pipeline
# ---------------------------------------------------------------------------

PANDAS_PIPELINE_CODE = textwrap.dedent("""\
    import pandas as pd

    df = pd.read_csv("data.csv")
    df = df.dropna()
    result = df.groupby("category").agg({"value": "sum"})
""")


class TestPandasPipeline:
    def test_produces_nodes(self):
        result = parse_python_code(PANDAS_PIPELINE_CODE)
        assert len(result["nodes"]) > 0

    def test_contains_expected_operations(self):
        result = parse_python_code(PANDAS_PIPELINE_CODE)
        labels = _labels(result)
        label_text = " ".join(labels)
        assert "read_csv" in label_text
        assert "dropna" in label_text
        assert "groupby" in label_text or "agg" in label_text

    def test_framework_is_pandas(self):
        result = parse_python_code(PANDAS_PIPELINE_CODE)
        assert "pandas" in result["framework"]


# ---------------------------------------------------------------------------
# 3. NumPy snippet
# ---------------------------------------------------------------------------

NUMPY_CODE = textwrap.dedent("""\
    import numpy as np

    arr = np.array([1, 2, 3])
    reshaped = np.reshape(arr, (1, 3))
    avg = np.mean(reshaped)
""")


class TestNumPy:
    def test_produces_nodes(self):
        result = parse_python_code(NUMPY_CODE)
        assert len(result["nodes"]) > 0

    def test_contains_numpy_ops(self):
        result = parse_python_code(NUMPY_CODE)
        labels = _labels(result)
        label_text = " ".join(labels)
        assert "np.array" in label_text
        assert "np.reshape" in label_text
        assert "np.mean" in label_text

    def test_framework_is_numpy(self):
        result = parse_python_code(NUMPY_CODE)
        assert "numpy" in result["framework"]


# ---------------------------------------------------------------------------
# 4. transforms.Compose pipeline
# ---------------------------------------------------------------------------

COMPOSE_CODE = textwrap.dedent("""\
    import torchvision.transforms as transforms

    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485], std=[0.229]),
    ])
""")


class TestTransformsCompose:
    def test_produces_nodes(self):
        result = parse_python_code(COMPOSE_CODE)
        assert len(result["nodes"]) > 0

    def test_contains_transform_steps(self):
        result = parse_python_code(COMPOSE_CODE)
        labels = _labels(result)
        label_text = " ".join(labels)
        assert "Resize" in label_text
        assert "CenterCrop" in label_text
        assert "ToTensor" in label_text
        assert "Normalize" in label_text


# ---------------------------------------------------------------------------
# 5. Invalid Python (syntax error)
# ---------------------------------------------------------------------------

class TestSyntaxError:
    def test_raises_parse_error(self):
        with pytest.raises(ParseError) as exc_info:
            parse_python_code("def broken(:\n    pass")
        assert exc_info.value.detail is not None

    def test_parse_error_has_message(self):
        with pytest.raises(ParseError, match="syntax"):
            parse_python_code("class Foo(:\n    pass")


# ---------------------------------------------------------------------------
# 6. Empty / whitespace-only input
# ---------------------------------------------------------------------------

class TestEmptyInput:
    def test_empty_string_raises_parse_error(self):
        with pytest.raises(ParseError):
            parse_python_code("")

    def test_whitespace_only_raises_parse_error(self):
        with pytest.raises(ParseError):
            parse_python_code("   \n   \n   ")


# ---------------------------------------------------------------------------
# 7. Additional edge cases
# ---------------------------------------------------------------------------

class TestReturnShape:
    def test_result_has_required_keys(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        assert "nodes" in result
        assert "edges" in result
        assert "framework" in result
        assert "level" in result
        assert "blocks" in result

    def test_nodes_have_expected_fields(self):
        result = parse_python_code(PYTORCH_MODULE_CODE)
        node = result["nodes"][0]
        assert "id" in node
        assert "type" in node
        assert "label" in node
        assert "description" in node

    def test_edges_have_source_and_target(self):
        result = parse_python_code(PANDAS_PIPELINE_CODE)
        assert len(result["edges"]) > 0
        edge = result["edges"][0]
        assert "source" in edge
        assert "target" in edge
