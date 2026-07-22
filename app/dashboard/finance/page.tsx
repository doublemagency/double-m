"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
export default function Finance() {
  const [data, setData] = useState<any>({
      transactions: [],
      prices: [],
      methods: [],
      payers: [],
      contracts: [],
      feeBands: [],
    }),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/finance`, {
      credentials: "include",
    });
    if (r.ok) setData(await r.json());
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      price = data.prices.find(
        (x: any) => String(x.id) === form.get("servicePriceId"),
      );
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/transactions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerEmail: form.get("payerEmail"),
            servicePriceId: price?.id,
            contractId: form.get("contractId") || undefined,
            purpose: form.get("purpose"),
            amount: form.get("amount"),
            currency: "KES",
            methodCode: form.get("methodCode") || undefined,
            externalReference: form.get("externalReference") || undefined,
          }),
        },
      ),
      result = await r.json();
    setMessage(result.message);
    if (r.ok) {
      e.currentTarget.reset();
      void load();
    }
  }
  async function paid(id: number) {
    const externalReference = window.prompt(
      "Enter the verified M-Pesa, bank, cash or card reference",
    );
    if (!externalReference) return;
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff/transactions/${id}/paid`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ externalReference }),
        },
      ),
      result = await r.json();
    setMessage(result.message);
    if (r.ok) void load();
  }
  return (
    <main className="admin-controls">
      <header>
        <Link href="/dashboard">← Dashboard</Link>
        <span>Protected finance register</span>
        <h1>Payments and receipts</h1>
        <p>
          Record charges for employers or employees. Only
          administrator-activated methods can be selected; receipts are issued
          after verification.
        </p>
      </header>
      <div className="admin-grid">
        <form onSubmit={create}>
          <h2>New payment record</h2>
          <label>
            Payer account
            <select name="payerEmail" required>
              <option value="">Choose a registered payer</option>
              {data.payers.map((payer: any) => (
                <option key={payer.id} value={payer.email}>
                  {payer.full_name} · {payer.email} ({payer.role})
                </option>
              ))}
            </select>
          </label>
          <label>
            Related contract
            <select
              name="contractId"
              onChange={(event) => {
                const contract = data.contracts.find(
                    (item: any) => String(item.id) === event.target.value,
                  ),
                  form = event.currentTarget.form;
                if (!contract || !form) return;
                const payer = form.elements.namedItem(
                  "payerEmail",
                ) as HTMLSelectElement;
                const purpose = form.elements.namedItem(
                  "purpose",
                ) as HTMLInputElement;
                const amount = form.elements.namedItem(
                  "amount",
                ) as HTMLInputElement;
                const employer = payer.value === contract.employer_email;
                purpose.value = employer
                  ? `Agency fee · ${contract.contract_number}`
                  : `Candidate agency contribution · ${contract.contract_number}`;
                amount.value = String(
                  employer
                    ? contract.agency_fee_amount || ""
                    : contract.candidate_fee_amount || "",
                );
              }}
            >
              <option value="">No contract selected</option>
              {data.contracts.map((contract: any) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contract_number} · {contract.role_title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Configured service
            <select
              name="servicePriceId"
              onChange={(e) => {
                const price = data.prices.find(
                    (x: any) => String(x.id) === e.target.value,
                  ),
                  form = e.currentTarget.form;
                if (price && form) {
                  (
                    form.elements.namedItem("purpose") as HTMLInputElement
                  ).value = price.service_name;
                  (
                    form.elements.namedItem("amount") as HTMLInputElement
                  ).value = price.amount;
                }
              }}
            >
              <option value="">Custom charge</option>
              {data.prices.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.service_name} · {x.currency}{" "}
                  {Number(x.amount).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Purpose
            <input name="purpose" required />
          </label>
          <label>
            Amount (KES)
            <input name="amount" type="number" min="1" step="0.01" required />
          </label>
          <label>
            Payment method
            <select name="methodCode">
              <option value="">Auto-detect from reference</option>
              {data.methods.map((x: any) => (
                <option key={x.method_code} value={x.method_code}>
                  {x.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            M-Pesa receipt or cash reference
            <input
              name="externalReference"
              placeholder="e.g. QAB12CD34E or CASH-001"
            />
            <small>
              A valid 10-character M-Pesa receipt is detected automatically.
              Cash remains staff-verified.
            </small>
          </label>
          <button>Create payment record</button>
        </form>
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>Recent transactions</h2>
            <span>{data.transactions.length}</span>
          </div>
          <div className="payment-table-wrap">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Payer</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((x: any) => (
                  <tr key={x.id} className={`payment-${x.status}`}>
                    <td>
                      <b>{x.email}</b>
                      <small>{x.role}</small>
                    </td>
                    <td>{x.purpose}</td>
                    <td>
                      {x.currency} {Number(x.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className="payment-status">{x.status}</span>
                    </td>
                    <td>{x.receipt_number || x.reference_code}</td>
                    <td>
                      {x.status !== "paid" && (
                        <button onClick={() => paid(x.id)}>
                          Verify & receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {message && <div className="admin-toast">{message}</div>}
    </main>
  );
}
