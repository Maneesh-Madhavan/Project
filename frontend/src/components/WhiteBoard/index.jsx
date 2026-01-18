import { useEffect, useRef, useState } from "react";

const WhiteBoard = ({
  canvasRef,
  ctxRef,
  elements,
  setElements,
  tool,
  color,
  user,
  socket,
  roomId,
}) => {
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const normalizePoint = (x, y) => [x / canvasSize.width, y / canvasSize.height];
  const denormalizePoint = (nx, ny) => [nx * canvasSize.width, ny * canvasSize.height];

  /* RESIZE */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      setCanvasSize({ width, height });
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctxRef.current = ctx;

      redraw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, [elements]);

  /* SOCKET LISTENERS */
  useEffect(() => {
    socket.on("whiteBoardDataResponse", ({ elements }) => setElements(elements));
    return () => socket.off("whiteBoardDataResponse");
  }, [socket, setElements]);

  useEffect(() => {
    socket.on("whiteBoardTemp", ({ element }) => redraw(element));
    return () => socket.off("whiteBoardTemp");
  }, [socket, elements]);

  const redraw = (temp = null) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const drawElement = (el) => {
      ctx.strokeStyle = el.color;

      if (el.type === "pencil") {
        ctx.beginPath();
        const [sx, sy] = denormalizePoint(el.points[0].x, el.points[0].y);
        ctx.moveTo(sx, sy);
        el.points.forEach((p) => {
          const [x, y] = denormalizePoint(p.x, p.y);
          ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      if (el.type === "line") {
        const [a, b] = el.path;
        const [x1, y1] = denormalizePoint(a[0], a[1]);
        const [x2, y2] = denormalizePoint(b[0], b[1]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      if (el.type === "rect") {
        const [a, b] = el.path;
        const [x1, y1] = denormalizePoint(a[0], a[1]);
        const [x2, y2] = denormalizePoint(b[0], b[1]);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    };

    elements.forEach(drawElement);
    if (temp) drawElement(temp);
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const [nx, ny] = normalizePoint(x - rect.left, y - rect.top);
    return { x: nx, y: ny };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    const { x, y } = getCoords(e);
    currentStroke.current =
      tool === "pencil" ? [{ x, y }] : [[x, y], [x, y]];
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const { x, y } = getCoords(e);
    let temp;

    if (tool === "pencil") {
      currentStroke.current.push({ x, y });
      temp = { type: "pencil", color, points: currentStroke.current };
    } else {
      currentStroke.current[1] = [x, y];
      temp = { type: tool, color, path: currentStroke.current };
    }

    redraw(temp);
    socket.emit("whiteBoardTemp", { roomId, userId: user.userId, element: temp });
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const finalElement =
      tool === "pencil"
        ? { type: "pencil", color, points: currentStroke.current }
        : { type: tool, color, path: [...currentStroke.current] };

    setElements((prev) => {
      const updated = [...prev, finalElement];
      socket.emit("whiteBoardData", { roomId, elements: updated });
      return updated;
    });

    currentStroke.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      className="wb-canvas"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        cursor:
          tool === "pencil"
            ? "url('/pencil.cur'), crosshair"
            : tool === "line"
            ? "crosshair"
            : tool === "rect"
            ? "crosshair"
            : "default",
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
};

export default WhiteBoard;
