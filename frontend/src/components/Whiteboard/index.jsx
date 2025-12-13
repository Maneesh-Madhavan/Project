import { useEffect, useRef } from "react";

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

  /* ================= CANVAS SETUP ================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctxRef.current = ctx;

      redraw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [elements]);

  /* ================= RECEIVE FINAL DATA ================= */
  useEffect(() => {
    socket.on("whiteBoardDataResponse", ({ elements }) => {
      setElements(elements);
    });
    return () => socket.off("whiteBoardDataResponse");
  }, [socket, setElements]);

  /* ================= RECEIVE LIVE STROKES ================= */
  useEffect(() => {
    socket.on("whiteBoardTemp", ({ element }) => {
      redraw(element);
    });
    return () => socket.off("whiteBoardTemp");
  }, [socket, elements]);

  const redraw = (temp = null) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const drawElement = (el) => {
      ctx.strokeStyle = el.color;
      if (el.type === "pencil") {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
      if (el.type === "line") {
        const [a, b] = el.path;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      if (el.type === "rect") {
        const [a, b] = el.path;
        ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      }
    };

    elements.forEach(drawElement);
    if (temp) drawElement(temp);
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    const { x, y } = getCoords(e);
    if (tool === "pencil") currentStroke.current = [{ x, y }];
    else currentStroke.current = [[x, y], [x, y]];
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

    socket.emit("whiteBoardTemp", {
      roomId,
      userId: user.userId,
      element: temp,
    });
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    let finalElement;
    if (tool === "pencil") {
      finalElement = { type: "pencil", color, points: currentStroke.current };
    } else {
      finalElement = { type: tool, color, path: [...currentStroke.current] };
    }

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
