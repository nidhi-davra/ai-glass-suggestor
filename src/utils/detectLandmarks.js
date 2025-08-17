// src/utils/detectLandmarks.js
import { FaceMesh } from "@mediapipe/face_mesh";

export const detectLandmarks = async (imgElement) => {
  return new Promise((resolve, reject) => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      staticImageMode: true,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks.length > 0) {
        resolve(results.multiFaceLandmarks[0]);
      } else {
        reject("No face detected.");
      }
    });

    faceMesh.initialize().then(() => {
      faceMesh.send({ image: imgElement });
    });
  });
};
