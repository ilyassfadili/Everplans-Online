"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Alert, Button, FormField, Spinner, Text } from "@/components/ui";
import { inputClassName } from "@/components/ui/form/input";

export type CreateCheckoutOrderResult = { status: "success"; paypalOrderId: string } | { status: "error"; message: string };
export type CaptureCheckoutOrderResult = { status: "paid" } | { status: "error"; message: string };

interface PayPalCheckoutProps {
  clientId: string;
  currency: string;
  /** Creates a fresh Everplans order (server-side, price/product identity never client-supplied) and returns the PayPal order id to hand to the SDK. */
  createOrder: () => Promise<CreateCheckoutOrderResult>;
  /** Verifies and finalizes payment for the given PayPal order id (server-side, via the shared `verifyAndFinalizeOrder`), granting the entitlement on success. */
  captureOrder: (paypalOrderId: string) => Promise<CaptureCheckoutOrderResult>;
  /** Where a successful payment redirects - each product's own `checkout/success` page. */
  successHref: string;
}

/**
 * Everplans' one shared in-page checkout UI (Everplans Money Prompt 8,
 * generalized in Everplans Travel Planner Prompt 6 Phase 1 so a second
 * product could reuse it without a second, near-identical 300-line copy of
 * this same PayPal SDK integration - Prompt 6's own "do not duplicate...
 * PayPal client/server logic" rule). PayPal's Card Fields component (card
 * number/expiry/CVV/cardholder name, each a PayPal-hosted iframe so raw
 * card data never touches Everplans' own code) alongside the PayPal
 * Buttons component, both converging into whichever `createOrder`/
 * `captureOrder` Server Actions the caller passes in - the exact same
 * Everplans order/verification/entitlement pipeline every checkout path
 * in this app uses, parameterized only by which product is being bought.
 *
 * Card Fields availability depends on this PayPal app's own eligibility
 * (account approval/configuration, decided by PayPal, not this code) - a
 * PayPal app without it enabled doesn't cleanly report "not eligible," it
 * exposes a `CardFields` object with no working `isEligible` method at
 * all, so that check (and the whole Card Fields setup) is wrapped in its
 * own `try/catch` that falls back to `"unavailable"` on ANY failure there,
 * never surfacing it as a fatal checkout error. The PayPal Buttons
 * container is rendered independently of that outcome - it's always
 * present in the DOM the moment the SDK is ready, so there is always at
 * least one way to pay regardless of what Card Fields decides.
 */
