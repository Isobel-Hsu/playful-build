const assets = [
  "selected/1.png",
  "selected/11.png",
  "selected/12.png",
  "selected/13.png",
  "selected/14.png",
  "selected/15.png",
  "selected/18.png",
  "selected/19.png",
  "selected/20.png",
  "selected/28.png",
  "selected/29.png",
  "selected/3.png",
  "selected/30.png",
  "selected/31.png",
  "selected/32.png",
  "selected/33.png",
  "selected/34.png",
  "selected/35.png",
  "selected/36.png",
  "selected/37.png",
  "selected/4.png",
  "selected/41.png",
  "selected/42.png",
  "selected/43.png",
  "selected/5.png",
  "selected/6.png",
  "selected/8.png",
  "selected/9.png",
];

const layer = document.querySelector("#collageLayer");
const stage = document.querySelector(".collage-stage");
const message = document.querySelector("#scrollMessage");
const rowCounts = [6, 5, 6, 5, 6];
const rowY = [8.4, 28.3, 49.2, 70.1, 91.1];
const createdItems = [];
let topZ = assets.length + 1;
let scrollProgress = 0;
let scrollFrame = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
const smoothRange = (value, start, end) => {
  const progress = clamp((value - start) / (end - start), 0, 1);

  return progress * progress * (3 - 2 * progress);
};

const setBalancedSize = (item, img) => {
  const layerWidth = layer.getBoundingClientRect().width || window.innerWidth;
  const isMobile = window.innerWidth <= 760;
  const targetLongSide = clamp(layerWidth * (isMobile ? 0.16 : 0.062), isMobile ? 56 : 62, isMobile ? 78 : 92);
  const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
  const width = aspect >= 1 ? targetLongSide : targetLongSide * aspect;

  item.style.setProperty("--balanced-width", `${Math.max(width, isMobile ? 18 : 20).toFixed(2)}px`);
};

const getPlacement = (index) => {
  let row = 0;
  let offset = index;

  while (offset >= rowCounts[row]) {
    offset -= rowCounts[row];
    row += 1;
  }

  const count = rowCounts[row];
  const baseX = ((offset + 0.62) / count) * 100;
  const wave = Math.sin((index + 1) * 1.73) * 2.25;
  const stagger = row % 2 === 0 ? -1.2 : 1.35;
  const x = clamp(baseX + wave + stagger, 4.8, 95.2);
  const y = clamp(rowY[row] + Math.cos((index + 2) * 1.27) * 3.4, 4.2, 95.6);
  const rotation = (((index * 23) % 29) - 14) * 0.9;
  const fadeMs = 780 + ((index * 173) % 930);
  const delayMs = 80 + ((index * 97) % 980);

  return {
    x,
    y,
    rotation,
    fadeMs,
    delayMs,
    z: index + 1,
  };
};

const loadImage = (img) => {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve();
  }

  if (img.decode) {
    return img.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", resolve, { once: true });
  });
};

const showItem = (item, placement) => {
  window.setTimeout(() => {
    item.classList.add("is-visible");
  }, placement.delayMs);
};

const createItem = (src, index) => {
  const placement = getPlacement(index);
  const item = document.createElement("button");
  const img = document.createElement("img");

  item.type = "button";
  item.className = "collage-item";
  item.style.setProperty("--x", placement.x.toFixed(3));
  item.style.setProperty("--y", placement.y.toFixed(3));
  item.style.setProperty("--rot", `${placement.rotation.toFixed(2)}deg`);
  item.style.setProperty("--fade", `${placement.fadeMs}ms`);
  item.style.setProperty("--delay", `${placement.delayMs}ms`);
  item.style.setProperty("--z", placement.z);
  item.dataset.offsetX = "0";
  item.dataset.offsetY = "0";
  item.setAttribute("aria-label", `拼貼物件 ${index + 1}`);

  img.src = src;
  img.alt = "";
  img.draggable = false;

  item.append(img);
  layer.append(item);
  createdItems.push(item);

  loadImage(img).then(() => {
    setBalancedSize(item, img);
    showItem(item, placement);
  });
};

const setDragOffset = (item, x, y, tilt = 0) => {
  item.dataset.offsetX = String(x);
  item.dataset.offsetY = String(y);
  item.style.setProperty("--tx", `${x}px`);
  item.style.setProperty("--ty", `${y}px`);
  item.style.setProperty("--tilt", `${tilt}deg`);
};

