"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Fond "Astral" : nébuleuse de particules WebGL (bleu/vert médical),
 * rotation lente, pulsation "battement de cœur" et parallaxe à la souris.
 * Tout le code WebGL vit dans useEffect → aucun rendu côté serveur.
 */
export default function AstralBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const w = () => container.clientWidth;
    const h = () => container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050d, 0.00065);

    const camera = new THREE.PerspectiveCamera(72, w() / h(), 1, 4000);
    camera.position.z = 620;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    container.appendChild(renderer.domElement);

    // Sprite circulaire doux
    const sCanvas = document.createElement("canvas");
    sCanvas.width = sCanvas.height = 64;
    const sctx = sCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(sCanvas);

    // Particules
    const COUNT = 1600;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const blue = new THREE.Color(0x35a8ff);
    const green = new THREE.Color(0x2fe0a6);
    for (let i = 0; i < COUNT; i++) {
      const r = 950 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = Math.random() > 0.5 ? blue : green;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 7,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.9,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.045;
      points.rotation.x = t * 0.018;
      const pulse = 1 + Math.sin(t * 1.25) * 0.025; // battement de cœur
      points.scale.setScalar(pulse);
      camera.position.x += (mx * 140 - camera.position.x) * 0.04;
      camera.position.y += (-my * 140 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 h-full w-full" />;
}
