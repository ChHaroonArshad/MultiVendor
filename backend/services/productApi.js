import { apiFetch } from "./api";

export async function createProduct(formData) {
  const res = await apiFetch("/seller/products", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const err = new Error(json.message || "Failed to create product");
    err.errors = json.errors;
    throw err;
  }

  return json;
}