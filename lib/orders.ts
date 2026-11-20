const visits = ["As soon as possible", "Later this week", "Next week"] as const;

export type OrderSlip = {
  reference: string;
  name: string;
  phone: string;
  workerId: string | null;
  catalogPhoneId: string | null;
  phoneModel: string;
  imei: string | null;
  visit: string;
  status: string;
  mithrilAccount: boolean | null;
  workerChannel: string | null;
  supportChannel: string | null;
  createdAt: string;
};

export type OrderInput = {
  name: string;
  phone: string;
  workerId: string;
  catalogPhoneId: string;
  phoneModel: string;
  visit: string;
  companyWebsite?: string;
};

export function pay2ownApi() {
  const production = process.env.NODE_ENV === "production";
  const base = (process.env.PAY2OWN_API_URL || (production ? "" : "http://127.0.0.1:8080")).replace(/\/$/, "");
  const token = process.env.PAY2OWN_INTAKE_TOKEN || (production ? "" : "pay2own-local-dev");
  return { base, token };
}

export async function submitOrder(input: OrderInput): Promise<{ order?: OrderSlip; error?: string; status: number }> {
  if (input.companyWebsite) {
    return { status: 201, order: fakeOrder(input) };
  }
  const { base, token } = pay2ownApi();
  if (!base || !token) {
    return { status: 503, error: "We couldn't reach the order desk. Call +233 54 441 5766." };
  }
  let response: Response;
  try {
    response = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pay2own-token": token,
      },
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        workerId: input.workerId,
        catalogPhoneId: input.catalogPhoneId,
        phoneModel: input.phoneModel,
        visit: input.visit,
      }),
      cache: "no-store",
    });
  } catch {
    return { status: 503, error: "We couldn't reach the order desk. Call +233 54 441 5766." };
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string } & Partial<OrderSlip>;
  if (!response.ok || !body.reference) {
    return { status: response.status, error: friendly(response.status, body.error) };
  }
  return { status: 201, order: body as OrderSlip };
}

export async function listOrders(): Promise<{ orders?: OrderSlip[]; error?: string; status: number }> {
  const { base, token } = pay2ownApi();
  if (!base || !token) {
    return { status: 503, error: "The order queue is not connected to Pay2Own yet." };
  }
  let response: Response;
  try {
    response = await fetch(`${base}/api/orders`, {
      headers: { "x-pay2own-token": token },
      cache: "no-store",
    });
  } catch {
    return { status: 503, error: "The order queue is unavailable." };
  }
  const body = (await response.json().catch(() => ({}))) as { orders?: OrderSlip[]; error?: string };
  if (!response.ok) return { status: response.status, error: "The order queue is unavailable." };
  return { status: 200, orders: body.orders || [] };
}

export async function cancelOrder(reference: string): Promise<{ order?: OrderSlip; error?: string; status: number }> {
  const { base, token } = pay2ownApi();
  if (!base || !token) return { status: 503, error: "The order queue is not connected to Pay2Own yet." };
  let response: Response;
  try {
    response = await fetch(`${base}/api/orders/${encodeURIComponent(reference)}/cancel`, {
      method: "POST",
      headers: { "x-pay2own-token": token },
      cache: "no-store",
    });
  } catch {
    return { status: 503, error: "The order queue is unavailable." };
  }
  const body = (await response.json().catch(() => ({}))) as Partial<OrderSlip> & { error?: string };
  if (!response.ok || !body.reference) return { status: response.status, error: body.error || "The order could not be cancelled." };
  return { status: 200, order: body as OrderSlip };
}

function friendly(status: number, error?: string) {
  if (error && !error.includes("unauthorized")) return error;
  if (status === 422 || status === 400) return "Check the order slip and try again.";
  return "We couldn't send your slip. Call +233 54 441 5766.";
}

function fakeOrder(input: OrderInput): OrderSlip {
  return {
    reference: "P2O-LOCAL",
    name: input.name,
    phone: input.phone,
    workerId: input.workerId || null,
    catalogPhoneId: input.catalogPhoneId || null,
    phoneModel: input.phoneModel,
    imei: null,
    visit: input.visit,
    status: "open",
    mithrilAccount: null,
    workerChannel: null,
    supportChannel: null,
    createdAt: new Date().toISOString(),
  };
}
