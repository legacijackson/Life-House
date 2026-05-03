interface MaintenanceExpensePayload {
  id: string;
  title: string;
  category: string;
  cost: string | null;
  receiptUrl: string | null;
  resolvedAt: Date | null;
}

export async function pushMaintenanceExpense(ticket: MaintenanceExpensePayload): Promise<void> {
  const financeUrl = process.env.FINANCE_APP_URL;
  const token = process.env.FINANCE_SERVICE_TOKEN;

  if (!financeUrl || !token) {
    console.warn("[Finance] Finance app URL or service token not configured");
    return;
  }

  if (!ticket.cost) return;

  try {
    const res = await fetch(`${financeUrl}/api/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `Maintenance: ${ticket.title} — ${ticket.category}`,
        amount: parseFloat(ticket.cost),
        category: "Maintenance",
        receiptUrl: ticket.receiptUrl,
        date: ticket.resolvedAt?.toISOString() ?? new Date().toISOString(),
        linkedEntityType: "maintenance_ticket",
        linkedEntityId: ticket.id,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Finance] pushMaintenanceExpense failed:", res.status, text);
    }
  } catch (err) {
    console.error("[Finance] pushMaintenanceExpense error:", err);
  }
}
