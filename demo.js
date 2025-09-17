const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set up webcam
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  await new Promise(resolve => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// MoveNet keypoint labels (17 points)
const keypointNames = [
  "nose", "left_eye", "right_eye", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_hip", "right_hip",
  "left_knee", "right_knee", "left_ankle", "right_ankle"
];

// Define skeleton connections (full body + face)
const connections = [
  // Face
  [0, 1], [0, 2], [1, 3], [2, 4],
  // Torso
  [5, 6], [5, 11], [6, 12], [11, 12],
  // Arms
  [5, 7], [7, 9], [6, 8], [8, 10],
  // Legs
  [11, 13], [13, 15], [12, 14], [14, 16]
];

// Draw skeleton + labels over video
function drawSkeleton(keypoints) {
  // Draw video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Draw keypoints
  keypoints.forEach((kp, i) => {
    if (kp.score > 0.5) {
      // Dot
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();

      // Label with black outline for visibility
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.strokeText(keypointNames[i], kp.x + 8, kp.y);

      ctx.fillStyle = "white";
      ctx.fillText(keypointNames[i], kp.x + 8, kp.y);
    }
  });

  // Draw skeleton lines
  connections.forEach(([a, b]) => {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (kpA.score > 0.5 && kpB.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(kpA.x, kpA.y);
      ctx.lineTo(kpB.x, kpB.y);
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Run pose detection
async function run() {
  await setupCamera();

  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  async function detect() {
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
      drawSkeleton(poses[0].keypoints);
    }
    requestAnimationFrame(detect);
  }

  detect();
}

run();
