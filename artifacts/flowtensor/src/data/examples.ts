export type ExampleCategory = 'pandas' | 'pytorch' | 'numpy';
export type Complexity = 'beginner' | 'intermediate' | 'advanced';
export type ExampleGroup = 'PyTorch' | 'Pandas / Data Prep' | 'NumPy';

export interface Example {
  id: string;
  title: string;
  group: ExampleGroup;
  category: ExampleCategory;
  steps: number;
  complexity?: Complexity;
  whyComplex?: string;
  featured?: boolean;
  code: string;
}

export const EXAMPLES: Example[] = [
  // ── PyTorch ───────────────────────────────────────────────
  {
    id: 'training-loop',
    title: 'Training Loop',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 9,
    complexity: 'intermediate',
    featured: true,
    code: `import torch
import torch.nn as nn

# Simple feedforward model
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(128, 256)
        self.bn1 = nn.BatchNorm1d(256)
        self.relu = nn.ReLU()
        self.drop = nn.Dropout(0.3)
        self.fc2 = nn.Linear(256, 64)
        self.fc_out = nn.Linear(64, 10)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.drop(x)
        x = self.fc2(x)
        x = self.relu(x)
        return self.softmax(self.fc_out(x))

model = MLP()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

# Training loop
model.train()
losses = []
for epoch in range(20):
    optimizer.zero_grad()
    X = torch.randn(64, 128)
    y = torch.randint(0, 10, (64,))
    logits = model(X)
    loss = criterion(logits, y)
    loss.backward()
    optimizer.step()
    losses.append(loss.item())
`,
  },
  {
    id: 'cnn-forward',
    title: 'CNN Forward Pass',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 11,
    complexity: 'intermediate',
    code: `import torch
import torch.nn as nn

class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # Block 1
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2)

        # Block 2
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2)

        # Block 3
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3)
        self.bn3 = nn.BatchNorm2d(128)

        # Classifier
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(128 * 6 * 6, 512)
        self.drop = nn.Dropout(0.5)
        self.fc2 = nn.Linear(512, num_classes)
        self.relu = nn.ReLU()
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.pool1(x)
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.pool2(x)
        x = self.relu(self.bn3(self.conv3(x)))
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.drop(x)
        return self.softmax(self.fc2(x))

model = ConvNet()
x = torch.randn(8, 3, 32, 32)
out = model(x)
`,
  },
  {
    id: 'custom-dataset',
    title: 'Custom Dataset & DataLoader',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 6,
    complexity: 'beginner',
    code: `import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms

class ImageDataset(Dataset):
    def __init__(self, image_paths, labels):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        image = self._load_image(self.image_paths[idx])
        image = self.transform(image)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return image, label

# Create dataset and loaders
train_ds = ImageDataset(train_paths, train_labels)
val_ds = ImageDataset(val_paths, val_labels)

train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=4)
val_loader = DataLoader(val_ds, batch_size=64, shuffle=False, num_workers=4)

# Iterate
for images, labels in train_loader:
    images = images.to("cuda")
    labels = labels.to("cuda")
`,
  },
  {
    id: 'transfer-learning',
    title: 'Transfer Learning (ResNet)',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 8,
    complexity: 'advanced',
    whyComplex: 'Easy to accidentally train frozen layers — you must filter parameters carefully when passing them to the optimizer.',
    code: `import torch
import torch.nn as nn
import torchvision.models as models

# Load pretrained ResNet-18
backbone = models.resnet18(pretrained=True)

# Freeze all layers
for param in backbone.parameters():
    param.requires_grad = False

# Replace the final FC layer for our task
num_features = backbone.fc.in_features
backbone.fc = nn.Linear(num_features, 5)

# Only optimize the unfrozen head
optimizer = torch.optim.Adam(
    filter(lambda p: p.requires_grad, backbone.parameters()),
    lr=1e-3,
)
criterion = nn.CrossEntropyLoss()
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

# Fine-tuning loop
backbone.train()
for epoch in range(10):
    optimizer.zero_grad()
    X = torch.randn(16, 3, 224, 224)
    y = torch.randint(0, 5, (16,))
    logits = backbone(X)
    loss = criterion(logits, y)
    loss.backward()
    optimizer.step()
    scheduler.step()
`,
  },
  {
    id: 'autoencoder',
    title: 'Autoencoder',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 10,
    complexity: 'advanced',
    whyComplex: 'The bottleneck dimension controls information loss, and the decoder must exactly mirror the encoder\'s shape sequence in reverse.',
    code: `import torch
import torch.nn as nn

class Encoder(nn.Module):
    def __init__(self, input_dim=784, latent_dim=32):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 512)
        self.bn1 = nn.BatchNorm1d(512)
        self.fc2 = nn.Linear(512, 128)
        self.fc_latent = nn.Linear(128, latent_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.bn1(self.fc1(x)))
        x = self.relu(self.fc2(x))
        return self.fc_latent(x)

class Decoder(nn.Module):
    def __init__(self, latent_dim=32, output_dim=784):
        super().__init__()
        self.fc1 = nn.Linear(latent_dim, 128)
        self.fc2 = nn.Linear(128, 512)
        self.fc_out = nn.Linear(512, output_dim)
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, z):
        z = self.relu(self.fc1(z))
        z = self.relu(self.fc2(z))
        return self.sigmoid(self.fc_out(z))

encoder = Encoder()
decoder = Decoder()
optimizer = torch.optim.Adam(
    list(encoder.parameters()) + list(decoder.parameters()), lr=1e-3
)
criterion = nn.MSELoss()

# Reconstruction training
for epoch in range(15):
    x = torch.randn(64, 784)
    z = encoder(x)
    x_hat = decoder(z)
    loss = criterion(x_hat, x)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
`,
  },
  {
    id: 'attention',
    title: 'Attention Mechanism',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 9,
    complexity: 'advanced',
    whyComplex: 'Q, K, and V tensors transform independently before combining, making the data flow hard to follow mentally.',
    code: `import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class ScaledDotProductAttention(nn.Module):
    def __init__(self, d_model=512, num_heads=8):
        super().__init__()
        self.d_k = d_model // num_heads
        self.num_heads = num_heads

        # Independent linear projections for Q, K, V
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_out = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(0.1)
        self.softmax = nn.Softmax(dim=-1)

    def forward(self, query, key, value):
        B, L, D = query.shape

        # Project and reshape to [B, heads, L, d_k]
        Q = self.W_q(query).view(B, L, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(B, L, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(B, L, self.num_heads, self.d_k).transpose(1, 2)

        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        weights = self.softmax(scores)
        weights = self.dropout(weights)

        # Weighted sum and project back
        context = torch.matmul(weights, V)
        context = context.transpose(1, 2).contiguous().view(B, L, D)
        return self.W_out(context)

attn = ScaledDotProductAttention()
x = torch.randn(4, 32, 512)
out = attn(x, x, x)
`,
  },
  {
    id: 'lr-scheduler',
    title: 'Learning Rate Scheduler',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 8,
    complexity: 'intermediate',
    code: `import torch
import torch.nn as nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(64, 128)
        self.relu = nn.ReLU()
        self.drop = nn.Dropout(0.2)
        self.fc2 = nn.Linear(128, 32)
        self.fc_out = nn.Linear(32, 2)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.drop(x)
        x = self.relu(self.fc2(x))
        return self.fc_out(x)

model = Net()
optimizer = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)

# Cosine annealing decays LR smoothly to near zero over T_max epochs
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)
criterion = nn.CrossEntropyLoss()

loss_curve = []
for epoch in range(30):
    X = torch.randn(32, 64)
    y = torch.randint(0, 2, (32,))
    logits = model(X)
    loss = criterion(logits, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    scheduler.step()
    loss_curve.append(loss.item())
`,
  },
  {
    id: 'checkpoint',
    title: 'Model Checkpoint Save/Load',
    group: 'PyTorch',
    category: 'pytorch',
    steps: 6,
    complexity: 'beginner',
    code: `import torch
import torch.nn as nn

class Classifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(256, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        return self.softmax(self.fc2(x))

# Train the model (abbreviated)
model = Classifier()
optimizer = torch.optim.Adam(model.parameters())
criterion = nn.CrossEntropyLoss()

# Save checkpoint
torch.save({
    "epoch": 10,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
}, "checkpoint.pth")

# Load and run inference
checkpoint = torch.load("checkpoint.pth")
model_loaded = Classifier()
model_loaded.load_state_dict(checkpoint["model_state_dict"])
model_loaded.eval()

sample = torch.randn(1, 256)
with torch.no_grad():
    prediction = model_loaded(sample)
    predicted_class = prediction.argmax(dim=1)
`,
  },

  // ── Pandas / Data Prep ────────────────────────────────────
  {
    id: 'titanic-cleanup',
    title: 'Titanic Cleanup',
    group: 'Pandas / Data Prep',
    category: 'pandas',
    steps: 7,
    code: `import pandas as pd

# Load the Titanic dataset
df = pd.read_csv("titanic.csv")

# Drop rows missing critical fields
df = df.dropna(subset=["Age", "Embarked"])

# Fill remaining nulls with sensible defaults
df = df.fillna({"Cabin": "Unknown", "Fare": df["Fare"].median()})

# Remove columns that won't help the model
df = df.drop(columns=["Ticket", "Name", "PassengerId"])

# Rename for clarity
df = df.rename(columns={"Pclass": "passenger_class", "SibSp": "siblings"})

# Cast types
df = df.astype({"passenger_class": str})

# Clean index
df = df.reset_index(drop=True)
`,
  },
  {
    id: 'feature-engineering',
    title: 'Feature Engineering',
    group: 'Pandas / Data Prep',
    category: 'pandas',
    steps: 10,
    code: `import pandas as pd
from sklearn.model_selection import train_test_split

# Load two tables and join them
users = pd.read_csv("users.csv")
orders = pd.read_csv("orders.csv")

users = users.dropna(subset=["email"])
orders = orders.dropna(subset=["user_id", "total"])

# Merge on user_id
df = users.merge(orders, on="user_id", how="left")
df = df.fillna({"total": 0, "discount": 0})

# Compute derived features
df["net_spend"] = df.apply(lambda r: r["total"] - r["discount"], axis=1)
df["is_high_value"] = df["net_spend"].apply(lambda x: 1 if x > 500 else 0)

# Aggregate per-user lifetime stats
stats = df.groupby("user_id").agg(
    total_orders=("total", "count"),
    lifetime_value=("net_spend", "sum"),
)
stats = stats.reset_index()
df = df.merge(stats, on="user_id")

# Encode categorical columns
df = pd.get_dummies(df, columns=["country", "plan_tier"])
df = df.sort_values("lifetime_value", ascending=False)
df = df.reset_index(drop=True)
`,
  },
  {
    id: 'sales-aggregation',
    title: 'Sales Aggregation',
    group: 'Pandas / Data Prep',
    category: 'pandas',
    steps: 8,
    code: `import pandas as pd

# Load raw sales data
df = pd.read_csv("sales.csv")
df = df.dropna()

# Aggregate revenue and unit counts by region + month
monthly = df.groupby(["region", "month"]).agg(
    {"revenue": "sum", "units": "mean", "returns": "count"}
)
monthly = monthly.reset_index()

# Rank by revenue descending
monthly = monthly.sort_values("revenue", ascending=False)

# Rename aggregated columns
monthly = monthly.rename(columns={
    "revenue": "total_revenue",
    "units": "avg_units",
    "returns": "return_count",
})

# Keep the top 20 region-month pairs
top = monthly.head(20)
top = top.reset_index(drop=True)
`,
  },
  {
    id: 'timeseries',
    title: 'Time Series Resampling',
    group: 'Pandas / Data Prep',
    category: 'pandas',
    steps: 9,
    code: `import pandas as pd

# Load sensor readings with timestamps
df = pd.read_csv("sensor_data.csv", parse_dates=["timestamp"])
df = df.dropna(subset=["timestamp", "value"])

# Set datetime index for time-based operations
df = df.set_index("timestamp")
df = df.sort_values("value")

# Resample to weekly averages
weekly = df.resample("W").agg({"value": "mean", "quality": "sum"})

# Fill gaps using linear interpolation
weekly = weekly.interpolate(method="linear")

# Compute rolling 4-week mean to smooth noise
weekly["rolling_avg"] = weekly["value"].rolling(window=4, min_periods=1).mean()

# Detect anomalies: points more than 2 std devs from rolling mean
weekly["zscore"] = (weekly["value"] - weekly["rolling_avg"]) / weekly["value"].std()
weekly["is_anomaly"] = weekly["zscore"].abs().apply(lambda x: x > 2.0)

# Final cleanup
weekly = weekly.reset_index()
weekly = weekly.rename(columns={"timestamp": "week_start"})
`,
  },

  // ── NumPy ─────────────────────────────────────────────────
  {
    id: 'numpy-preprocessing',
    title: 'Array Preprocessing',
    group: 'NumPy',
    category: 'numpy',
    steps: 9,
    complexity: 'beginner',
    code: `import numpy as np

# Generate raw features and labels
X = np.random.randn(1000, 20)
y = np.random.randint(0, 2, size=(1000,))

# Standardize columns (z-score)
X_mean = np.mean(X, axis=0)
X_std = np.std(X, axis=0)
X_norm = (X - X_mean) / np.clip(X_std, 1e-8, None)

# Reshape for downstream model
X_reshaped = np.reshape(X_norm, (1000, 4, 5))

# 80/20 split
split = int(0.8 * len(X_reshaped))
X_train = X_reshaped[:split]
X_test = X_reshaped[split:]

# One-hot encode labels
y_onehot = np.zeros((len(y), 2))
y_onehot[np.arange(len(y)), y] = 1

# Persist arrays to disk
np.save("X_train.npy", X_train)
np.save("y_onehot.npy", y_onehot)
`,
  },
  {
    id: 'numpy-image-pipeline',
    title: 'Image Array Pipeline',
    group: 'NumPy',
    category: 'numpy',
    steps: 8,
    complexity: 'intermediate',
    whyComplex: 'Axis-aware ops and broadcasting can silently produce wrong shapes — visualizing each step helps catch off-by-one channel/axis bugs.',
    code: `import numpy as np

# Load a batch of grayscale images as raw float arrays
images = np.load("images.npy")        # shape (N, 64, 64)
labels = np.load("labels.npy")

# Filter out blank frames (any pixel non-zero)
mask = np.any(images > 0, axis=(1, 2))
images = images[mask]
labels = labels[mask]

# Add a channel axis and stack RGB by repeating
images = np.expand_dims(images, axis=-1)
images = np.concatenate([images, images, images], axis=-1)

# Normalize to [0, 1]
images = images.astype(np.float32) / 255.0
images = np.clip(images, 0.0, 1.0)

# Random horizontal flip on half the batch
flip_idx = np.random.choice(len(images), size=len(images) // 2, replace=False)
images[flip_idx] = images[flip_idx, :, ::-1, :]

# Save the prepared batch
np.savez("batch.npz", images=images, labels=labels)
`,
  },
  {
    id: 'numpy-linalg',
    title: 'Linear Algebra & PCA',
    group: 'NumPy',
    category: 'numpy',
    steps: 9,
    complexity: 'advanced',
    whyComplex: 'PCA chains matrix ops (centering → covariance → eigendecomposition → projection); a single transposed axis derails the result.',
    code: `import numpy as np

# Sample feature matrix
X = np.random.randn(500, 10)

# Center features
X_mean = np.mean(X, axis=0)
X_centered = X - X_mean

# Covariance matrix
cov = np.matmul(X_centered.T, X_centered) / (len(X_centered) - 1)

# Eigendecomposition for principal components
eigvals, eigvecs = np.linalg.eig(cov)

# Sort components by descending eigenvalue
order = np.argsort(eigvals)[::-1]
top_k = eigvecs[:, order[:3]]

# Project data onto top components
X_pca = np.matmul(X_centered, top_k)

# Reconstruct approximation and measure error
X_recon = np.matmul(X_pca, top_k.T) + X_mean
error = np.linalg.norm(X - X_recon)

np.save("pca_components.npy", top_k)
`,
  },
];

export const EXAMPLES_BY_GROUP = {
  PyTorch: EXAMPLES.filter((e) => e.group === 'PyTorch'),
  'Pandas / Data Prep': EXAMPLES.filter((e) => e.group === 'Pandas / Data Prep'),
  NumPy: EXAMPLES.filter((e) => e.group === 'NumPy'),
};

export const CATEGORY_COLORS: Record<ExampleCategory, string> = {
  pandas: '#3b82f6',
  pytorch: '#f97316',
  numpy: '#f59e0b',
};

export const CATEGORY_LABELS: Record<ExampleCategory, string> = {
  pandas: 'Pandas',
  pytorch: 'PyTorch',
  numpy: 'NumPy',
};

export const COMPLEXITY_CONFIG: Record<
  Complexity,
  { label: string; color: string; bg: string }
> = {
  beginner: { label: 'Beginner', color: '#22c55e', bg: '#22c55e1a' },
  intermediate: { label: 'Intermediate', color: '#eab308', bg: '#eab3081a' },
  advanced: { label: 'Advanced', color: '#ef4444', bg: '#ef44441a' },
};
