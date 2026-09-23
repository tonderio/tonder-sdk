// The hosted checkout popup this class used to open is gone: it passed the order
// through a URL encrypted with a passphrase that shipped inside this bundle, and the
// receiving page no longer accepts those URLs. The export is kept as a throwing stub
// on purpose — the script-tag build is served from an unversioned path, so merchants
// receive this change without choosing it, and "Checkout is not a constructor" would
// tell them nothing about why their integration stopped working.
export class Checkout {
  constructor() {
    throw new Error(
      "Tonder Web SDK: the Checkout class was removed. The hosted checkout popup it opened passed the order through an encrypted URL that Tonder no longer accepts, so this flow can no longer complete a payment. Use a Tonder payment link (pk_...) or the InlineCheckout class exported by this same SDK instead.",
    );
  }
}
