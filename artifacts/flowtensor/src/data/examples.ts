export interface Example {
  id: string;
  title: string;
  category: 'pandas' | 'pytorch' | 'numpy';
  steps: number;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 'titanic-cleanup',
    title: 'Pandas: Titanic Cleanup',
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
    id: 'sales-aggregation',
    title: 'Pandas: Sales Aggregation',
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
    id: 'linear-classifier',
    title: 'PyTorch: Linear Classifier',
    category: 'pytorch',
    steps: 9,
    code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class LinearClassifier(nn.Module):
    def __init__(self, input_dim=784, num_classes=10):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 512)
        self.bn1 = nn.BatchNorm1d(512)
        self.drop1 = nn.Dropout(0.4)
        self.fc2 = nn.Linear(512, 256)
        self.bn2 = nn.BatchNorm1d(256)
        self.drop2 = nn.Dropout(0.3)
        self.fc3 = nn.Linear(256, 128)
        self.fc_out = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.drop1(x)
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.drop2(x)
        x = self.fc3(x)
        x = F.relu(x)
        return self.fc_out(x)

model = LinearClassifier()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
`,
  },
  {
    id: 'cnn-forward',
    title: 'PyTorch: CNN Forward Pass',
    category: 'pytorch',
    steps: 11,
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

        # Classifier head
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
`,
  },
  {
    id: 'image-preprocessing',
    title: 'PyTorch: Image Preprocessing',
    category: 'pytorch',
    steps: 8,
    code: `import torch
import torch.nn.functional as F

# Load a batch of raw images as tensors [B, H, W, C]
images = torch.randn(32, 256, 256, 3)

# Move channel dim to PyTorch convention [B, C, H, W]
images = images.permute(0, 3, 1, 2)

# Normalize to zero mean, unit variance
mean = images.mean(dim=(0, 2, 3), keepdim=True)
std = images.std(dim=(0, 2, 3), keepdim=True)
images = (images - mean) / (std + 1e-8)

# Resize to model input size via interpolation
images = F.interpolate(images, size=(224, 224), mode="bilinear")

# Clamp pixel values to a safe range
images = torch.clamp(images, min=-3.0, max=3.0)

# Flatten spatial dims for a ViT patch embedding
patches = images.reshape(32, 3, -1)
patches = patches.transpose(1, 2)

# L2-normalize each patch vector
patches = F.normalize(patches, dim=-1)
`,
  },
  {
    id: 'feature-engineering',
    title: 'Pandas: Feature Engineering',
    category: 'pandas',
    steps: 10,
    code: `import pandas as pd

# Load two tables and join them
users = pd.read_csv("users.csv")
orders = pd.read_csv("orders.csv")

users = users.dropna(subset=["email", "signup_date"])
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
    avg_order=("net_spend", "mean"),
)
stats = stats.reset_index()

# Encode categorical columns
df = df.merge(stats, on="user_id")
df = pd.get_dummies(df, columns=["country", "plan_tier"])
df = df.sort_values("lifetime_value", ascending=False)
df = df.reset_index(drop=True)
`,
  },
];

export const CATEGORY_COLORS: Record<Example['category'], string> = {
  pandas: '#3b82f6',
  pytorch: '#f97316',
  numpy: '#a855f7',
};

export const CATEGORY_LABELS: Record<Example['category'], string> = {
  pandas: 'Pandas',
  pytorch: 'PyTorch',
  numpy: 'NumPy',
};
