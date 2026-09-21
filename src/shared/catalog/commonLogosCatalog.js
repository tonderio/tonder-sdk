import { getStaticAssetsUrlByMode } from "../constants/staticAssetsUrl";

const getCommonLogos = mode => {
  const baseUrl = getStaticAssetsUrlByMode(mode);
  return Object.freeze({
    pci: `${baseUrl}/tonder/logo-pci-500.png`,
    tonderBlue: `${baseUrl}/tonder/logo-tonder-blue.png`,
    tonderWhite: `${baseUrl}/tonder/logo-tonder-white.png`,
  });
};

export { getCommonLogos };
