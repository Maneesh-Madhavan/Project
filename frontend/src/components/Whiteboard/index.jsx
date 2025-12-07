import { useEffect, useRef } from "react";

const WhiteBoard = ({ canvasRef, ctxRef, elements, setElements, tool, color, user, socket }) => {
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctxRef.current = ctx;

    // Redraw existing elements after resize
    if (elements?.length) {
      elements.forEach(el => {
        redraw(el);
      });
    }
  };

  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);
  return () => window.removeEventListener("resize", resizeCanvas);
}, [canvasRef, elements]);


  useEffect(() => {
    socket.on("whiteBoardDataResponse", (data) => {
      if (data?.elements) setElements(data.elements);
    });
    return () => socket.off("whiteBoardDataResponse");
  }, [socket, setElements]);

  const redraw = (tempElement = null) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    elements.forEach((el) => {
      ctx.strokeStyle = el.color || "#000";
      if (el.type === "pencil" && el.points?.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
        ctx.stroke();
      } else if (el.type === "line" && el.path?.length === 2) {
        const [p1, p2] = el.path;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      } else if (el.type === "rect" && el.path?.length === 2) {
        const [p1, p2] = el.path;
        ctx.strokeRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
      }
    });

    if (tempElement) {
      ctx.strokeStyle = tempElement.color;
      if (tempElement.type === "pencil" && tempElement.points?.length > 1) {
        ctx.beginPath();
        ctx.moveTo(tempElement.points[0].x, tempElement.points[0].y);
        for (let i = 1; i < tempElement.points.length; i++) ctx.lineTo(tempElement.points[i].x, tempElement.points[i].y);
        ctx.stroke();
      } else if (tempElement.type === "line" && tempElement.path?.length === 2) {
        const [p1, p2] = tempElement.path;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      } else if (tempElement.type === "rect" && tempElement.path?.length === 2) {
        const [p1, p2] = tempElement.path;
        ctx.strokeRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
      }
    }
  };

  useEffect(() => { redraw(); }, [elements]);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (!user?.presenter) return;
    isDrawing.current = true;
    const coords = getCoords(e);
    if (tool === "pencil") currentStroke.current = [coords];
    else currentStroke.current = [[coords.x, coords.y], [coords.x, coords.y]];
  };

  const draw = (e) => {
    if (!isDrawing.current || !user?.presenter) return;
    const coords = getCoords(e);
    if (tool === "pencil") {
      currentStroke.current.push(coords);
      redraw({ type: "pencil", color, points: currentStroke.current });
    } else {
      currentStroke.current[1] = [coords.x, coords.y];
      redraw({ type: tool, color, path: currentStroke.current });
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current || !user?.presenter) return;
    isDrawing.current = false;
    if (!currentStroke.current.length) return;

    let newElement;
    if (tool === "pencil") newElement = { type: "pencil", color, points: currentStroke.current };
    else newElement = { type: tool, color, path: [...currentStroke.current] };

    if (newElement) {
      setElements(prev => {
        const updated = [...prev, newElement];
        socket.emit("whiteBoardData", { elements: updated });
        return updated;
      });
    }
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
    />
  );
};

export default WhiteBoard;
