"use client";

import { ChangeEvent, DragEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Tool = "brush" | "rectangle" | "circle" | "polygon" | "eraser";
const PURPLE = "rgba(127, 90, 240, .62)";

export default function Home() {
  const imageCanvas = useRef<HTMLCanvasElement>(null);
  const maskCanvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);
  const shapeBase = useRef<ImageData | null>(null);
  const polygonPoints = useRef<Point[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(52);
  const [zoom, setZoom] = useState(100);
  const [prompt, setPrompt] = useState("");
  const [toast, setToast] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [polygonCount, setPolygonCount] = useState(0);

  const updateHistoryState = () => {
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < history.current.length - 1);
  };

  const saveHistory = useCallback(() => {
    const canvas = maskCanvas.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex.current = history.current.length - 1;
    updateHistoryState();
  }, []);

  const fitImage = useCallback((image: HTMLImageElement) => {
    const ratio = Math.min(1600 / image.naturalWidth, 1100 / image.naturalHeight, 1);
    const width = Math.round(image.naturalWidth * ratio);
    const height = Math.round(image.naturalHeight * ratio);
    [imageCanvas.current, maskCanvas.current].forEach((canvas) => {
      if (canvas) { canvas.width = width; canvas.height = height; }
    });
    imageCanvas.current?.getContext("2d")?.drawImage(image, 0, 0, width, height);
    history.current = [];
    historyIndex.current = -1;
    polygonPoints.current = [];
    setPolygonCount(0);
    setLoaded(true);
    requestAnimationFrame(saveHistory);
  }, [saveHistory]);

  const openImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setToast("이미지 파일만 넣을 수 있어요"); return; }
    const image = new Image();
    image.onload = () => { fitImage(image); URL.revokeObjectURL(image.src); };
    image.src = URL.createObjectURL(file);
  }, [fitImage]);

  const loadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) openImage(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault(); setIsDragging(false);
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
    if (file) openImage(file); else setToast("드래그한 항목에 이미지가 없어요");
  };

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvas.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };

  const drawBrush = (from: Point, to: Point) => {
    const ctx = maskCanvas.current?.getContext("2d"); if (!ctx) return;
    ctx.save(); ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = PURPLE; ctx.lineWidth = brushSize; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.restore();
  };

  const drawShape = (start: Point, end: Point) => {
    const canvas = maskCanvas.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !shapeBase.current) return;
    ctx.putImageData(shapeBase.current, 0, 0); ctx.save(); ctx.fillStyle = PURPLE;
    if (tool === "rectangle") ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    if (tool === "circle") {
      const cx = (start.x + end.x) / 2, cy = (start.y + end.y) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(end.x - start.x) / 2, Math.abs(end.y - start.y) / 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawPolygonPreview = (cursor?: Point) => {
    const canvas = maskCanvas.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !shapeBase.current || !polygonPoints.current.length) return;
    ctx.putImageData(shapeBase.current, 0, 0); ctx.save();
    ctx.fillStyle = "rgba(127, 90, 240, .35)"; ctx.strokeStyle = "rgba(99, 67, 215, .95)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(polygonPoints.current[0].x, polygonPoints.current[0].y);
    polygonPoints.current.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    if (cursor) ctx.lineTo(cursor.x, cursor.y);
    if (polygonPoints.current.length >= 3) ctx.fill();
    ctx.stroke();
    polygonPoints.current.forEach((point) => { ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke(); });
    ctx.restore();
  };

  const finishPolygon = useCallback(() => {
    const canvas = maskCanvas.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !shapeBase.current || polygonPoints.current.length < 3) return;
    ctx.putImageData(shapeBase.current, 0, 0); ctx.save(); ctx.fillStyle = PURPLE; ctx.beginPath();
    ctx.moveTo(polygonPoints.current[0].x, polygonPoints.current[0].y);
    polygonPoints.current.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath(); ctx.fill(); ctx.restore(); polygonPoints.current = []; shapeBase.current = null; setPolygonCount(0); saveHistory();
  }, [saveHistory]);

  const changeTool = (next: Tool) => {
    if (polygonPoints.current.length >= 3) finishPolygon();
    else if (polygonPoints.current.length) { shapeBase.current && maskCanvas.current?.getContext("2d")?.putImageData(shapeBase.current, 0, 0); polygonPoints.current = []; setPolygonCount(0); }
    setTool(next);
  };

  const startDraw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!loaded) return;
    const point = pointFromEvent(event);
    if (tool === "polygon") {
      if (!polygonPoints.current.length) shapeBase.current = maskCanvas.current!.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, maskCanvas.current!.width, maskCanvas.current!.height);
      polygonPoints.current.push(point); setPolygonCount(polygonPoints.current.length); drawPolygonPreview(); return;
    }
    event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; startPoint.current = point; lastPoint.current = point;
    if (tool === "brush" || tool === "eraser") drawBrush(point, point);
    else shapeBase.current = maskCanvas.current!.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, maskCanvas.current!.width, maskCanvas.current!.height);
  };

  const moveDraw = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    if (tool === "polygon" && polygonPoints.current.length) { drawPolygonPreview(point); return; }
    if (!drawing.current || !lastPoint.current || !startPoint.current) return;
    if (tool === "brush" || tool === "eraser") drawBrush(lastPoint.current, point); else drawShape(startPoint.current, point);
    lastPoint.current = point;
  };

  const endDraw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    if (tool === "rectangle" || tool === "circle") drawShape(startPoint.current!, pointFromEvent(event));
    drawing.current = false; lastPoint.current = null; startPoint.current = null; shapeBase.current = null; saveHistory();
  };

  const restoreHistory = (next: number) => {
    const canvas = maskCanvas.current; if (!canvas || !history.current[next]) return;
    canvas.getContext("2d")?.putImageData(history.current[next], 0, 0); historyIndex.current = next; updateHistoryState();
  };
  const clearMask = () => { const canvas = maskCanvas.current; if (!canvas) return; canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); polygonPoints.current = []; setPolygonCount(0); saveHistory(); };

  const exportTransparentPng = async (keepSelection: boolean) => {
    const source = imageCanvas.current, mask = maskCanvas.current;
    if (!source || !mask || !loaded) { setToast("먼저 이미지를 불러와 주세요"); return; }
    if (polygonPoints.current.length >= 3) finishPolygon();
    const maskCtx = mask.getContext("2d", { willReadFrequently: true });
    if (!maskCtx) return;
    const pixels = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
    let hasSelection = false;
    for (let index = 3; index < pixels.length; index += 4) { if (pixels[index] > 8) { hasSelection = true; break; } }
    if (!hasSelection) { setToast("먼저 지울 배경이나 남길 피사체를 선택해 주세요"); return; }
    const output = document.createElement("canvas"); output.width = source.width; output.height = source.height;
    const ctx = output.getContext("2d")!; ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = keepSelection ? "destination-in" : "destination-out";
    ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = "source-over";
    const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png")); if (!blob) return;
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); setToast(keepSelection ? "피사체만 남긴 투명 PNG를 복사했어요" : "선택한 배경을 지운 투명 PNG를 복사했어요"); }
    catch { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = keepSelection ? "subject-only.png" : "background-removed.png"; link.click(); setToast("투명 PNG를 다운로드했어요"); }
  };

  const copyForCodex = async () => {
    const source = imageCanvas.current, mask = maskCanvas.current;
    if (!source || !mask || !loaded) { setToast("먼저 이미지를 불러와 주세요"); return; }
    if (polygonPoints.current.length >= 3) finishPolygon();
    const output = document.createElement("canvas"); output.width = source.width; output.height = source.height;
    const ctx = output.getContext("2d")!; ctx.drawImage(source, 0, 0); ctx.drawImage(mask, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png")); if (!blob) return;
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); setToast("선택 영역이 표시된 원본을 복사했어요 · ChatGPT에 붙여넣으세요"); }
    catch { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "inpaint-selection.png"; link.click(); setToast("이미지를 다운로드했어요 · ChatGPT에 첨부하세요"); }
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => { const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/")); if (file) { event.preventDefault(); openImage(file); setToast("붙여넣은 이미지를 불러왔어요"); } };
    const onKey = (event: KeyboardEvent) => { if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return; const keys: Record<string, Tool> = { b: "brush", r: "rectangle", c: "circle", p: "polygon", e: "eraser" }; if (keys[event.key.toLowerCase()]) changeTool(keys[event.key.toLowerCase()]); if (event.key === "Enter" && polygonPoints.current.length >= 3) finishPolygon(); };
    window.addEventListener("paste", onPaste); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("paste", onPaste); window.removeEventListener("keydown", onKey); };
  }, [finishPolygon, openImage]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4200); return () => clearTimeout(timer); }, [toast]);

  const tools: { id: Tool; label: string; icon: string; key: string }[] = [
    { id: "brush", label: "브러시", icon: "●", key: "B" }, { id: "rectangle", label: "사각형", icon: "□", key: "R" },
    { id: "circle", label: "원", icon: "○", key: "C" }, { id: "polygon", label: "다각형", icon: "⬡", key: "P" },
    { id: "eraser", label: "지우개", icon: "◆", key: "E" },
  ];

  return <main onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragging(false); }} onDrop={handleDrop}>
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span><span>Inpaint</span><span className="beta">SKILL</span></div><div className="top-actions"><button className="ghost" onClick={() => fileInput.current?.click()}>이미지 바꾸기</button><button className="send" onClick={copyForCodex}>코덱스로 보내기 <span>↗</span></button></div></header>
    <section className="workspace"><aside className="panel tools-panel"><div className="panel-title">선택 도구</div><div className="tool-grid">{tools.map((item) => <button key={item.id} className={tool === item.id ? "tool active" : "tool"} onClick={() => changeTool(item.id)}><span className={`tool-icon ${item.id}`}>{item.icon}</span><span>{item.label}</span><kbd>{item.key}</kbd></button>)}</div>
      {(tool === "brush" || tool === "eraser") && <><label className="control-label"><span>{tool === "brush" ? "브러시" : "지우개"} 크기</span><strong>{brushSize}px</strong></label><input className="range" type="range" min="8" max="180" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}/><div className="size-preview"><span style={{ width: Math.min(brushSize, 70), height: Math.min(brushSize, 70) }}/></div></>}
      {tool === "polygon" && <div className="polygon-help"><strong>{polygonCount ? `${polygonCount}개 점 선택됨` : "점을 차례로 찍으세요"}</strong><span>마지막에 더블클릭하거나 Enter</span>{polygonCount >= 3 && <button onClick={finishPolygon}>다각형 완성</button>}</div>}
      <div className="divider"/><div className="history-actions"><button disabled={!canUndo} onClick={() => restoreHistory(historyIndex.current - 1)}>↶<span>실행 취소</span></button><button disabled={!canRedo} onClick={() => restoreHistory(historyIndex.current + 1)}>↷<span>다시 실행</span></button></div><button className="clear" onClick={clearMask}>선택 영역 모두 지우기</button><div className="tip"><span>i</span><p><strong>보라색으로 칠한 부분</strong>이<br/>수정할 영역으로 전달됩니다.</p></div></aside>
      <section className={`canvas-area ${isDragging ? "dragging" : ""}`}><div className="canvas-stage" style={{ transform: `scale(${zoom / 100})` }}>{!loaded && <button className="dropzone" onClick={() => fileInput.current?.click()}><span className="upload-icon">↑</span><strong>이미지를 드래그해서 놓으세요</strong><small>클릭해서 선택하거나 Ctrl+V로 붙여넣기</small></button>}<canvas ref={imageCanvas} className={loaded ? "image-canvas visible" : "image-canvas"}/><canvas ref={maskCanvas} className={loaded ? "mask-canvas visible" : "mask-canvas"} onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerCancel={endDraw} onDoubleClick={finishPolygon} aria-label="인페인트 영역 선택 캔버스"/></div><div className="zoom-control"><button onClick={() => setZoom((z) => Math.max(40, z - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom((z) => Math.min(180, z + 10))}>＋</button><button onClick={() => setZoom(100)}>맞춤</button></div>{isDragging && <div className="drop-overlay"><span>↓</span><strong>여기에 이미지를 놓으세요</strong></div>}</section>
      <aside className="panel request-panel"><div><div className="panel-title">수정 요청</div><p className="subcopy">선택한 영역을 어떻게 바꿀지 적어주세요.</p></div><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="예: 테이블 위의 컵을 작은 화분으로 바꿔줘"/><div className="examples"><div>빠른 예시</div>{["이 물체를 자연스럽게 지워줘", "배경과 어울리게 채워줘", "다른 색상으로 바꿔줘"].map((text) => <button key={text} onClick={() => setPrompt(text)}>{text}<span>＋</span></button>)}</div><div className="background-card"><div><span className="checker">◫</span><strong>배경 제거</strong></div><p>보라색으로 영역을 선택한 뒤 원하는 방식을 고르세요.</p><button onClick={() => exportTransparentPng(false)}>선택한 배경 지우기</button><button className="outline" onClick={() => exportTransparentPng(true)}>선택한 피사체만 남기기</button></div><div className="send-card"><div><span className="spark">✦</span><strong>준비되셨나요?</strong></div><p>선택 영역이 칠해진 원본을 복사해<br/>ChatGPT에서 바로 이어서 작업합니다.</p><button onClick={copyForCodex}>코덱스로 보내기 <span>↗</span></button></div></aside></section>
    <input ref={fileInput} hidden type="file" accept="image/*" onChange={loadFile}/>{toast && <div className="toast"><span>✓</span>{toast}</div>}
  </main>;
}

