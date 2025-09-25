"use client";

import { use, useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);
  const tools = ["paint", "erase"];
  const [tool, setTool] = useState("paint");
  const [size, setSize] = useState(5);
  const [color, setColor] = useState("#000000");
  const [active, setActive] = useState(false);
  const deactivate = () => setActive(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation =
      tool === "paint" ? "source-over" : "destination-out";
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
  }, [tool, size, color]);

  // download png, upload png, select from png URL

  return (
    <div style={{ padding: 10 }} onMouseUp={deactivate}>
      <button
        style={{ margin: 10, padding: 5 }}
        onClick={() => setTool(tools[(tools.indexOf(tool) + 1) % tools.length])}
      >
        {tool}
      </button>
      <input
        type="number"
        style={{ width: 50 }}
        value={size}
        min={1}
        onChange={(e) => setSize(Number(e.target.value || 1))}
      />
      <input
        type="color"
        style={{ margin: 10 }}
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <button
        style={{ margin: 10, padding: 5 }}
        onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }}
      >
        Clear
      </button>
      <button
        style={{ margin: 10, padding: 5 }}
        onClick={() =>
          canvasRef.current.toBlob((blob) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "swarm.png";
            a.click();
          })
        }
      >
        Download
      </button>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.src = URL.createObjectURL(e.target.files[0]);
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }}
      />
      <br />
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ margin: 10, border: "1px solid", cursor: "crosshair" }}
        onMouseDown={(e) => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.beginPath();
          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          setActive(true);
        }}
        onMouseMove={(e) => {
          if (!active) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          ctx.stroke();
        }}
        onMouseUp={deactivate}
      />
      <br />
      <button style={{ margin: 10, padding: 5 }}>Set Start</button>
      <button style={{ margin: 10, padding: 5 }}>Set End</button>
      <button style={{ margin: 10, padding: 5 }}>Start</button>
    </div>
  );
}

// import { useRef, useState, useEffect } from "react";

// export default function DrawingCanvas() {
//   const canvasRef = useRef(null);
//   const [isDrawing, setIsDrawing] = useState(false);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     ctx.lineWidth = 2;
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "black";
//   }, []);

//   const startDrawing = (e) => {
//     const ctx = canvasRef.current.getContext("2d");
//     ctx.beginPath();
//     ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//     setIsDrawing(true);
//   };

//   const draw = (e) => {
//     if (!isDrawing) return;
//     const ctx = canvasRef.current.getContext("2d");
//     ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//     ctx.stroke();
//   };

//   const stopDrawing = () => {
//     const ctx = canvasRef.current.getContext("2d");
//     ctx.closePath();
//     setIsDrawing(false);
//   };

//   return (
//     <canvas
//       ref={canvasRef}
//       width={500}
//       height={300}
//       style={{ border: "1px solid black", cursor: "crosshair" }}
//       onMouseDown={startDrawing}
//       onMouseMove={draw}
//       onMouseUp={stopDrawing}
//       onMouseLeave={stopDrawing}
//     />
//   );
// }
