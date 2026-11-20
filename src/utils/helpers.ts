// src/utils/helpers.ts
import { Order } from "../types/types";

export function formatForProduction(order: Order): string {
  const lines: string[] = [];
  lines.push(`Pedido #${order.orderNumber}`);
  lines.push(`${order.type.toUpperCase()} - ${order.customer?.name || "Sem nome"}`);
  
  if (order.customer?.address) {
    lines.push(`Endereço: ${order.customer.address}`);
  }
  
  lines.push("---");
  
  for (const item of order.items) {
    const extras = item.extras?.length
      ? ` (${item.extras.map((e) => e.name).join(", ")})`
      : "";
    lines.push(`${item.qty}x ${item.name}${extras}`);
  }
  
  lines.push("---");
  lines.push(`Subtotal: R$ ${order.subtotal.toFixed(2)}`);
  
  if (order.discount > 0) {
    lines.push(`Desconto: R$ ${order.discount.toFixed(2)}`);
  }
  
  lines.push(`TOTAL: R$ ${order.total.toFixed(2)}`);
  lines.push(`Pagamento: ${order.payment.method.toUpperCase()}`);
  
  return lines.join("\n");
}

export function generateOrderNumber(): number {
  return Math.floor(1000 + Math.random() * 9000);
}