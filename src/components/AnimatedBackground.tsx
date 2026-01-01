'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedBackground.module.css';

// Vertex shader
const vertexSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader - Heart animation
const fragmentSource = `
precision highp float;

uniform float width;
uniform float height;
vec2 resolution = vec2(width, height);

uniform float time;

#define POINT_COUNT 8

vec2 points[POINT_COUNT];
const float speed = -0.5;
const float len = 0.25;
float intensity = 1.3;
float radius = 0.008;

// Signed distance to a quadratic bezier
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C){    
  vec2 a = B - A;
  vec2 b = A - 2.0*B + C;
  vec2 c = a * 2.0;
  vec2 d = A - pos;

  float kk = 1.0 / dot(b,b);
  float kx = kk * dot(a,b);
  float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
  float kz = kk * dot(d,a);      

  float res = 0.0;

  float p = ky - kx*kx;
  float p3 = p*p*p;
  float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
  float h = q*q + 4.0*p3;

  if(h >= 0.0){ 
    h = sqrt(h);
    vec2 x = (vec2(h, -h) - q) / 2.0;
    vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
    float t = uv.x + uv.y - kx;
    t = clamp( t, 0.0, 1.0 );

    vec2 qos = d + (c + b*t)*t;
    res = length(qos);
  }else{
    float z = sqrt(-p);
    float v = acos( q/(p*z*2.0) ) / 3.0;
    float m = cos(v);
    float n = sin(v)*1.732050808;
    vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
    t = clamp( t, 0.0, 1.0 );

    vec2 qos = d + (c + b*t.x)*t.x;
    float dis = dot(qos,qos);
        
    res = dis;

    qos = d + (c + b*t.y)*t.y;
    dis = dot(qos,qos);
    res = min(res,dis);
    
    qos = d + (c + b*t.z)*t.z;
    dis = dot(qos,qos);
    res = min(res,dis);

    res = sqrt( res );
  }
    
  return res;
}

// Heart curve parametric equation
vec2 getHeartPosition(float t){
  return vec2(16.0 * sin(t) * sin(t) * sin(t),
              -(13.0 * cos(t) - 5.0 * cos(2.0*t)
              - 2.0 * cos(3.0*t) - cos(4.0*t)));
}

// Glow effect
float getGlow(float dist, float radius, float intensity){
  return pow(radius/dist, intensity);
}

float getSegment(float t, vec2 pos, float offset, float scale){
  for(int i = 0; i < POINT_COUNT; i++){
    points[i] = getHeartPosition(offset + float(i)*len + fract(speed * t) * 6.28);
  }
    
  vec2 c = (points[0] + points[1]) / 2.0;
  vec2 c_prev;
  float dist = 10000.0;
    
  for(int i = 0; i < POINT_COUNT-1; i++){
    c_prev = c;
    c = (points[i] + points[i+1]) / 2.0;
    dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
  }
  return max(0.0, dist);
}

void main(){
  vec2 uv = gl_FragCoord.xy/resolution.xy;
  float widthHeightRatio = resolution.x/resolution.y;
  vec2 centre = vec2(0.5, 0.5);
  vec2 pos = centre - uv;
  pos.y /= widthHeightRatio;
  pos.y += 0.02;
  float scale = 0.000015 * height;
  
  float t = time;
    
  float dist = getSegment(t, pos, 0.0, scale);
  float glow = getGlow(dist, radius, intensity);
  
  vec3 col = vec3(0.0);

  // White core
  col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
  // Pink glow
  col += glow * vec3(1.0,0.05,0.3);
  
  // Second segment
  dist = getSegment(t, pos, 3.4, scale);
  glow = getGlow(dist, radius, intensity);
  
  // White core
  col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
  // Blue glow
  col += glow * vec3(0.1,0.4,1.0);
        
  // Tone mapping
  col = 1.0 - exp(-col);

  // Gamma
  col = pow(col, vec3(0.4545));

  gl_FragColor = vec4(col,1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number): WebGLShader {
  const shader = gl.createShader(shaderType);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile failed: ' + info);
  }
  return shader;
}

function getUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (location === null) throw new Error('Cannot find uniform ' + name);
  return location;
}

function getAttribLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
  const location = gl.getAttribLocation(program, name);
  if (location === -1) throw new Error('Cannot find attribute ' + name);
  return location;
}

// Generate heart SVG path from parametric equation
function generateHeartPath(scale: number = 10, offsetX: number = 200, offsetY: number = 180): string {
  const points: string[] = [];
  const steps = 100;
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    const px = offsetX + x * scale;
    const py = offsetY + y * scale;
    
    if (i === 0) {
      points.push(`M ${px} ${py}`);
    } else {
      points.push(`L ${px} ${py}`);
    }
  }
  
  points.push('Z');
  return points.join(' ');
}

// Generate shorter heart path for text animation (open path, trimmed at start/end)
// This prevents text from overlapping with the heart animation at top
function generateTextPath(
  scale: number = 10, 
  offsetX: number = 200, 
  offsetY: number = 180,
  startPercent: number = 0.08,  // Skip first 8% of path
  endPercent: number = 0.92     // End at 92% of path
): string {
  const points: string[] = [];
  const steps = 100;
  
  const startStep = Math.floor(steps * startPercent);
  const endStep = Math.floor(steps * endPercent);
  
  for (let i = startStep; i <= endStep; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    const px = offsetX + x * scale;
    const py = offsetY + y * scale;
    
    if (i === startStep) {
      points.push(`M ${px} ${py}`);
    } else {
      points.push(`L ${px} ${py}`);
    }
  }
  
  // No 'Z' - keep it as open path
  return points.join(' ');
}

// Pre-generated heart path for clip-path (full closed path)
const HEART_PATH = generateHeartPath(10, 200, 180);

// Shorter path for text animation (open, trimmed)
const TEXT_PATH = generateTextPath(10, 200, 180, 0.05, 0.95);

// Detect if device is low-end (for performance optimization)
// Called only on client-side
function isLowEndDevice(): boolean {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return true;
  
  // Desktop always gets animation
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  if (!isMobile) return false;
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check device memory if available (Chrome only)
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  
  // Low-end if: mobile with less than 4GB RAM or less than 4 cores
  if (memory < 4 || cores < 4) return true;
  
  // Check for older/weaker Android devices
  const isOldAndroid = /Android [4-7]/i.test(navigator.userAgent);
  if (isOldAndroid) return true;
  
  return false;
}

interface AnimatedBackgroundProps {
  text?: string;
  disableTextAnimation?: boolean;
}

export function AnimatedBackground({ 
  text = ' Made with Love ',
  disableTextAnimation = false 
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const textAnimationRef = useRef<number>(0);
  
  // Start with null to avoid hydration mismatch
  // null = not yet determined (SSR), true/false = client decision
  const [showTextAnimation, setShowTextAnimation] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check device performance only on client after hydration
  useEffect(() => {
    if (!isClient) return;
    
    if (disableTextAnimation || isLowEndDevice()) {
      setShowTextAnimation(false);
    } else {
      setShowTextAnimation(true);
    }
  }, [isClient, disableTextAnimation]);

  // Animate text along path using JavaScript
  useEffect(() => {
    if (!showTextAnimation || !textPathRef.current) return;
    
    let startTime: number | null = null;
    const duration = 25000; // 25 seconds for full loop
    
    const animateText = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Move from -100% to 100% - text starts completely off path and emerges letter by letter
      const offset = -80 + (progress * 200);
      
      if (textPathRef.current) {
        textPathRef.current.setAttribute('startOffset', `${offset}%`);
      }
      
      textAnimationRef.current = requestAnimationFrame(animateText);
    };
    
    textAnimationRef.current = requestAnimationFrame(animateText);
    
    return () => {
      if (textAnimationRef.current) {
        cancelAnimationFrame(textAnimationRef.current);
      }
    };
  }, [showTextAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('Unable to initialize WebGL.');
      return;
    }

    let time = 0.0;

    // Compile shaders
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    // Create program
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set up rectangle covering entire canvas
    const vertexData = new Float32Array([
      -1.0, 1.0,   // top left
      -1.0, -1.0,  // bottom left
      1.0, 1.0,    // top right
      1.0, -1.0,   // bottom right
    ]);

    // Create vertex buffer
    const vertexDataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Layout of data in vertex buffer
    const positionHandle = getAttribLocation(gl, program, 'position');
    gl.enableVertexAttribArray(positionHandle);
    gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 2 * 4, 0);

    // Set uniform handles
    const timeHandle = getUniformLocation(gl, program, 'time');
    const widthHandle = getUniformLocation(gl, program, 'width');
    const heightHandle = getUniformLocation(gl, program, 'height');

    gl.uniform1f(widthHandle, window.innerWidth);
    gl.uniform1f(heightHandle, window.innerHeight);

    let lastFrame = Date.now();

    const draw = () => {
      const thisFrame = Date.now();
      time += (thisFrame - lastFrame) / 1000;
      lastFrame = thisFrame;

      gl.uniform1f(timeHandle, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(widthHandle, window.innerWidth);
      gl.uniform1f(heightHandle, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Repeat text to fill the path - fewer repeats with larger font
  const repeatedText = (text).repeat(3);

  return (
    <div className={styles.container}>
      {/* SVG definitions for clip-path */}
      <svg className={styles.hiddenSvg}>
        <defs>
          <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.15 C0.5,0.15,0.35,0,0.2,0 C0.05,0,0,0.15,0,0.3 C0,0.55,0.25,0.75,0.5,1 C0.75,0.75,1,0.55,1,0.3 C1,0.15,0.95,0,0.8,0 C0.65,0,0.5,0.15,0.5,0.15 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* WebGL Canvas with heart animation - clipped to heart shape */}
      <div className={styles.clippedCanvas}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      
      {/* SVG with animated text along heart path border - rendered after hydration */}
      {/* showTextAnimation: null = SSR/loading, true = show, false = hide */}
      {showTextAnimation === true && (
        <svg 
          className={styles.textPathSvg} 
          viewBox="0 0 400 360" 
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            {/* Shortened text path - trimmed at start/end to avoid overlap with heart animation */}
            <path id="textPath" d={TEXT_PATH} fill="none" />
          </defs>
          
          {/* Animated text along heart path */}
          <text className={styles.pathText}>
            <textPath 
              ref={textPathRef}
              href="#textPath"
              startOffset="0%"
            >
              {repeatedText}
            </textPath>
          </text>
        </svg>
      )}
      
      {/* Dark overlay outside heart */}
      <div className={styles.darkOverlay} />
    </div>
  );
}
