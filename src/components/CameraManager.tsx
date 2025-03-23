import React, { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { button, useControls } from "leva";
import * as THREE from "three";
import { UI_MODES, useConfiguratorStore } from "../store";

export const START_CAMERA_POSITION: [number, number, number] = [500, 10, 1000];
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [-1, 1, 5];
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0];

interface CameraPlacement {
  position: [number, number, number];
  target: [number, number, number];
}

interface Category {
  expand?: {
    cameraPlacement?: CameraPlacement;
  };
}

interface CameraManagerProps {
  loading: boolean;
}

export const CameraManager: React.FC<CameraManagerProps> = ({ loading }) => {
  const controls = useRef<CameraControls>(null!);
  const currentCategory = useConfiguratorStore(
    (state) => state.currentCategory
  ) as Category | null;
  const initialLoading = useConfiguratorStore((state) => state.loading) as boolean;
  const mode = useConfiguratorStore((state) => state.mode) as string;

  useControls({
    getCameraPosition: button(() => {
      const pos = new THREE.Vector3();
      controls.current.getPosition(pos);
      console.log("Camera Position", pos.toArray());
    }),
    getCameraTarget: button(() => {
      const target = new THREE.Vector3();
      controls.current.getTarget(target);
      console.log("Camera Target", target.toArray());
    }),
  });

  useEffect(() => {
    if (initialLoading) {
      controls.current.setLookAt(
        ...START_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET
      );
    } else if (
      !loading &&
      mode === UI_MODES.customize &&
      currentCategory?.expand?.cameraPlacement
    ) {
      controls.current.setLookAt(
        ...currentCategory.expand.cameraPlacement.position,
        ...currentCategory.expand.cameraPlacement.target,
        true
      );
    } else {
      controls.current.setLookAt(
        ...DEFAULT_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET,
        true
      );
    }
  }, [currentCategory, mode, initialLoading, loading]);

  return (
    <CameraControls
      ref={controls}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2}
      minDistance={2}
      maxDistance={8}
    />
  );
};
