// src/App.jsx
import React, { useRef, useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import GlassesPicker from "./components/GlassesPicker";
import { detectLandmarks } from "./utils/detectLandmarks";
import { classifyFaceShape } from "./utils/classifyFaceShape";
import { getSuggestionsForShape, loadCatalog } from "./utils/glassesCatalog";
import { layout, text, button as btn, card } from "./utils/styles";

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [landmarks, setLandmarks] = useState(null);
  const [faceShape, setFaceShape] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedGlasses, setSelectedGlasses] = useState(null);
  const [showOnlyAISuggestions, setShowOnlyAISuggestions] = useState(false);

  const canvasRef = useRef();
  const imgRef = useRef();
  const overlayImgRef = useRef(new Image());

  useEffect(() => {
    // preload default
    overlayImgRef.current.src = "/black-glasses.webp";
  }, []);

  const refreshSuggestionsForShape = (shape) => {
    const baseList = Array.isArray(catalog) ? catalog : [];
    const sugg = showOnlyAISuggestions && shape
      ? baseList.filter((g) => g.recommendedFor?.includes(shape))
      : getSuggestionsForShape(shape, baseList);
    setSuggestions(sugg);
    const keep = sugg.find((g) => g.id === selectedGlasses?.id);
    const nextSelected = keep || sugg[0] || null;
    if (nextSelected && nextSelected.id !== selectedGlasses?.id) {
      setSelectedGlasses(nextSelected);
      overlayImgRef.current.onload = draw;
      overlayImgRef.current.src = nextSelected.src;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (!landmarks || !selectedGlasses) return;

    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const leftX = leftEye.x * canvas.width;
    const leftY = leftEye.y * canvas.height;
    const rightX = rightEye.x * canvas.width;
    const rightY = rightEye.y * canvas.height;

    const dx = rightX - leftX;
    const dy = rightY - leftY;
    const eyeDistance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Scale: empirically map eye distance to overlay width
    const baseWidth = eyeDistance * 2.0; // reduced from 2.5 to 2.0
    const maxWidth = canvas.width * 0.55; // cap to 55% of canvas width
    const glassesWidth = Math.min(baseWidth, maxWidth);
    const aspect = overlayImgRef.current.naturalWidth && overlayImgRef.current.naturalHeight
      ? overlayImgRef.current.naturalWidth / overlayImgRef.current.naturalHeight
      : 3; // fallback
    const glassesHeight = glassesWidth / aspect;

    const centerX = (leftX + rightX) / 2;
    const centerY = (leftY + rightY) / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(
      overlayImgRef.current,
      -glassesWidth / 2,
      -glassesHeight / 2,
      glassesWidth,
      glassesHeight
    );
    ctx.restore();
  };

  const handleImageLoad = async () => {
    const img = imgRef.current;
    try {
      const detected = await detectLandmarks(img);
      setLandmarks(detected);

      const canvas = canvasRef.current;
      const width = canvas?.width || img.width;
      const height = canvas?.height || img.height;
      const { shape, scores } = classifyFaceShape(detected, width, height);
      setFaceShape(shape);
      console.log("Face shape scores", { shape, scores });

      refreshSuggestionsForShape(shape);
    } catch (e) {
      console.error(e);
      alert("Face not detected. Try another image.");
    } finally {
      draw();
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmarks, selectedGlasses]);

  useEffect(() => {
    // Load catalog from DB on mount
    (async () => {
      const items = await loadCatalog();
      setCatalog(items);
      // initial list without a face shape
      const sugg = getSuggestionsForShape(null, items);
      setSuggestions(sugg);
      if (sugg[0]) {
        setSelectedGlasses(sugg[0]);
        overlayImgRef.current.src = sugg[0].src;
      }
    })();
  }, []);

  useEffect(() => {
    // refresh list when catalog, faceShape, or toggle changes
    refreshSuggestionsForShape(faceShape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, faceShape, showOnlyAISuggestions]);

  useEffect(() => {
    const onStorage = async (e) => {
      if (e.key === 'catalog:dirty') {
        const items = await loadCatalog();
        setCatalog(items);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSelect = (g) => {
    setSelectedGlasses(g);
    overlayImgRef.current.onload = draw;
    overlayImgRef.current.src = g.src;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Virtual Glasses Store</h1>
          <p className="text-sm text-gray-600">Upload a front-facing photo. We’ll suggest frames based on your face shape.</p>
        </div>
        <div>
          <button
            disabled={!faceShape}
            onClick={() => setShowOnlyAISuggestions((v) => !v)}
            title={faceShape ? '' : 'Upload a face to enable AI suggestions'}
            className={`btn ${showOnlyAISuggestions ? 'btn-primary' : 'btn-outline'}`}
          >
            {showOnlyAISuggestions ? 'Show All' : 'Suggestions by AI'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Upload your photo</h2>
            <ImageUploader onImageSelected={setImageSrc} />
          </div>

          {imageSrc && (
            <div className="card mt-4">
              <img
                src={imageSrc}
                alt="user"
                ref={imgRef}
                onLoad={handleImageLoad}
                className="hidden"
              />
              <canvas ref={canvasRef} className="canvas-card" />
              <div className="mt-3">
                <div className="text-sm">Detected shape: <strong>{faceShape || "-"}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Browse frames</h2>
            <GlassesPicker
              suggestions={suggestions}
              selectedId={selectedGlasses?.id}
              onSelect={handleSelect}
              faceShape={faceShape}
              onOverrideShape={(shape) => {
                refreshSuggestionsForShape(shape || faceShape);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
