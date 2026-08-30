"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { MeterFallback } from "./MeterFallback";
import { formatBDT } from "@/lib/utils/money";

interface SmartMeterCanvasProps {
  balanceBDT: number;
  todayDate: string;
  totalUnits: number;
  caseId: string;
}

function Meter3DModel({
  balanceBDT,
  todayDate,
  totalUnits,
  caseId,
}: SmartMeterCanvasProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isHealthy = balanceBDT > 300;
  const isWarning = balanceBDT <= 300 && balanceBDT > 100;
  const ledColor = isHealthy ? "#10B981" : isWarning ? "#F59E0B" : "#F43F5E";

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle subtle rotation following mouse pointer
      const targetX = (state.pointer.y * Math.PI) / 16;
      const targetY = (state.pointer.x * Math.PI) / 12;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetX,
        0.05
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetY,
        0.05
      );
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.03 : 1}
      >
        {/* Main Titanium Chassis */}
        <RoundedBox args={[3.2, 3.8, 0.6]} radius={0.15} smoothness={4}>
          <meshStandardMaterial
            color="#222033"
            metalness={0.85}
            roughness={0.25}
            envMapIntensity={1.2}
          />
        </RoundedBox>

        {/* Outer Gold Accent Bevel */}
        <RoundedBox args={[3.25, 3.85, 0.1]} radius={0.15} position={[0, 0, -0.2]}>
          <meshStandardMaterial color="#C5A059" metalness={0.9} roughness={0.3} />
        </RoundedBox>

        {/* OLED Screen Recess */}
        <RoundedBox args={[2.8, 1.8, 0.1]} radius={0.08} position={[0, 0.4, 0.28]}>
          <meshStandardMaterial color="#0A0A10" roughness={0.1} />
        </RoundedBox>

        {/* 3D OLED Display Text */}
        <Text
          position={[-1.1, 0.95, 0.35]}
          fontSize={0.11}
          color="#C5A059"
          anchorX="left"
          anchorY="middle"
        >
          {`METER: ${caseId} • TELEMETRY`}
        </Text>

        <Text
          position={[-1.1, 0.65, 0.35]}
          fontSize={0.12}
          color="#94A3B8"
          anchorX="left"
          anchorY="middle"
        >
          BALANCE
        </Text>

        <Text
          position={[-1.1, 0.3, 0.35]}
          fontSize={0.28}
          color="#FFFFFF"
          anchorX="left"
          anchorY="middle"
        >
          {`BDT ${formatBDT(balanceBDT, false)}`}
        </Text>

        <Text
          position={[-1.1, -0.05, 0.35]}
          fontSize={0.12}
          color="#64748B"
          anchorX="left"
          anchorY="middle"
        >
          {`${totalUnits} kWh • AS OF ${todayDate}`}
        </Text>

        {/* LED Indicator Ring */}
        <mesh position={[1.1, 1.45, 0.32]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color={ledColor} />
        </mesh>

        {/* Terminal Block at Bottom */}
        <RoundedBox args={[2.8, 0.8, 0.4]} radius={0.05} position={[0, -1.2, 0.15]}>
          <meshStandardMaterial color="#181622" metalness={0.7} roughness={0.4} />
        </RoundedBox>

        {/* Optical Sensor Port */}
        <mesh position={[0, -1.2, 0.38]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#C5A059" metalness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

export const SmartMeterCanvas: React.FC<SmartMeterCanvasProps> = (props) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!mounted) {
    return <MeterFallback {...props} />;
  }

  if (!hasWebGL) {
    return <MeterFallback {...props} />;
  }

  return (
    <div className="w-full h-80 relative flex items-center justify-center">
      <Suspense fallback={<MeterFallback {...props} />}>
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 8, 5]} intensity={2.5} color="#FFFFFF" />
          <directionalLight position={[-5, -2, 2]} intensity={1.0} color="#C5A059" />
          <pointLight position={[0, 2, 3]} intensity={1.5} color="#60A5FA" />
          <Meter3DModel {...props} />
        </Canvas>
      </Suspense>
    </div>
  );
};
