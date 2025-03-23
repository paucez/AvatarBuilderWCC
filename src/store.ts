import { create } from "zustand";
import PocketBase from "pocketbase";
import { MeshStandardMaterial, Color } from "three";
import { randInt } from "three/src/math/MathUtils.js";

type PoseType = "Idle" | "Chill" | "Cool" | "Punch" | "Ninja" | "King" | "Busy";
type ModeType = "photo" | "customize";
type Category = {
  id: string;
  name: string;
  assets: Asset[];
  removable?: boolean;
  expand?: {
    colorPalette?: {
      colors: string[];
    };
  };
  startingAsset?: string;
};

type Asset = {
  id: string;
  name: string;
  group: string;
  lockedGroups?: string[];
} | null;

type Customization = Record<string, { asset?: Asset | null; color?: string }>;

type ConfiguratorState = {
  loading: boolean;
  mode: ModeType;
  pose: PoseType;
  categories: Category[];
  currentCategory: Category | null;
  assets: Asset[];
  lockedGroups: Record<string, { name: string; categoryName: string }[]>;
  skin: MeshStandardMaterial;
  customization: Customization;
  download: () => void;
  setDownload: (download: () => void) => void;
  screenshot: () => void;
  setScreenshot: (screenshot: () => void) => void;
  setMode: (mode: ModeType) => void;
  setPose: (pose: PoseType) => void;
  updateColor: (color: string) => void;
  updateSkin: (color: string) => void;
  fetchCategories: () => Promise<void>;
  setCurrentCategory: (category: Category) => void;
  changeAsset: (category: string, asset: Asset | null) => void;
  randomize: () => void;
  applyLockedAssets: () => void;
};

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketBaseUrl) {
  throw new Error("VITE_POCKETBASE_URL is required");
}

export const PHOTO_POSES: Record<PoseType, PoseType> = {
  Idle: "Idle",
  Chill: "Chill",
  Cool: "Cool",
  Punch: "Punch",
  Ninja: "Ninja",
  King: "King",
  Busy: "Busy",
};

export const UI_MODES: Record<ModeType, ModeType> = {
  photo: "photo",
  customize: "customize",
};

export const pb = new PocketBase(pocketBaseUrl);

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  loading: true,
  mode: UI_MODES.customize,
  pose: PHOTO_POSES.Idle,
  categories: [],
  currentCategory: null,
  assets: [],
  lockedGroups: {},
  skin: new MeshStandardMaterial({ color: new Color(0xf5c6a5), roughness: 1 }),
  customization: {},
  download: () => {},
  setDownload: (download) => set({ download }),
  screenshot: () => {},
  setScreenshot: (screenshot) => set({ screenshot }),
  setMode: (mode) => {
    set({ mode });
    if (mode === UI_MODES.customize) {
      set({ pose: PHOTO_POSES.Idle });
    }
  },
  setPose: (pose) => set({ pose }),
  updateColor: (color) => {
    set((state) => ({
      customization: {
        ...state.customization,
        [state.currentCategory?.name || ""]: {
          ...state.customization[state.currentCategory?.name || ""],
          color,
        },
      },
    }));
    if (get().currentCategory?.name === "Head") {
      get().updateSkin(color);
    }
  },
  updateSkin: (color) => {
    get().skin.color.set(color);
  },
  fetchCategories: async () => {
    const categories: Category[] = await pb.collection("CustomizationGroups").getFullList({
      sort: "+position",
      expand: "colorPalette,cameraPlacement",
    });
    const assets: Asset[] = await pb.collection("CustomizationAssets").getFullList({
      sort: "-created",
    });
    const customization: Customization = {};
    categories.forEach((category) => {
      category.assets = assets.filter((asset) => asset!.group === category.id);
      customization[category.name] = {
        color: category.expand?.colorPalette?.colors?.[0] || "",
        asset: category.startingAsset
          ? category.assets.find((asset) => asset!.id === category.startingAsset) || null
          : null,
      };
    });
    set({
      categories,
      currentCategory: categories[0] || null,
      assets,
      customization,
      loading: false,
    });
    get().applyLockedAssets();
  },
  setCurrentCategory: (category) => set({ currentCategory: category }),
  changeAsset: (category: string, asset: Asset | null) => {
    set((state) => ({
      customization: {
        ...state.customization,
        [category]: {
          ...state.customization[category],
          asset,
        },
      },
    }));
    get().applyLockedAssets();
  },
  randomize: () => {
    const customization: Customization = {};
    get().categories.forEach((category) => {
      let randomAsset = category.assets[randInt(0, category.assets.length - 1)] || null;
      if (category.removable && randInt(0, category.assets.length - 1) === 0) {
        randomAsset = null;
      }
      const randomColor =
        category.expand?.colorPalette?.colors?.[randInt(0, category.expand.colorPalette.colors.length - 1)];
      customization[category.name] = {
        asset: randomAsset,
        color: randomColor,
      };
      if (category.name === "Head") {
        get().updateSkin(randomColor || "");
      }
    });
    set({ customization });
    get().applyLockedAssets();
  },
  applyLockedAssets: () => {
    const customization = get().customization;
    const categories = get().categories;
    const lockedGroups: Record<string, { name: string; categoryName: string }[]> = {};
    Object.values(customization).forEach((custom) => {
      if (custom.asset && custom.asset.lockedGroups) {
        custom.asset.lockedGroups.forEach((group) => {
          const categoryName = categories.find((c) => c.id === group)?.name || "";
          if (!lockedGroups[categoryName]) {
            lockedGroups[categoryName] = [];
          }
          const lockingAssetCategoryName = categories.find((cat) => cat.id === custom.asset!.group)?.name || "";
          lockedGroups[categoryName].push({ name: custom.asset!.name, categoryName: lockingAssetCategoryName });
        });
      }
    });
    set({ lockedGroups });
  },
}));

useConfiguratorStore.getState().fetchCategories();
