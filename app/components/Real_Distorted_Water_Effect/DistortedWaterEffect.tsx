"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  simulationVertexShader,
  simulationFragmentsShader,
  renderVertexShader,
  renderFragmentShader,
} from "./shaders";

export default function WaterDistortion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0, 1
    );

    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

    // --- TEXTURE TARGETS (ping-pong buffers) ---
    let renderTargetA = new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });
    let renderTargetB = new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });

    // --- SIMULATION MATERIAL ---
    const simUniforms = {
      textureA: { value: renderTargetA.texture },
      mouse: { value: new THREE.Vector2(-1, -1) },
      resolution: { value: resolution },
      time: { value: 0 },
      frame: { value: 0 },
    };

    const simulationMaterial = new THREE.ShaderMaterial({
      uniforms: simUniforms,
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentsShader,
    });

    const simulationPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      simulationMaterial
    );

    const simulationScene = new THREE.Scene();
    simulationScene.add(simulationPlane);

    // --- RENDER MATERIAL ---
    const textureLoader = new THREE.TextureLoader();
    const imageTexture = textureLoader.load(
      "https://picsum.photos/800/400"
    );

    const renderUniforms = {
      textureA: { value: renderTargetA.texture },
      textureB: { value: imageTexture },
    };

    const renderMaterial = new THREE.ShaderMaterial({
      uniforms: renderUniforms,
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
    });

    const renderPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), renderMaterial);
    scene.add(renderPlane);

    // --- MOUSE INTERACTION ---
    const mouse = new THREE.Vector2(-10, -10);
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = resolution.y - event.clientY;
      simUniforms.mouse.value.set(mouse.x, mouse.y);
    };
    window.addEventListener("mousemove", onMouseMove);

    // --- RESIZE HANDLER ---
    const onResize = () => {
      resolution.set(window.innerWidth, window.innerHeight);
      renderer.setSize(resolution.x, resolution.y);
      renderTargetA.setSize(resolution.x, resolution.y);
      renderTargetB.setSize(resolution.x, resolution.y);
      simUniforms.resolution.value = resolution;
    };
    window.addEventListener("resize", onResize);

    // --- RENDER LOOP ---
    let frame = 0;
    function animate(t: number) {
      frame++;
      simUniforms.time.value = t * 0.001;
      simUniforms.frame.value = frame;

      // Step 1: Run simulation
      simulationMaterial.uniforms.textureA.value = renderTargetA.texture;
      renderer.setRenderTarget(renderTargetB);
      renderer.render(simulationScene, camera);

      // Step 2: Render to screen
      renderUniforms.textureA.value = renderTargetB.texture;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      // Step 3: Swap render targets
      const temp = renderTargetA;
      renderTargetA = renderTargetB;
      renderTargetB = temp;

      requestAnimationFrame(animate);
    }

    animate(0);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      renderTargetA.dispose();
      renderTargetB.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-screen" />;
}
