import Capacitor

/// View controller do Capacitor com o plugin LOCAL de compras registrado.
///
/// O auto-registro do Capacitor só cobre plugins de pacotes (SPM); plugins
/// definidos dentro do app precisam ser registrados à mão. capacitorDidLoad()
/// é o gancho oficial para isso.
class BelaBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(BelaIAPPlugin())
    }
}
