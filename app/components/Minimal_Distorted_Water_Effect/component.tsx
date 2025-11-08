"use client";
import { useEffect, useRef } from "react";
import {
  Renderer,
  Geometry,
  Program,
  Mesh,
  Texture,
  RenderTarget,
  Triangle,
} from "ogl";

export default function WaterDistortion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new Renderer({ canvas: canvasRef.current });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const triangle = new Triangle(gl);

    // Create two buffers for ping-ponging simulation
    // simA will hold the current state, simB will be rendered into
    let simA = new RenderTarget(gl);
    let simB = new RenderTarget(gl);

    const mouse = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
    };

    // Simulation shader (your first code)
    const simProgram = new Program(gl, {
      vertex: /* glsl */ `
        attribute vec2 uv;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(2.0 * uv - 1.0, 0.0, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        uniform sampler2D tWater;
        uniform vec2 uResolution;
        uniform float uFrame;
        uniform vec4 uMouse;

        const float delta = 1.0;
        varying vec2 vUv;

        void main() {
          if (uFrame == 0.0) {
            gl_FragColor = vec4(0.0);
            return;
          }

          vec2 fc = vUv * uResolution;

          float pressure = texture2D(tWater, vUv).x;
          float pVel = texture2D(tWater, vUv).y;

          float px = 1.0 / uResolution.x;
          float py = 1.0 / uResolution.y;

          float p_right = texture2D(tWater, vUv + vec2(px, 0.0)).x;
          float p_left  = texture2D(tWater, vUv - vec2(px, 0.0)).x;
          float p_up    = texture2D(tWater, vUv + vec2(0.0, py)).x;
          float p_down  = texture2D(tWater, vUv - vec2(0.0, py)).x;

          if (fc.x <= 0.5) p_left = p_right;
          if (fc.x >= uResolution.x - 0.5) p_right = p_left;
          if (fc.y <= 0.5) p_down = p_up;
          if (fc.y >= uResolution.y - 0.5) p_up = p_down;

          pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
          pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;

          pressure += delta * pVel;
          
          pVel -= 0.005 * delta * pressure;
          pVel *= 1.0 - 0.002 * delta;
          pressure *= 0.999;

          // Add mouse disturbance
          vec2 mousePos = uMouse.xy * uResolution;
          vec2 prevMousePos = uMouse.zw * uResolution;
          vec2 mouseVel = mousePos - prevMousePos;
          float mouseSpeed = length(mouseVel);

          if (mouseSpeed > 0.0) {
            float dist = distance(fc, mousePos);
            float radius = 20.0;
            float strength = 0.05;
            if (dist < radius) {
              float falloff = 1.0 - dist / radius;
              pressure += strength * falloff * mouseSpeed;
              pVel += strength * falloff * mouseSpeed;
            }
          }

          gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
        }
      `,
      uniforms: {
        tWater: { value: simA.texture },
        uResolution: { value: new Float32Array([window.innerWidth, window.innerHeight]) },
        uFrame: { value: 0 },
        uMouse: { value: new Float32Array([0, 0, 0, 0]) }, // currX, currY, prevX, prevY
      },
    });

    // Render shader (your second code)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://picsum.photos/800/400";
    img.onload = () => {
      const texture = new Texture(gl, { image: img });

      const renderProgram = new Program(gl, {
        vertex: /* glsl */ `
          attribute vec2 uv;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(2.0 * uv - 1.0, 0.0, 1.0);
          }
        `,
        fragment: /* glsl */ `
          precision highp float;
          uniform sampler2D tWater;
          uniform sampler2D tImage;
          varying vec2 vUv;

          void main() {
            vec4 data = texture2D(tWater, vUv);
            vec2 distortedUv = vUv + 0.2 * data.zw;

            vec4 color = texture2D(tImage, distortedUv);
            vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));
            color += vec4(1.0) * pow(max(0.0, dot(normal, normalize(vec3(-3.0, 10.0, 3.0)))), 60.0);
            gl_FragColor = color;
          }
        `,
        uniforms: {
          tWater: { value: simA.texture },
          tImage: { value: texture },
          uResolution: { value: new Float32Array([window.innerWidth, window.innerHeight]) },
        },
      });

      const simMesh = new Mesh(gl, { geometry: triangle, program: simProgram });
      const renderMesh = new Mesh(gl, { geometry: triangle, program: renderProgram });

      // Resize handler
      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        simProgram.uniforms.uResolution.value = new Float32Array([window.innerWidth, window.innerHeight]);
        renderProgram.uniforms.uResolution.value = new Float32Array([window.innerWidth, window.innerHeight]);
        // Recreate render targets with new size
        simA = new RenderTarget(gl, { width: window.innerWidth, height: window.innerHeight });
        simB = new RenderTarget(gl, { width: window.innerWidth, height: window.innerHeight });
        simProgram.uniforms.tWater.value = simA.texture; // Update the texture reference
      };
      window.addEventListener("resize", handleResize);
      handleResize(); // Initial resize call

      // Mouse event handlers
      const handleMouseMove = (e: MouseEvent) => {
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        // Convert mouse coordinates to UV space (0-1)
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = 1 - e.clientY / window.innerHeight; // Invert Y for WebGL
        simProgram.uniforms.uMouse.value = new Float32Array([mouse.x, mouse.y, mouse.prevX, mouse.prevY]);
      };

      canvasRef.current?.addEventListener("mousemove", handleMouseMove);

      let frame = 0;
      function update() {
        frame++;
        simProgram.uniforms.uFrame.value = frame;

        // Render simulation into simB (using simA as input)
        renderer.render({ scene: simMesh, target: simB });

        // Swap buffers: simA becomes the new simB, simB becomes the new simA
        // This means the result of the last frame (in simB) becomes the input for the next frame (simA)
        const temp = simA;
        simA = simB;
        simB = temp;

        // Update uniforms to point to the new current simulation state (simA's texture)
        simProgram.uniforms.tWater.value = simA.texture;
        renderProgram.uniforms.tWater.value = simA.texture;

        // Render final image to screen
        renderer.render({ scene: renderMesh });

        requestAnimationFrame(update);
      }
      update();

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize);
        canvasRef.current?.removeEventListener("mousemove", handleMouseMove);
        // Optional: Dispose OGL resources if necessary for larger applications
        // gl.deleteProgram(simProgram.program);
        // gl.deleteProgram(renderProgram.program);
        // gl.deleteTexture(simA.texture);
        // gl.deleteTexture(simB.texture);
        // gl.deleteTexture(texture);
      };
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-screen" />;
}
