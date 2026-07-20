import Foundation
import Capacitor
import StoreKit

/// Plugin de Compra no App (StoreKit 2) do Bela Climb.
///
/// Expõe o desbloqueio do jogo completo (compra ÚNICA, não-consumível) para o JS
/// (ver js/iap.js). A StoreKit é a fonte da verdade da posse — o JS só cacheia por UX.
/// Não usa SDK de terceiros nem coleta dados: fala direto com a Apple.
///
/// Métodos (todos Promise):
///   getProduct({ productId }) -> { price: String, owned: Bool }
///   purchase({ productId })   -> { success: Bool, cancelled?: Bool, pending?: Bool }
///   restore({ productId })    -> { owned: Bool }
@objc(BelaIAPPlugin)
public class BelaIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BelaIAPPlugin"
    public let jsName = "BelaIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    /// Ouve transações que chegam de fora do fluxo do app (Ask to Buy, compras
    /// interrompidas, feitas em outro aparelho) e as finaliza para não ficarem presas.
    public override func load() {
        updatesTask = Task.detached { [weak self] in
            for await update in Transaction.updates {
                if case .verified(let transaction) = update {
                    await transaction.finish()
                    self?.notifyListeners("entitlementChanged", data: ["owned": true])
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    @objc public func getProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId ausente"); return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    // produto não configurado ainda no App Store Connect
                    call.resolve(["owned": await self.isOwned(productId)])
                    return
                }
                call.resolve([
                    "price": product.displayPrice,          // localizado (ex.: "R$ 14,90")
                    "owned": await self.isOwned(productId)
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc public func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId ausente"); return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("produto não encontrado"); return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["success": true])
                    } else {
                        // assinatura da transação não verificada: não libera
                        call.resolve(["success": false])
                    }
                case .userCancelled:
                    call.resolve(["success": false, "cancelled": true])
                case .pending:
                    call.resolve(["success": false, "pending": true])
                @unknown default:
                    call.resolve(["success": false])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc public func restore(_ call: CAPPluginCall) {
        let productId = call.getString("productId")
        Task {
            // sincroniza com a App Store (pode pedir login) e checa a posse
            try? await AppStore.sync()
            if let productId = productId {
                call.resolve(["owned": await self.isOwned(productId)])
            } else {
                call.resolve(["owned": await self.hasAnyEntitlement()])
            }
        }
    }

    /// true se o usuário possui (entitlement ativo) o produto dado.
    private func isOwned(_ productId: String) async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == productId,
               transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }

    private func hasAnyEntitlement() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified = result { return true }
        }
        return false
    }
}
