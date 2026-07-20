import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { getPrimes, getUlamCoordinates } from '../lib/math';

interface PrimePointProps {
  n: number;
  position: [number, number, number];
  isActive: boolean;
  onClick: (n: number) => void;
}

const PrimePoint = ({ n, position, isActive, onClick }: PrimePointProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isActive) {
        meshRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.15);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.8);
      } else {
        meshRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(n);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Make the sphere noticeably larger so it is easy to click (0.16 radius instead of 0.08) */}
        <sphereGeometry args={[isActive ? 0.35 : 0.16, 16, 16]} />
        <meshStandardMaterial 
          color={isActive ? "#06b6d4" : (hovered ? "#22d3ee" : "#555555")} 
          emissive={isActive ? "#06b6d4" : (hovered ? "#06b6d4" : "#000000")}
          emissiveIntensity={isActive ? 4 : (hovered ? 2.5 : 0)}
        />
      </mesh>
      {(isActive || hovered) && (
        <Html
          distanceFactor={15}
          position={[0, 0.7, 0]}
          center
        >
          <div className={`px-2 py-1 rounded font-mono text-[9px] whitespace-nowrap select-none border transition-all ${
            isActive 
              ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
              : 'bg-black/95 text-cyan-400 border-cyan-500/30'
          }`}>
            {n}
          </div>
        </Html>
      )}
    </group>
  );
};

interface ViewportProps {
  limit: number;
  activeId: number | null;
  onPointClick: (n: number) => void;
}

export const Viewport = ({ limit, activeId, onPointClick }: ViewportProps) => {
  const primePoints = useMemo(() => {
    const primes = getPrimes(limit);
    return primes.map(p => ({
      n: p,
      pos: getUlamCoordinates(p)
    }));
  }, [limit]);

  return (
    <div className="w-full h-full bg-[#0a0a0a]" onContextMenu={(e) => e.preventDefault()}>
      <Canvas camera={{ position: [20, 20, 20], fov: 45 }}>
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 15, 60]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[20, 20, 20]} intensity={1.5} color="#06b6d4" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.2} />

        <group>
          {primePoints.map((pt) => (
            <PrimePoint 
              key={pt.n} 
              n={pt.n} 
              position={pt.pos} 
              isActive={activeId === pt.n}
              onClick={onPointClick}
            />
          ))}
          
          {/* Connecting Spiral Line */}
          <Line
            points={primePoints.map(pt => pt.pos)}
            color="#06b6d4"
            lineWidth={1.2}
            transparent
            opacity={0.15}
          />
        </group>

        <OrbitControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.05} 
          maxDistance={100} 
          minDistance={2} 
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};
