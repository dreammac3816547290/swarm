"use client";

import { use, useEffect, useRef, useState } from "react";

// function Canvas({ level, image }) {
//   const canvasRef = useRef(null);
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     const imageData = ctx.createImageData(canvas.width, canvas.height);
//     // modify imageData.data with image
//   }, [image]);
//   return <canvas ref={canvasRef} width={2 ** level} height={2 ** level} />;
// }

function round(num, step) {
  return num - (num % step);
}

function createId(...args) {
  return args.join(",");
}

function createClone(nodeId, { x, y }) {
  const cloneId = createId(nodeId, crypto.randomUUID());
  return { cloneId, x, y }; // mass is uniformly distributed across clones
}

function createNeighbor(nodeId, cohesion) {
  return { nodeId, cohesion }; // cohesion [0, 1]
}

export default function Home() {
  const canvasRef = useRef(null);
  const level = 9; // canvas size 2^level
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

  const canvases = useRef([]);
  const [state, setState] = useState(null);
  const [play, setPlay] = useState(false);
  const [fps, setFps] = useState(24);
  const [startTime, setStartTime] = useState(0);
  const [frame, setFrame] = useState(0);

  function callback(time) {
    if (!play || !state) return;
    if ((time - startTime) / 1000 >= frame / fps) {
      // visualize
      for (let lvl = 0; lvl < level; lvl++) {
        for (let shift = 0; shift < 3; shift++) {
          const canvas = canvases.current[lvl * 3 + shift];
          visualize(canvas, state, lvl, shift);
        }
      }
      setState(next);
      setFrame((frame) => frame + 1); // alternative jump to frame
    } else requestAnimationFrame(callback);
  }

  useEffect(() => {
    if (!play) return;
    if (!state) {
      // initialize
      const hierarchy = [];
      for (let lvl = 0; lvl < level; lvl++) {
        const nodes = new Map();
        const stride = 2 ** lvl;
        for (let x = 0; x < 2 ** level; x += stride) {
          for (let y = 0; y < 2 ** level; y += stride) {
            const nodeId = createId(lvl, x, y); // initial x, y
            const neighbors = [];
            for (const dx of [-stride, 0, stride]) {
              for (const dy of [-stride, 0, stride]) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx; // neighbor x
                const ny = y + dy; // neighbor y
                if (nx < 0 || nx >= 2 ** level || ny < 0 || ny >= 2 ** level)
                  continue;
                neighbors.push(createNeighbor(createId(lvl, nx, ny), 1)); // modify cohesion based on color
              }
            }
            nodes.set(nodeId, {
              nodeId,
              color: [255, 255, 255, 0], // modify on set start
              clones: [createClone(nodeId, { x, y })], // initialize 1 clone
              neighbors,
              parent:
                lvl === level - 1
                  ? null
                  : createId(
                      lvl + 1,
                      round(x, 2 ** (lvl + 1)),
                      round(y, 2 ** (lvl + 1))
                    ),
              stride,
            });
          }
        }
        hierarchy.push({
          nodes,
        });
      }
      setState({ hierarchy });
    }
    setStartTime(performance.now());
    setFrame(0); // reset on pause
    requestAnimationFrame(callback);
  }, [play]);

  useEffect(() => {
    requestAnimationFrame(callback);
  }, [frame, state]);

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
        width={2 ** level}
        height={2 ** level}
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
      <button style={{ margin: 10, padding: 5 }} onClick={() => setPlay(!play)}>
        {play ? "Pause" : "Start"}
      </button>
      <input
        type="number"
        style={{ width: 50 }}
        value={fps}
        min={0}
        onChange={(e) => setFps(Number(e.target.value || 24))}
      />
      <br />
      {Array.from({ length: level }, (_, lvl) => (
        <div key={lvl}>
          {Array.from({ length: 3 }, (_, shift) => (
            <canvas
              key={shift}
              ref={(el) => (canvases.current[lvl * 3 + shift] = el)}
              width={2 ** level}
              height={2 ** level}
              style={{ margin: 10, border: "1px solid" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function next(state) {
  return state;
}

function visualize(canvas, state, level, shift) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const levelState = state.hierarchy[level];
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
