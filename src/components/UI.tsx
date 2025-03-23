import React from "react";
import { pb, PHOTO_POSES, UI_MODES, useConfiguratorStore } from "../store";


type PoseType = keyof typeof PHOTO_POSES;

export interface AssetType {
  id: string;
  name: string;
  group: string;
  thumbnail: string;
  categoryName: string;
  
}

export interface Category {
  id: string;
  name: string;
  removable?: boolean;
  assets?: AssetType[];
  colorPalette?: { colors: string[] };
  expand?: {
    colorPalette?: { colors: string[] };
  };
}

export interface CustomizationItem {
  asset?: AssetType;
  color?: string;
}

export interface Customization {
  [categoryName: string]: CustomizationItem;
}

// Interfaz para el store (ajusta según tu implementación real)
export interface CustomStore {
  categories: Category[];
  currentCategory: Category | null;
  setCurrentCategory: (cat: Category) => void;
  changeAsset: (categoryName: string, asset: AssetType | null) => void;
  customization: Customization;
  lockedGroups: { [categoryName: string]: AssetType[] };
  pose: string;
  setPose: (pose: string) => void;
  updateColor: (color: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  loading: boolean;
}

// Se asume que UI_MODES tiene las siguientes claves (en minúsculas)
const uiModes = UI_MODES as Record<string, string>;

const PosesBox: React.FC = () => {
  // Se castea el store a nuestro CustomStore (si fuera necesario, refina la definición)
  const { pose: curPose, setPose } = useConfiguratorStore() as unknown as {
    pose: string;
    setPose: (pose: string) => void;
  };

  // Se castea para que TS reconozca las llaves válidas
  const poseKeys = Object.keys(PHOTO_POSES) as Array<PoseType>;

  return (
    <div className="pointer-events-auto md:rounded-t-lg bg-gradient-to-br from-black/30 to-indigo-900/20 backdrop-blur-sm drop-shadow-md flex p-6 gap-3 overflow-x-auto noscrollbar">
      {poseKeys.map((poseKey) => {
        const poseValue = PHOTO_POSES[poseKey];
        return (
          <button
            key={poseKey}
            className={`transition-colors duration-200 font-medium flex-shrink-0 border-b ${
              curPose === poseValue
                ? "text-white shadow-purple-100 border-b-white"
                : "text-gray-200 hover:text-gray-100 border-b-transparent"
            }`}
            onClick={() => setPose(poseValue)}
          >
            {poseKey}
          </button>
        );
      })}
    </div>
  );
};

const AssetsBox: React.FC = () => {
  const {
    categories,
    currentCategory,
    setCurrentCategory,
    changeAsset,
    customization,
    lockedGroups,
  } = useConfiguratorStore() as unknown as CustomStore;

  return (
    <div className="md:rounded-t-lg bg-gradient-to-br from-black/30 to-indigo-900/20 backdrop-blur-sm drop-shadow-md flex flex-col py-6 gap-3 overflow-hidden">
      <div className="flex items-center gap-8 pointer-events-auto noscrollbar overflow-x-auto px-6 pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setCurrentCategory(category)}
            className={`transition-colors duration-200 font-medium flex-shrink-0 border-b ${
              currentCategory?.name === category.name
                ? "text-white shadow-purple-100 border-b-white"
                : "text-gray-200 hover:text-gray-100 border-b-transparent"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      {currentCategory &&
        lockedGroups[currentCategory.name] &&
        lockedGroups[currentCategory.name].length > 0 && (
          <p className="text-red-400 px-6">
            Asset is hidden by{" "}
            {lockedGroups[currentCategory.name]
              .map((asset) => `${asset.name} (${asset.categoryName})`)
              .join(", ")}
          </p>
        )}
      <div className="flex gap-2 overflow-x-auto noscrollbar px-6">
        {currentCategory?.removable && (
          <button
            onClick={() => changeAsset(currentCategory.name, null)}
            className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden pointer-events-auto hover:opacity-100 transition-all border-2 duration-300 bg-gradient-to-tr ${
              !customization[currentCategory.name]?.asset
                ? "border-white from-white/20 to-white/30"
                : "from-black/70 to-black/20 border-black"
            }`}
          >
            <div className="w-full h-full flex items-center justify-center bg-black/40 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
        )}
        {currentCategory?.assets?.map((asset) => (
          <button
            key={asset.thumbnail}
            onClick={() => changeAsset(currentCategory.name, asset)}
            className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden pointer-events-auto hover:opacity-100 transition-all border-2 duration-300 bg-gradient-to-tr ${
              customization[currentCategory.name]?.asset?.id === asset.id
                ? "border-white from-white/20 to-white/30"
                : "from-black/70 to-black/20 border-black"
            }`}
          >
            <img
              className="object-cover w-full h-full"
              src={pb.files.getUrl(asset, asset.thumbnail)}
              alt={asset.name}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const UI: React.FC = () => {
  const { currentCategory, customization, mode, setMode, loading } =
    useConfiguratorStore() as unknown as CustomStore;

  return (
    <main className="pointer-events-none fixed z-10 inset-0 select-none">
      <div
        className={`absolute inset-0 bg-black z-10 pointer-events-none flex items-center justify-center transition-opacity duration-1000 ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      ></div>
      <div className="mx-auto h-full max-w-screen-xl w-full flex flex-col justify-between">
        <div className="flex justify-between items-center p-10">
          <div className="flex items-cente gap-2"></div>
        </div>
        <div className="md:px-10 flex flex-col">
          {mode === uiModes.customize && currentCategory && (
            <>
              {currentCategory.colorPalette &&
                customization[currentCategory.name] && <ColorPicker />}
              <AssetsBox />
            </>
          )}
          {mode === uiModes.photo && <PosesBox />}
          <div className="flex justify-stretch">
            <button
              className={`flex-1 pointer-events-auto p-4 text-white transition-colors duration-200 font-medium ${
                mode === uiModes.customize
                  ? "bg-indigo-500/90"
                  : "bg-indigo-500/30 hover:bg-indigo-500/50"
              }`}
              onClick={() => setMode(uiModes.customize)}
            >
              Customize avatar
            </button>
            <div className="w-px bg-white/30"></div>
            <button
              className={`flex-1 pointer-events-auto p-4 text-white transition-colors duration-200 font-medium ${
                mode === uiModes.photo
                  ? "bg-indigo-500/90"
                  : "bg-indigo-500/30 hover:bg-indigo-500/50"
              }`}
              onClick={() => setMode(uiModes.photo)}
            >
              Photo booth
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

const ColorPicker: React.FC = () => {
  const { updateColor, currentCategory, customization } =
    useConfiguratorStore() as unknown as CustomStore;

  const handleColorChange = (color: string) => {
    updateColor(color);
  };

  if (!currentCategory || !customization[currentCategory.name]?.asset) {
    return null;
  }

  return (
    <div className="pointer-events-auto relative flex gap-2 max-w-full overflow-x-auto backdrop-blur-sm py-2 drop-shadow-md noscrollbar px-2 md:px-0">
      {currentCategory.expand?.colorPalette?.colors.map((color, index) => (
        <button
          key={`${index}-${color}`}
          className={`w-10 h-10 p-1.5 drop-shadow-md bg-black/20 shrink-0 rounded-lg overflow-hidden transition-all duration-300 border-2 ${
            customization[currentCategory.name].color === color ? "border-white" : "border-transparent"
          }`}
          onClick={() => handleColorChange(color)}
        >
          <div className="w-full h-full rounded-md" style={{ backgroundColor: color }} />
        </button>
      ))}
    </div>
  );
};

export default UI;
