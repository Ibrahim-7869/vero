import io
from dataclasses import dataclass

import numpy as np
from PIL import Image

import mediapipe as mp

NOSE = 0
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

@dataclass
class GeometricAnalysis:
    shoulder_to_hip_ratio: float
    shoulder_tilt: float
    symmetry_score: float
    somatotype_estimate: str
    posture_notes: str
    
def _dist(a,b) -> float:
    return float(((a.x - b.x) ** 2 + (a.y - b.y) **2) ** 0.5)

def _estimate_somatotype(ratio: float) -> str:
    if ratio >= 1.5:
        return "mesomorph"
    elif ratio >= 1.2:
        return "ecto-mesomorph"
    else:
        return "ectomorph"
    
def analyze_geometric(image_bytes:bytes) -> GeometricAnalysis:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(img)
    
    with mp.solution.pose.Pose(static_image_mode=True, model_complexity=1) as pose:
        results = pose.process(img_np)
        
    if not results.pose_landmarks:
        raise ValueError("No person/pose detected in image.")
    
    lm = results.pose_landmarks.landmark
    
     # V-taper: shoulder width vs hip width
    shoulder_width = _dist(lm[LEFT_SHOULDER], lm[RIGHT_SHOULDER])
    hip_width = _dist(lm[LEFT_HIP], lm[RIGHT_HIP]) or 1e-6
    shoulder_to_hip_ratio = round(shoulder_width / hip_width, 3)

    # Posture: vertical asymmetry of the shoulders
    shoulder_tilt = round(abs(lm[LEFT_SHOULDER].y - lm[RIGHT_SHOULDER].y), 3)
    
    # Symmetry: left vs right arm & leg length balance
    left_arm = _dist(lm[LEFT_SHOULDER], lm[LEFT_WRIST])
    right_arm = _dist(lm[RIGHT_SHOULDER], lm[RIGHT_WRIST])
    left_leg = _dist(lm[LEFT_HIP], lm[LEFT_ANKLE])
    right_leg = _dist(lm[RIGHT_HIP], lm[RIGHT_ANKLE])
    arm_diff = abs(left_arm - right_arm) / max(left_arm, right_arm, 1e-6)
    leg_diff = abs(left_leg - right_leg) / max(left_leg, right_leg, 1e-6)
    symmetry_score = round(max(0.0, 1.0 - (arm_diff + leg_diff) / 2), 3)
    
    notes = []
    if shoulder_tilt > 0.05:
        notes.append("uneven shoulders (possible tilt)")
    if symmetry_score < 0.9:
        notes.append("left/right limb asymmetry")
    posture_notes = "; ".join(notes) or "no major postural asymmetry detected"
    
    return GeometricAnalysis(
        shoulder_to_hip_ratio=shoulder_to_hip_ratio,
        shoulder_tilt=shoulder_tilt,
        symmetry_score=symmetry_score,
        somatotype_estimate=_estimate_somatotype(shoulder_to_hip_ratio),
        posture_notes=posture_notes,
    )
    