export function PayPalCheckout({ clientId, currency, createOrder, captureOrder, successHref }: PayPalCheckoutProps) {
  const router = useRouter();

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [cardEligibility, setCardEligibility] = useState<CardEligibility>("checking");
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardFieldsRef = useRef<PayPalCardFieldsInstance | null>(null);
  const buttonsRenderedRef = useRef(false);
  const cardFieldsRenderedRef = useRef(false);
  const postalCodeRef = useRef<HTMLInputElement>(null);

  // `createOrder`/`onApprove` (the wrapper below, not the prop) are read via
  // refs inside the PayPal SDK callbacks below so the SDK components are
  // only ever initialized once (re-rendering `Buttons`/`CardFields` on
  // every state change would detach and re-attach the hosted iframes)
  // while still always calling the latest React state setters.
  async function handleCreateOrder(): Promise<string> {
    setErrorMessage(null);
    const result = await createOrder();
    if (result.status !== "success") {
      setStatus("error");
      setErrorMessage(result.message);
      throw new Error(result.message);
    }
    return result.paypalOrderId;
  }

  async function handleApprove(data: { orderID: string }): Promise<void> {
    setStatus("processing");
    const result = await captureOrder(data.orderID);
    if (result.status === "paid") {
      router.push(successHref);
      return;
    }
    setStatus("error");
    setErrorMessage(result.message);
  }

  function onSdkError(error: unknown): void {
    console.error("PayPalCheckout: PayPal SDK reported an error", error);
    setStatus("error");
    setErrorMessage("Something went wrong with PayPal. Please try again.");
  }

  // Effect 1: as soon as the SDK script loads, decide Card Fields
  // eligibility - deliberately its own effect, deferred a microtask out
  // (`react-hooks/set-state-in-effect` wants a setState call decoupled
  // from an effect's synchronous body), and never lets a broken/absent
  // `CardFields` object escalate into the checkout-wide error state.
  useEffect(() => {
    if (!sdkReady || !window.paypal) return;
    const paypal = window.paypal;

    void Promise.resolve().then(() => {
      let eligible = false;
      try {
        eligible = typeof paypal.CardFields?.isEligible === "function" && paypal.CardFields.isEligible();
      } catch (error) {
        console.error("PayPalCheckout: Card Fields eligibility check failed - falling back to PayPal only", error);
      }
      setCardEligibility(eligible ? "eligible" : "unavailable");
    });
  }, [sdkReady]);

  // Effect 2: the PayPal Buttons container (`#paypal-buttons-container`,
  // always present in the JSX below, independent of `cardEligibility`) is
  // rendered into as soon as the SDK is ready - this must never depend on
  // Card Fields' own outcome, so a customer always has a way to pay even
  // when Card Fields is unavailable or still being checked.
  useEffect(() => {
    if (!sdkReady || buttonsRenderedRef.current || !window.paypal) return;
    buttonsRenderedRef.current = true;

    window.paypal
      .Buttons({
        style: { layout: "vertical", shape: "rect", label: "paypal" },
        createOrder: handleCreateOrder,
        onApprove: handleApprove,
        onCancel: () => {
          // The customer closed PayPal's own popup without approving -
          // never an error, never touches order/entitlement state (the
          // order this `createOrder` call made simply stays `pending`,
          // exactly like a cancelled redirect checkout already handles).
          setStatus("idle");
        },
        onError: onSdkError,
      })
      .render("#paypal-buttons-container")
      .catch(onSdkError);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs exactly once, the moment the SDK is ready; re-running would try to render the same button a second time into an already-mounted container.
  }, [sdkReady]);

  // Effect 3: only once `cardEligibility` has actually become `"eligible"`
  // - by then React has already committed the card form's own DOM
  // (`#card-number-field` etc., rendered below), so these hosted fields
  // always have a real container to mount into.
  useEffect(() => {
    if (cardEligibility !== "eligible" || cardFieldsRenderedRef.current || !window.paypal?.CardFields) return;
    cardFieldsRenderedRef.current = true;

    try {
      const cardFields = window.paypal.CardFields({
        createOrder: handleCreateOrder,
        onApprove: handleApprove,
        onError: onSdkError,
        style: {
          input: { "font-size": "15px", "font-family": "Inter, ui-sans-serif, sans-serif", color: "#000814" },
          ".invalid": { color: "#b3261e" },
        },
      });
      cardFieldsRef.current = cardFields;

      cardFields.NameField({ placeholder: "Full name on card" }).render("#card-name-field");
      cardFields.NumberField({ placeholder: "Card number" }).render("#card-number-field");
      cardFields.ExpiryField({ placeholder: "MM / YY" }).render("#card-expiry-field");
      cardFields.CVVField({ placeholder: "CVV" }).render("#card-cvv-field");
    } catch (error) {
      console.error("PayPalCheckout: failed to render Card Fields - PayPal button remains available", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once per `cardEligibility` becoming "eligible"; re-running would try to render the same hosted fields a second time.
  }, [cardEligibility]);

  async function handleCardSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const cardFields = cardFieldsRef.current;
    if (!cardFields || status === "processing") return;

    const state = await cardFields.getState();
    if (!state.isFormValid) {
      setStatus("error");
      setErrorMessage("Check your card details and try again.");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const postalCode = postalCodeRef.current?.value || undefined;
      await cardFields.submit(postalCode ? { billingAddress: { postalCode } } : undefined);
    } catch {
      // A submit-time decline/validation error from PayPal itself - never
      // a raw error message from PayPal shown verbatim to the customer.
      setStatus("error");
      setErrorMessage("PayPal couldn't process that card. Please check your details and try again.");
    }
  }

  const isProcessing = status === "processing";

  return (
    <div className="flex flex-col gap-6">
      {/* `components=buttons` only, deliberately not `,card-fields` too -
          this PayPal app isn't eligible for Card Fields (confirmed:
          `CardFields.isEligible` doesn't even exist on the loaded SDK),
          and requesting the component anyway destabilized the Buttons
          component's own built-in "Debit or Credit Card" guest-checkout
          funding source (it failed entirely, with no error ever reaching
          Everplans' own server - a PayPal-side SDK interaction, not a bug
          in this codebase). Card Fields stays fully implemented in the
          effects/JSX below and activates automatically (just add
          `,card-fields` back to this URL) the moment this account is
          actually approved for it - nothing else here needs to change. */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=buttons&currency=${encodeURIComponent(currency)}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setSdkFailed(true)}
      />

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {sdkFailed ? (
        <Alert variant="error" title="Payment unavailable">
          We couldn&rsquo;t load PayPal just now. Please refresh the page or try again shortly.
        </Alert>
      ) : (
        <>
          {cardEligibility === "checking" && (
            <div className="flex items-center justify-center gap-2 rounded-md border border-line-subtle py-8">
              <Spinner size="sm" />
              <Text size="body-sm" tone="muted">
                Loading payment options…
              </Text>
            </div>
          )}

          {cardEligibility === "eligible" && (
            <form onSubmit={handleCardSubmit} className="flex flex-col gap-4" aria-label="Pay with card">
              <Text size="label" weight="semibold" tone="muted" className="uppercase tracking-wide">
                Card
              </Text>

              <FormField label="Cardholder name">
                <div id="card-name-field" className="h-11 rounded-md border border-line px-3 py-2.5" />
              </FormField>

              <FormField label="Card number">
                <div id="card-number-field" className="h-11 rounded-md border border-line px-3 py-2.5" />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Expiry">
                  <div id="card-expiry-field" className="h-11 rounded-md border border-line px-3 py-2.5" />
                </FormField>
                <FormField label="CVV">
                  <div id="card-cvv-field" className="h-11 rounded-md border border-line px-3 py-2.5" />
                </FormField>
              </div>

              <Text size="label" weight="semibold" tone="muted" className="mt-2 uppercase tracking-wide">
                Billing information
              </Text>
              <FormField label="Postal code" hint="Used to help verify your card - optional, but recommended.">
                <input
                  ref={postalCodeRef}
                  name="postalCode"
                  autoComplete="postal-code"
                  placeholder="12345"
                  disabled={isProcessing}
                  className={inputClassName(false)}
                />
              </FormField>

              <Button type="submit" size="lg" disabled={isProcessing} className="w-full">
                {isProcessing ? "Processing…" : "Pay securely"}
              </Button>
            </form>
          )}

          {cardEligibility === "unavailable" && (
            <Text size="body-sm" tone="muted">
              Card payment isn&rsquo;t available right now - pay with PayPal below.
            </Text>
          )}

          {cardEligibility === "eligible" && (
            <div className="flex items-center gap-3" role="separator" aria-label="Or pay with PayPal">
              <span className="h-px flex-1 bg-line-subtle" />
              <Text size="caption" tone="faint">
                OR
              </Text>
              <span className="h-px flex-1 bg-line-subtle" />
            </div>
          )}

          {/* Always mounted once the SDK script itself has loaded - never
              conditional on `cardEligibility`, so Effect 2 always has a
              real container to render the PayPal button into regardless
              of what Card Fields decides (or how long that check takes). */}
          <div
            id="paypal-buttons-container"
            aria-busy={isProcessing}
            className={isProcessing ? "pointer-events-none opacity-50" : undefined}
          />
        </>
      )}
    </div>
  );
}

type CardEligibility = "checking" | "eligible" | "unavailable";
type CheckoutStatus = "idle" | "processing" | "error";
