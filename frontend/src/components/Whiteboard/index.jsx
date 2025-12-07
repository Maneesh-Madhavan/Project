import { useEffect, useState } from "react";
import rough from "roughjs";

const WhiteBoard = ({ canvasRef, ctxRef, elements, setElements, tool, color, user, socket }) => {
  const [img, setImg] = useState(null);

  // Receive image updates
  useEffect(() => {
    socket.on("whiteBoardDataResponse", (data) => {
      setImg(data.imgURL);
    });
  }, []);

  // Viewer mode (non-presenter)
  if (!user?.presenter) {
    if (!img) {
      return <div className="wb-canvas">Waiting for presenter...</div>;
    }
    return <img src={img} className="wb-canvas" alt="Real Time Board" />;
  }

  // Presenter mode
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctxRef.current = ctx;
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Draw changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rc = rough.canvas(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((el) => {
      const { type, path, stroke } = el;

      if (type === "pencil") rc.linearPath(path, { stroke, strokeWidth: 2 });

      if (type === "line") {
        const [p1, p2] = path;
        rc.line(p1[0], p1[1], p2[0], p2[1], { stroke, strokeWidth: 2 });
      }

      if (type === "rect") {
        const [p1, p2] = path;
        rc.rectangle(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1], {
          stroke,
          strokeWidth: 2
        });
      }
    });

    // Send updated image to server
    const canvasImage = canvasRef.current.toDataURL("image/png");
    socket.emit("whiteboardData", canvasImage);
  }, [elements]);

  // Helpers
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      const t = e.touches[0];
      return [t.clientX - rect.left, t.clientY - rect.top];
    }
    return [e.nativeEvent.offsetX, e.nativeEvent.offsetY];
  };

  const handleStart = (e) => {
    const [x, y] = getCoords(e);
    setIsDrawing(true);
    setStartPoint([x, y]);

    if (tool === "pencil")
      setElements((prev) => [...prev, { type: "pencil", stroke: color, path: [[x, y]] }]);
  };

  const handleMove = (e) => {
    if (!isDrawing) return;

    const [x, y] = getCoords(e);

    setElements((prev) => {
      const els = [...prev];
      const last = els[els.length - 1];
      if (!last) return els;

      if (tool === "pencil") last.path.push([x, y]);
      if (tool === "line" || tool === "rect") last.path = [startPoint, [x, y]];

      return els;
    });
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleStartShape = (e) => {
    const [x, y] = getCoords(e);

    if (tool === "line" || tool === "rect")
      setElements((prev) => [...prev, { type: tool, stroke: color, path: [[x, y], [x, y]] }]);
  };

  return (
    <canvas
      ref={canvasRef}
      className="wb-canvas"
      onMouseDown={(e) => {
        handleStart(e);
        handleStartShape(e);
      }}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        handleStart(e);
        handleStartShape(e);
      }}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      touch-action="none"
    />
  );
};

export default WhiteBoard;
