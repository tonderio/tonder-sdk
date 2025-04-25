import { clearSpace } from "../../helpers/utils";
import { PAYMENT_METHOD_APM } from "../constants/paymentMethodAPM";

const PAYMENT_METHODS_CATALOG = {
  [PAYMENT_METHOD_APM.SORIANA]: {
    label: "Soriana",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/soriana.png",
  },
  [PAYMENT_METHOD_APM.OXXO]: {
    label: "Oxxo",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/oxxo.png",
  },
  [PAYMENT_METHOD_APM.CODI]: {
    label: "CoDi",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/codi.png",
  },
  [PAYMENT_METHOD_APM.SPEI]: {
    label: "SPEI",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/spei.png",
  },
  [PAYMENT_METHOD_APM.MERCADOPAGO]: {
    label: "Mercado Pago",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/mercadopago.png",
  },
  [PAYMENT_METHOD_APM.OXXOPAY]: {
    label: "Oxxo Pay",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/oxxopay.png",
  },
  [PAYMENT_METHOD_APM.PAYPAL]: {
    label: "Paypal",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/paypal.png",
  },
  [PAYMENT_METHOD_APM.COMERCIALMEXICANA]: {
    label: "Comercial Mexicana",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/comercial_exicana.png",
  },
  [PAYMENT_METHOD_APM.BANCOMER]: {
    label: "Bancomer",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/bancomer.png",
  },
  [PAYMENT_METHOD_APM.WALMART]: {
    label: "Walmart",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/walmart.png",
  },
  [PAYMENT_METHOD_APM.BODEGA]: {
    label: "Bodega Aurrera",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/bodega_aurrera.png",
  },
  [PAYMENT_METHOD_APM.SAMSCLUB]: {
    label: "Sam´s Club",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/sams_club.png",
  },
  [PAYMENT_METHOD_APM.SUPERAMA]: {
    label: "Superama",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/superama.png",
  },
  [PAYMENT_METHOD_APM.CALIMAX]: {
    label: "Calimax",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/calimax.png",
  },
  [PAYMENT_METHOD_APM.EXTRA]: {
    label: "Tiendas Extra",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/tiendas_extra.png",
  },
  [PAYMENT_METHOD_APM.CIRCULOK]: {
    label: "Círculo K",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/circulo_k.png",
  },
  [PAYMENT_METHOD_APM.SEVEN11]: {
    label: "7 Eleven",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/7_eleven.png",
  },
  [PAYMENT_METHOD_APM.TELECOMM]: {
    label: "Telecomm",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/telecomm.png",
  },
  [PAYMENT_METHOD_APM.BANORTE]: {
    label: "Banorte",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/banorte.png",
  },
  [PAYMENT_METHOD_APM.BENAVIDES]: {
    label: "Farmacias Benavides",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_benavides.png",
  },
  [PAYMENT_METHOD_APM.DELAHORRO]: {
    label: "Farmacias del Ahorro",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_ahorro.png",
  },
  [PAYMENT_METHOD_APM.ELASTURIANO]: {
    label: "El Asturiano",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/asturiano.png",
  },
  [PAYMENT_METHOD_APM.WALDOS]: {
    label: "Waldos",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/waldos.png",
  },
  [PAYMENT_METHOD_APM.ALSUPER]: {
    label: "Alsuper",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/al_super.png",
  },
  [PAYMENT_METHOD_APM.KIOSKO]: {
    label: "Kiosko",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/kiosko.png",
  },
  [PAYMENT_METHOD_APM.STAMARIA]: {
    label: "Farmacias Santa María",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_santa_maria.png",
  },
  [PAYMENT_METHOD_APM.LAMASBARATA]: {
    label: "Farmacias la más barata",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_barata.png",
  },
  [PAYMENT_METHOD_APM.FARMROMA]: {
    label: "Farmacias Roma",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_roma.png",
  },
  [PAYMENT_METHOD_APM.FARMUNION]: {
    label: "Pago en Farmacias Unión",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_union.png",
  },
  [PAYMENT_METHOD_APM.FARMATODO]: {
    label: "Pago en Farmacias Farmatodo",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_farmatodo.png	",
  },
  [PAYMENT_METHOD_APM.SFDEASIS]: {
    label: "Pago en Farmacias San Francisco de Asís",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/farmacias_san_francisco.png",
  },
  [PAYMENT_METHOD_APM.FARM911]: {
    label: "Farmacias 911",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.FARMECONOMICAS]: {
    label: "Farmacias Economicas",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.FARMMEDICITY]: {
    label: "Farmacias Medicity",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.RIANXEIRA]: {
    label: "Rianxeira",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WESTERNUNION]: {
    label: "Western Union",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.ZONAPAGO]: {
    label: "Zona Pago",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJALOSANDES]: {
    label: "Caja Los Andes",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJAPAITA]: {
    label: "Caja Paita",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJASANTA]: {
    label: "Caja Santa",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJASULLANA]: {
    label: "Caja Sullana",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.CAJATRUJILLO]: {
    label: "Caja Trujillo",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.EDPYME]: {
    label: "Edpyme",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.KASNET]: {
    label: "KasNet",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.NORANDINO]: {
    label: "Norandino",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.QAPAQ]: {
    label: "Qapaq",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.RAIZ]: {
    label: "Raiz",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.PAYSER]: {
    label: "Paysera",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WUNION]: {
    label: "Western Union",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.BANCOCONTINENTAL]: {
    label: "Banco Continental",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.GMONEY]: {
    label: "Go money",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.GOPAY]: {
    label: "Go pay",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.WU]: {
    label: "Western Union",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.PUNTOSHEY]: {
    label: "Puntoshey",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.AMPM]: {
    label: "Ampm",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.JUMBOMARKET]: {
    label: "Jumbomarket",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.SMELPUEBLO]: {
    label: "Smelpueblo",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.BAM]: {
    label: "Bam",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.REFACIL]: {
    label: "Refacil",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
  [PAYMENT_METHOD_APM.ACYVALORES]: {
    label: "Acyvalores",
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
  },
};

export const getPaymentMethodDetails = scheme_data => {
  const scheme = clearSpace(scheme_data.toUpperCase());
  const _default = {
    icon: "https://d35a75syrgujp0.cloudfront.net/payment_methods/store.png",
    label: "",
  };
  return PAYMENT_METHODS_CATALOG[scheme] || _default;
};
