import csv
from collections import Counter

rows = list(csv.DictReader(open("exercise_labels_audit.csv", encoding="utf-8")))
print("total exercises:", len(rows))

print("\n── movement patterns ──")
for k, v in Counter(r["movement_pattern"] for r in rows).most_common():
    print(f"  {k:<18} {v}")

print("\n── target muscles ──")
for k, v in Counter(r["target_muscles"] for r in rows).most_common():
    print(f"  {k:<24} {v}")

print("\n── difficulty ──")
for k, v in sorted(Counter(r["difficulty"] for r in rows).items()):
    print(f"  {k}: {v}")

sus = []
for r in rows:
    n, p = r["name"].lower(), r["movement_pattern"]
    if "leg press" in n and p != "squat": sus.append((r["id"], n, p))
    if "squat" in n and p != "squat": sus.append((r["id"], n, p))
    if "lunge" in n and p != "lunge": sus.append((r["id"], n, p))
    if "deadlift" in n and p != "hinge": sus.append((r["id"], n, p))
    if "bench press" in n and p != "push_horizontal": sus.append((r["id"], n, p))
print("\n── suspicious name-vs-pattern:", len(sus), "──")
for s in sus[:40]:
    print("  ", s)