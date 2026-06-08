"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Scène "Astral Santé" :
 *  - un cœur 3D en nuage de points (équation implicite de Taubin), iridescent,
 *    qui bat en rythme "lub-dub" et tourne lentement ;
 *  - une nébuleuse de particules en arrière-plan ;
 *  - parallaxe à la souris.
 * 100% client (WebGL) — rien n'est rendu côté serveur.
 */
export default function AstralHeart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = () => container.clientWidth;
    const H = () => container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03040d, 0.012);

    const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    container.appendChild(renderer.domElement);

    // --- sprite circulaire doux ---
    const makeSprite = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(255,255,255,0.75)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };
    const sprite = makeSprite();

    // --- nuage de points en forme de cœur (Taubin) ---
    const heartInside = (x: number, y: number, z: number) => {
      const a = x * x + (9 / 4) * y * y + z * z - 1;
      return a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z < 0;
    };
    const TARGET = 9000;
    const hPos: number[] = [];
    const hCol: number[] = [];
    const pink = new THREE.Color(0xff3b6b);
    const cyan = new THREE.Color(0x35d6ff);
    const teal = new THREE.Color(0x2fe0a6);
    let guard = 0;
    while (hPos.length < TARGET * 3 && guard < TARGET * 60) {
      guard++;
      const x = (Math.random() * 2 - 1) * 1.3;
      const y = (Math.random() * 2 - 1) * 1.3;
      const z = (Math.random() * 2 - 1) * 1.5;
      if (!heartInside(x, y, z)) continue;
      // Repère Taubin -> vertical : (x, z, y) avec z = hauteur
      const px = x;
      const py = z;
      const pz = y;
      hPos.push(px, py, pz);
      // teinte iridescente selon la hauteur
      const t = (py + 1.4) / 2.8;
      const base = pink.clone().lerp(cyan, Math.min(1, Math.max(0, t)));
      if (Math.random() > 0.82) base.lerp(teal, 0.6);
      hCol.push(base.r, base.g, base.b);
    }
    const heartGeo = new THREE.BufferGeometry();
    heartGeo.setAttribute("position", new THREE.Float32BufferAttribute(hPos, 3));
    heartGeo.setAttribute("color", new THREE.Float32BufferAttribute(hCol, 3));
    const heartMat = new THREE.PointsMaterial({
      size: 0.035,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.95,
    });
    const heart = new THREE.Points(heartGeo, heartMat);
    heart.rotation.z = Math.PI; // pointe vers le bas
    const heartGroup = new THREE.Group();
    heartGroup.add(heart);
    heartGroup.scale.setScalar(1.6);
    scene.add(heartGroup);

    // halo / glow central
    const glowSprite = makeSprite();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowSprite,
        color: 0xff3b6b,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    glow.scale.set(7, 7, 1);
    scene.add(glow);

    // --- nébuleuse de fond ---
    const NEB = 1100;
    const nPos = new Float32Array(NEB * 3);
    const nCol = new Float32Array(NEB * 3);
    for (let i = 0; i < NEB; i++) {
      const r = 9 + Math.random() * 26;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      nPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      nPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      nPos[i * 3 + 2] = r * Math.cos(ph) - 12;
      const c = Math.random() > 0.5 ? cyan : teal;
      nCol[i * 3] = c.r;
      nCol[i * 3 + 1] = c.g;
      nCol[i * 3 + 2] = c.b;
    }
    const nebGeo = new THREE.BufferGeometry();
    nebGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
    nebGeo.setAttribute("color", new THREE.BufferAttribute(nCol, 3));
    const neb = new THREE.Points(
      nebGeo,
      new THREE.PointsMaterial({
        size: 0.18,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,
      }),
    );
    scene.add(neb);

    // battement "lub-dub"
    const beat = (t: number) => {
      const p = (t % 1.15) ;
      const g = (c: number, w: number) => Math.exp(-((p - c) * (p - c)) / w);
      return g(0.0, 0.0016) + 0.55 * g(0.22, 0.0016);
    };

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
      const s = 1.6 * (1 + beat(t) * 0.12);
      heartGroup.scale.setScalar(s);
      heartGroup.rotation.y = t * 0.35;
      glow.scale.setScalar(6.5 + beat(t) * 1.4);
      (glow.material as THREE.SpriteMaterial).opacity = 0.28 + beat(t) * 0.25;
      neb.rotation.y = t * 0.04;
      camera.position.x += (mx * 1.6 - camera.position.x) * 0.04;
      camera.position.y += (-my * 1.2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      heartGeo.dispose();
      heartMat.dispose();
      nebGeo.dispose();
      sprite.dispose();
      glowSprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 h-full w-full" />;
}
