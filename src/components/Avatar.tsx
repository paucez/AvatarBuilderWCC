import React, { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { NodeIO } from "@gltf-transform/core";
import { dedup, draco, prune, quantize } from "@gltf-transform/functions";
import { useAnimations, useGLTF } from "@react-three/drei";
import { GLTFExporter } from "three-stdlib";
import { pb, useConfiguratorStore } from "../store";
import { Asset } from "./Asset";

// Define una interfaz para el asset, incluyendo la propiedad 'url'
interface CustomAsset {
  id: string;
  url: string;
  // Puedes agregar más propiedades según sea necesario
}

interface Customization {
  [key: string]: {
    asset?: CustomAsset;
    // Otras propiedades de configuración...
  };
}

export const Avatar: React.FC<JSX.IntrinsicElements["group"]> = (props) => {
  const group = useRef<THREE.Group>(null!);

  // Se asume 'any' para los modelos GLTF; idealmente reemplázalo por los tipos correctos
  const { nodes } = useGLTF("/models/Armature.glb") as any;
  const { animations } = useGLTF("/models/Poses.glb") as any;
  const customization = useConfiguratorStore((state) => state.customization) as Customization;
  const { actions } = useAnimations(animations, group);
  const setDownload = useConfiguratorStore((state) => state.setDownload);
  const pose = useConfiguratorStore((state) => state.pose);

  useEffect(() => {
    function download() {
      const exporter = new GLTFExporter();
      exporter.parse(
        group.current,
        (result) => {
          // Se utiliza una IIFE asíncrona para el procesamiento
          (async () => {
            if (!(result instanceof ArrayBuffer)) {
              console.error("Se esperaba un ArrayBuffer, pero se recibió un objeto.");
              return;
            }
            const io = new NodeIO();
            const document = await io.readBinary(new Uint8Array(result));
            await document.transform(prune(), dedup(), draco(), quantize());
            const glb = await io.writeBinary(document);

            save(
              new Blob([glb], { type: "application/octet-stream" }),
              `avatar_${Date.now()}.glb`
            );
          })();
        },
        (error: any) => {
          console.error(error);
        },
        { binary: true }
      );
    }

    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);

    function save(blob: Blob, filename: string) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }

    setDownload(download);
  }, [setDownload]);

  useEffect(() => {
    actions[pose]?.fadeIn(0.2).play();
    return () => {
      actions[pose]?.fadeOut(0.2).stop();
      return undefined; // Aseguramos que la función de limpieza retorne undefined
    };
  }, [actions, pose]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <primitive object={nodes.mixamorigHips} />
          {Object.keys(customization).map((key) => {
            const asset = customization[key]?.asset as CustomAsset | undefined;
            return asset && asset.url ? (
              <Suspense key={asset.id}>
                <Asset
                  categoryName={key}
                  url={pb.files.getUrl(asset, asset.url)}
                  skeleton={nodes.Plane.skeleton}
                />
              </Suspense>
            ) : null;
          })}
        </group>
      </group>
    </group>
  );
};

useGLTF.preload("/models/Armature.glb");
useGLTF.preload("/models/Poses.glb");
