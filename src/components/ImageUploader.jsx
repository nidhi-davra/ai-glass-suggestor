// src/components/ImageUploader.jsx
import React, { useRef } from "react";

export default function ImageUploader({ onImageSelected }) {
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageSelected(url);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} />
    </div>
  );
}
