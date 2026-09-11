mod multisig;

mod bindings {
    wit_bindgen::generate!({
        path: "wit"
    });

    use super::multisig::MultisigComponent;

    export!(MultisigComponent);
}
