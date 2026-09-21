import { clearSpace } from "../../helpers/utils";
import { PAYMENT_METHOD_APM } from "../constants/paymentMethodAPM";
import { getStaticAssetsUrlByMode } from "../constants/staticAssetsUrl";

const PAYMENT_METHODS_CATALOG = {
  [PAYMENT_METHOD_APM.SORIANA]: {
    label: "Soriana",
    iconPath: "/payment_methods/soriana.png",
  },
  [PAYMENT_METHOD_APM.OXXO]: {
    label: "Oxxo",
    iconPath: "/payment_methods/oxxo.png",
  },
  [PAYMENT_METHOD_APM.CODI]: {
    label: "CoDi",
    iconPath: "/payment_methods/codi.png",
  },
  [PAYMENT_METHOD_APM.SPEI]: {
    label: "SPEI",
    iconPath: "/payment_methods/spei.png",
  },
  [PAYMENT_METHOD_APM.MERCADOPAGO]: {
    label: "Mercado Pago",
    iconPath: "/payment_methods/mercadopago.png",
  },
  [PAYMENT_METHOD_APM.OXXOPAY]: {
    label: "Oxxo Pay",
    iconPath: "/payment_methods/oxxopay.png",
  },
  [PAYMENT_METHOD_APM.PAYPAL]: {
    label: "Paypal",
    iconPath: "/payment_methods/paypal.png",
  },
  [PAYMENT_METHOD_APM.COMERCIALMEXICANA]: {
    label: "Comercial Mexicana",
    iconPath: "/payment_methods/comercial_exicana.png",
  },
  [PAYMENT_METHOD_APM.BANCOMER]: {
    label: "Bancomer",
    iconPath: "/payment_methods/bancomer.png",
  },
  [PAYMENT_METHOD_APM.WALMART]: {
    label: "Walmart",
    iconPath: "/payment_methods/walmart.png",
  },
  [PAYMENT_METHOD_APM.BODEGA]: {
    label: "Bodega Aurrera",
    iconPath: "/payment_methods/bodega_aurrera.png",
  },
  [PAYMENT_METHOD_APM.SAMSCLUB]: {
    label: "Sam´s Club",
    iconPath: "/payment_methods/sams_club.png",
  },
  [PAYMENT_METHOD_APM.SUPERAMA]: {
    label: "Superama",
    iconPath: "/payment_methods/superama.png",
  },
  [PAYMENT_METHOD_APM.CALIMAX]: {
    label: "Calimax",
    iconPath: "/payment_methods/calimax.png",
  },
  [PAYMENT_METHOD_APM.EXTRA]: {
    label: "Tiendas Extra",
    iconPath: "/payment_methods/tiendas_extra.png",
  },
  [PAYMENT_METHOD_APM.CIRCULOK]: {
    label: "Círculo K",
    iconPath: "/payment_methods/circulo_k.png",
  },
  [PAYMENT_METHOD_APM.SEVEN11]: {
    label: "7 Eleven",
    iconPath: "/payment_methods/7_eleven.png",
  },
  [PAYMENT_METHOD_APM.TELECOMM]: {
    label: "Telecomm",
    iconPath: "/payment_methods/telecomm.png",
  },
  [PAYMENT_METHOD_APM.BANORTE]: {
    label: "Banorte",
    iconPath: "/payment_methods/banorte.png",
  },
  [PAYMENT_METHOD_APM.BENAVIDES]: {
    label: "Farmacias Benavides",
    iconPath: "/payment_methods/farmacias_benavides.png",
  },
  [PAYMENT_METHOD_APM.DELAHORRO]: {
    label: "Farmacias del Ahorro",
    iconPath: "/payment_methods/farmacias_ahorro.png",
  },
  [PAYMENT_METHOD_APM.ELASTURIANO]: {
    label: "El Asturiano",
    iconPath: "/payment_methods/asturiano.png",
  },
  [PAYMENT_METHOD_APM.WALDOS]: {
    label: "Waldos",
    iconPath: "/payment_methods/waldos.png",
  },
  [PAYMENT_METHOD_APM.ALSUPER]: {
    label: "Alsuper",
    iconPath: "/payment_methods/al_super.png",
  },
  [PAYMENT_METHOD_APM.KIOSKO]: {
    label: "Kiosko",
    iconPath: "/payment_methods/kiosko.png",
  },
  [PAYMENT_METHOD_APM.STAMARIA]: {
    label: "Farmacias Santa María",
    iconPath: "/payment_methods/farmacias_santa_maria.png",
  },
  [PAYMENT_METHOD_APM.LAMASBARATA]: {
    label: "Farmacias la más barata",
    iconPath: "/payment_methods/farmacias_barata.png",
  },
  [PAYMENT_METHOD_APM.FARMROMA]: {
    label: "Farmacias Roma",
    iconPath: "/payment_methods/farmacias_roma.png",
  },
  [PAYMENT_METHOD_APM.FARMUNION]: {
    label: "Pago en Farmacias Unión",
    iconPath: "/payment_methods/farmacias_union.png",
  },
  [PAYMENT_METHOD_APM.FARMATODO]: {
    label: "Pago en Farmacias Farmatodo",
    iconPath: "/payment_methods/farmacias_farmatodo.png	",
  },
  [PAYMENT_METHOD_APM.SFDEASIS]: {
    label: "Pago en Farmacias San Francisco de Asís",
    iconPath: "/payment_methods/farmacias_san_francisco.png",
  },
  [PAYMENT_METHOD_APM.FARM911]: {
    label: "Farmacias 911",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.FARMECONOMICAS]: {
    label: "Farmacias Economicas",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.FARMMEDICITY]: {
    label: "Farmacias Medicity",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.RIANXEIRA]: {
    label: "Rianxeira",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WESTERNUNION]: {
    label: "Western Union",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.ZONAPAGO]: {
    label: "Zona Pago",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJALOSANDES]: {
    label: "Caja Los Andes",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJAPAITA]: {
    label: "Caja Paita",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJASANTA]: {
    label: "Caja Santa",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJASULLANA]: {
    label: "Caja Sullana",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJATRUJILLO]: {
    label: "Caja Trujillo",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.EDPYME]: {
    label: "Edpyme",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.KASNET]: {
    label: "KasNet",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.NORANDINO]: {
    label: "Norandino",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.QAPAQ]: {
    label: "Qapaq",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.RAIZ]: {
    label: "Raiz",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.PAYSER]: {
    label: "Paysera",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WUNION]: {
    label: "Western Union",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.BANCOCONTINENTAL]: {
    label: "Banco Continental",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.GMONEY]: {
    label: "Go money",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.GOPAY]: {
    label: "Go pay",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WU]: {
    label: "Western Union",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.PUNTOSHEY]: {
    label: "Puntoshey",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.AMPM]: {
    label: "Ampm",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.JUMBOMARKET]: {
    label: "Jumbomarket",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.SMELPUEBLO]: {
    label: "Smelpueblo",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.BAM]: {
    label: "Bam",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.REFACIL]: {
    label: "Refacil",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.ACYVALORES]: {
    label: "Acyvalores",
    iconPath: "/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.SAFETYPAYCASH]: {
    label: "Paga en Efectivo",
    iconPath: "/payment_methods/cash_apm_sp.png",
  },
  [PAYMENT_METHOD_APM.SAFETYPAYTRANSFER]: {
    label: "Paga por Transferencia",
    iconPath: "/payment_methods/transfer_apm_sp.png",
  },
  [PAYMENT_METHOD_APM.NEOSURF]: {
    label: "Neosurf",
    iconPath: "/payment_methods/neosurf.png",
  },
};

export const getPaymentMethodDetails = (scheme_data, mode) => {
  const scheme = clearSpace(scheme_data.toUpperCase());
  const _default = {
    iconPath: "/payment_methods/store.png",
    label: "",
  };
  const { iconPath, ...details } = PAYMENT_METHODS_CATALOG[scheme] || _default;
  return { ...details, icon: `${getStaticAssetsUrlByMode(mode)}${iconPath}` };
};
