"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const AnimatedShaderBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId: number;
    let isDestroyed = false;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer = new THREE.WebGLRenderer({ 
        antialias: false,          // disable antialias on mobile to save GPU
        powerPreference: "low-power" // critical: prevents mobile GPU context loss
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap pixel ratio
      mount.appendChild(renderer.domElement);

      // Handle WebGL context loss gracefully (mobile browsers kill GPU context)
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        isDestroyed = true;
        cancelAnimationFrame(frameId);
      }, false);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          iTime: { value: 0 },
          iResolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight),
          },
        },
        vertexShader: `
          void main() {
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float iTime;
          uniform vec2 iResolution;

          #define NUM_OCTAVES 3

          float rand(vec2 n) {
            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u*u*(3.0-2.0*u);
            float res = mix(
              mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
              mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
            return res*res;
          }

          float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.3;
            vec2 shift = vec2(100);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < NUM_OCTAVES; ++i) {
              v += a * noise(x);
              x = rot * x * 2.0 + shift;
              a *= 0.4;
            }
            return v;
          }

          void main() {
            vec2 shake = vec2(sin(iTime*1.2)*0.005, cos(iTime*2.1)*0.005);
            vec2 p = ((gl_FragCoord.xy + shake*iResolution.xy) - iResolution.xy*0.5) / iResolution.y * mat2(6.0,-4.0,4.0,6.0);
            vec2 v;
            vec4 o = vec4(0.0);

            float f = 2.0 + fbm(p + vec2(iTime*5.0, 0.0))*0.5;

            for (float i = 0.0; i < 35.0; i++) {
              v = p + cos(i*i + (iTime + p.x*0.08)*0.025 + i*vec2(13.0,11.0))*3.5
                + vec2(sin(iTime*3.0+i)*0.003, cos(iTime*3.5-i)*0.003);
              float tailNoise = fbm(v + vec2(iTime*0.5, i)) * 0.3 * (1.0-(i/35.0));
              vec4 auroraColors = vec4(
                0.1 + 0.3*sin(i*0.2 + iTime*0.4),
                0.3 + 0.5*cos(i*0.3 + iTime*0.5),
                0.7 + 0.3*sin(i*0.4 + iTime*0.3),
                1.0
              );
              vec4 contrib = auroraColors * exp(sin(i*i + iTime*0.8)) / length(max(v, vec2(v.x*f*0.015, v.y*1.5)));
              float thin = smoothstep(0.0, 1.0, i/35.0) * 0.6;
              o += contrib * (1.0 + tailNoise*0.8) * thin;
            }

            o = tanh(pow(o/100.0, vec4(1.6)));
            // Visible aurora on black background
            gl_FragColor = vec4(o.rgb * 1.5, 1.0);
          }
        `,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const clock = { time: 0 };
      const animate = () => {
        if (isDestroyed) return;
        clock.time += 0.016;
        material.uniforms.iTime.value = clock.time;
        renderer!.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (isDestroyed || !renderer) return;
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        isDestroyed = true;
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
        if (mount.contains(renderer!.domElement)) {
          mount.removeChild(renderer!.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer!.dispose();
      };
    } catch (err) {
      // WebGL not available (iOS WebView, in-app browsers, etc.) — fail silently
      console.warn('[AnimatedShaderBackground] WebGL not available:', err);
      return;
    }
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
};

export default AnimatedShaderBackground;