const beginDrag = (event) => {
  if (!document.body.classList.contains("is-ready") || scrollProgress > 0.035) {
    return;
  }

  const item = event.currentTarget;
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = Number(item.dataset.offsetX || 0);
  const originY = Number(item.dataset.offsetY || 0);

  item.classList.add("is-dragging");
  item.style.setProperty("--z", topZ++);
  item.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const nextX = originX + moveEvent.clientX - startX;
    const nextY = originY + moveEvent.clientY - startY;
    const tilt = clamp((moveEvent.clientX - startX) / 12, -7, 7);
    setDragOffset(item, nextX, nextY, tilt.toFixed(2));
  };

  const finish = () => {
    item.classList.remove("is-dragging");
    item.style.setProperty("--tilt", "0deg");
    item.removeEventListener("pointermove", move);
    item.removeEventListener("pointerup", finish);
    item.removeEventListener("pointercancel", finish);
  };

  item.addEventListener("pointermove", move);
  item.addEventListener("pointerup", finish, { once: true });
  item.addEventListener("pointercancel", finish, { once: true });
};

const arrangedAssets = assets.map((_, index) => assets[(index * 23) % assets.length]);

arrangedAssets.forEach(createItem);
createdItems.forEach((item) => item.addEventListener("pointerdown", beginDrag));

const updateScrollAnimation = () => {
  const maxScroll = Math.max(stage.offsetHeight - window.innerHeight, 1);
  const rawProgress = clamp(-stage.getBoundingClientRect().top / maxScroll, 0, 1);
  const gatherProgress = easeOutCubic(smoothRange(rawProgress, 0.08, 0.78));
  const fadeProgress = smoothRange(rawProgress, 0.36, 0.86);
  const textProgress = smoothRange(rawProgress, 0.72, 0.92);
  const layerRect = layer.getBoundingClientRect();
  const targetX = window.innerWidth * 0.5;
  const targetY = window.innerHeight * 0.18;

  scrollProgress = rawProgress;

  createdItems.forEach((item, index) => {
    const baseX = layerRect.left + (Number(item.style.getPropertyValue("--x")) / 100) * layerRect.width;
    const baseY = layerRect.top + (Number(item.style.getPropertyValue("--y")) / 100) * layerRect.height;
    const dragX = Number(item.dataset.offsetX || 0);
    const dragY = Number(item.dataset.offsetY || 0);
    const clusterX = Math.sin(index * 1.91) * 38;
    const clusterY = Math.cos(index * 1.37) * 22;
    const nextX = (targetX + clusterX - baseX - dragX) * gatherProgress;
    const nextY = (targetY + clusterY - baseY - dragY) * gatherProgress;
    const nextOpacity = 1 - fadeProgress;

    item.style.setProperty("--scroll-x", `${nextX.toFixed(2)}px`);
    item.style.setProperty("--scroll-y", `${nextY.toFixed(2)}px`);
    item.style.setProperty("--scroll-opacity", nextOpacity.toFixed(3));
  });

  message.style.setProperty("--message-opacity", textProgress.toFixed(3));
  message.style.setProperty("--message-progress", textProgress.toFixed(3));
};

window.addEventListener("resize", () => {
  createdItems.forEach((item) => {
    setBalancedSize(item, item.querySelector("img"));
  });
  updateScrollAnimation();
});

const requestScrollAnimationUpdate = () => {
  window.cancelAnimationFrame(scrollFrame);
  scrollFrame = window.requestAnimationFrame(updateScrollAnimation);
};

window.addEventListener("scroll", requestScrollAnimationUpdate, { passive: true });

Promise.all(createdItems.map((item) => loadImage(item.querySelector("img")))).then(() => {
  const longestIntro = Math.max(
    ...createdItems.map((item) => {
      const delay = Number.parseFloat(item.style.getPropertyValue("--delay"));
      const fade = Number.parseFloat(item.style.getPropertyValue("--fade"));
      return delay + fade;
    }),
  );

  window.setTimeout(() => {
    document.body.classList.add("is-ready");
    updateScrollAnimation();
  }, longestIntro + 180);
});
