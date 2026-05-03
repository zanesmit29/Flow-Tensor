import { FlowNodeType } from "@workspace/api-client-react";

export type ShapeCategory =
  | "data-source"
  | "filter"
  | "transform"
  | "aggregate"
  | "merge"
  | "output"
  | "pytorch-layer"
  | "activation"
  | "loss-optimizer";

export interface ShapeMeta {
  category: ShapeCategory;
  color: string;
  label: string;
}

const CATEGORY_META: Record<ShapeCategory, { color: string; label: string }> = {
  "data-source":    { color: "#22c55e", label: "Data Source" },
  filter:           { color: "#f87171", label: "Filter / Reduce" },
  transform:        { color: "#60a5fa", label: "Transform" },
  aggregate:        { color: "#a78bfa", label: "Aggregate" },
  merge:            { color: "#fbbf24", label: "Merge / Join" },
  output:           { color: "#fb923c", label: "Output / Sink" },
  "pytorch-layer":  { color: "#3b82f6", label: "PyTorch Layer" },
  activation:       { color: "#8b5cf6", label: "Activation" },
  "loss-optimizer": { color: "#ef4444", label: "Loss / Optimizer" },
};

const OP_TO_CATEGORY: Record<string, ShapeCategory> = {
  // Data source
  read_csv: "data-source", read_json: "data-source", read_excel: "data-source", read_parquet: "data-source",
  DataLoader: "data-source", Dataset: "data-source",
  zeros: "data-source", ones: "data-source", randn: "data-source", rand: "data-source",
  tensor: "data-source", from_numpy: "data-source", arange: "data-source", linspace: "data-source", eye: "data-source",

  // Filter / Reduce
  dropna: "filter", query: "filter", filter: "filter", loc: "filter", iloc: "filter",
  head: "filter", tail: "filter", sample: "filter", drop: "filter", drop_duplicates: "filter",
  isnull: "filter", notnull: "filter", duplicated: "filter",

  // Transform
  astype: "transform", apply: "transform", map: "transform", rename: "transform", assign: "transform",
  fillna: "transform", clip: "transform", abs: "transform", sort_values: "transform",
  reset_index: "transform", set_index: "transform", melt: "transform", shift: "transform", diff: "transform",
  view: "transform", reshape: "transform", transpose: "transform", permute: "transform",
  squeeze: "transform", unsqueeze: "transform", flatten: "transform", normalize: "transform",
  pad: "transform", interpolate: "transform", clamp: "transform", exp: "transform", log: "transform",
  sqrt: "transform", pow: "transform", masked_fill: "transform", where: "transform",
  scatter: "transform", gather: "transform", chunk: "transform", split: "transform",
  one_hot: "transform", grid_sample: "transform", einsum: "transform",

  // Aggregate
  groupby: "aggregate", agg: "aggregate", sum: "aggregate", mean: "aggregate", count: "aggregate",
  pivot_table: "aggregate", value_counts: "aggregate", nunique: "aggregate", describe: "aggregate",
  corr: "aggregate", rolling: "aggregate", cumsum: "aggregate", max: "aggregate", min: "aggregate",
  norm: "aggregate", topk: "aggregate", argmax: "aggregate", argmin: "aggregate", resample: "aggregate",
  matmul: "aggregate", mm: "aggregate", bmm: "aggregate",

  // Merge / Join
  merge: "merge", concat: "merge", join: "merge", append: "merge", cat: "merge", stack: "merge",

  // Output / Sink
  to_csv: "output", to_json: "output", to_excel: "output", to_parquet: "output", print: "output",

  // PyTorch Layer
  Linear: "pytorch-layer", Conv2d: "pytorch-layer", Conv1d: "pytorch-layer",
  ConvTranspose2d: "pytorch-layer", BatchNorm1d: "pytorch-layer", BatchNorm2d: "pytorch-layer",
  LayerNorm: "pytorch-layer", Dropout: "pytorch-layer", Dropout2d: "pytorch-layer",
  MaxPool2d: "pytorch-layer", AvgPool2d: "pytorch-layer", AdaptiveAvgPool2d: "pytorch-layer",
  Flatten: "pytorch-layer", Embedding: "pytorch-layer", LSTM: "pytorch-layer", GRU: "pytorch-layer",
  RNN: "pytorch-layer", MultiheadAttention: "pytorch-layer",
  TransformerEncoderLayer: "pytorch-layer", TransformerDecoderLayer: "pytorch-layer",
  Sequential: "pytorch-layer", ModuleList: "pytorch-layer",

  // Activation
  ReLU: "activation", LeakyReLU: "activation", Sigmoid: "activation", Tanh: "activation",
  Softmax: "activation", LogSoftmax: "activation", GELU: "activation", SiLU: "activation",
  relu: "activation", sigmoid: "activation", tanh: "activation", softmax: "activation",
  dropout: "activation",

  // Loss / Optimizer
  CrossEntropyLoss: "loss-optimizer", MSELoss: "loss-optimizer", BCELoss: "loss-optimizer",
  NLLLoss: "loss-optimizer", L1Loss: "loss-optimizer",
  cross_entropy: "loss-optimizer", mse_loss: "loss-optimizer", binary_cross_entropy: "loss-optimizer",
  step: "loss-optimizer", zero_grad: "loss-optimizer", backward: "loss-optimizer",
  Adam: "loss-optimizer", SGD: "loss-optimizer", RMSprop: "loss-optimizer", AdamW: "loss-optimizer",
};

export function stripParens(label: string): string {
  return label.replace(/\(\)$/, "");
}

export function getShapeMeta(label: string, type: FlowNodeType): ShapeMeta {
  const op = stripParens(label);
  let category = OP_TO_CATEGORY[op];

  if (!category) {
    if (type === "input") category = "data-source";
    else if (type === "output") category = "output";
    else if (type === "pytorch") category = "pytorch-layer";
    else category = "transform";
  }

  return { category, ...CATEGORY_META[category] };
}

export const ALL_CATEGORIES: ShapeCategory[] = [
  "data-source", "filter", "transform", "aggregate", "merge",
  "output", "pytorch-layer", "activation", "loss-optimizer",
];

export function getCategoryMeta(cat: ShapeCategory): ShapeMeta {
  return { category: cat, ...CATEGORY_META[cat] };
}
