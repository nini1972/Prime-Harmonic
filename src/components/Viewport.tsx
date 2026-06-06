import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
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
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.32}
          color={isActive ? "#ffffff" : "#22d3ee"}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v13/t6pt271361WkqNrmp0XW3uD1E__U920.woff2"
        >
          {n}
        </Text>
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

  const linePoints = useMemo(() => {
    return new Float32Array(primePoints.flatMap(p => p.pos));
  }, [primePoints]);

  return (
    <div className="w-full h-full bg-[#0a0a0a]">
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
          
          <line>
            <bufferGeometry>
              <bufferAttribute 
                attach="attributes-position"
                count={primePoints.length}
                array={linePoints}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#06b6d4" transparent opacity={0.1} />
          </line>
        </group>

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxDistance={100} minDistance={2} />
      </Canvas>
    </div>
  );
};
