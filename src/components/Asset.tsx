import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useConfiguratorStore } from "../store";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

type AssetProps = {
    url: string;
    categoryName: string;
    skeleton: THREE.Skeleton;
};

export const Asset = ({ url, categoryName, skeleton }: AssetProps) => {
    const gltf = useGLTF(url) as GLTF;
    const scene = gltf.scene;

    const customization = useConfiguratorStore((state) => state.customization);
    const lockedGroups = useConfiguratorStore((state) => state.lockedGroups);
    const skin = useConfiguratorStore((state) => state.skin);
    const assetColor = customization[categoryName]?.color ?? "#ffffff";

    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => {
                        if (m.name && m.name.includes("Color_")) {

                            (m as THREE.MeshStandardMaterial).color.set(assetColor);
                        }
                    });
                } else {
                    if (mesh.material.name && mesh.material.name.includes("Color_")) {
                        (mesh.material as THREE.MeshStandardMaterial).color.set(assetColor);
                    }
                }
            }
        });
    }, [assetColor, scene]);

    const attachedItems = useMemo(() => {
        const items: {
            geometry: THREE.BufferGeometry;
            material: THREE.Material;
            morphTargetDictionary?: { [key: string]: number };
            morphTargetInfluences?: number[];
        }[] = [];

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                let chosenMaterial: THREE.Material;
                if (Array.isArray(mesh.material)) {

                    if (mesh.material.some((m) => m.name && m.name.includes("Skin_"))) {
                        chosenMaterial = skin;
                    } else {
                        chosenMaterial = mesh.material[0];
                    }
                } else {
                    chosenMaterial = mesh.material.name.includes("Skin_")
                        ? skin
                        : mesh.material;
                }
                items.push({
                    geometry: mesh.geometry,
                    material: chosenMaterial,
                    morphTargetDictionary: mesh.morphTargetDictionary,
                    morphTargetInfluences: mesh.morphTargetInfluences,
                });
            }
        });
        return items;
    }, [scene, skin]);

    if (lockedGroups[categoryName]) {
        return null;
    }

    return (
        <>
            {attachedItems.map((item, index) => (
                <skinnedMesh
                    key={index}
                    geometry={item.geometry}
                    material={item.material}
                    skeleton={skeleton}
                    morphTargetDictionary={item.morphTargetDictionary}
                    morphTargetInfluences={item.morphTargetInfluences}
                    castShadow
                    receiveShadow
                />
            ))}
        </>
    );
};
