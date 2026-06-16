import { test, expect } from "@playwright/test";

test("extracts regions from a bundled sample end to end", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Document Extractor").first()).toBeVisible();

  // Open the sample gallery and run the signed letter.
  await page.getByRole("button", { name: "Try a sample" }).click();
  await page.getByText("Signed letter").click();

  // Results arrive from the processing server.
  await expect(page.getByText(/regions detected/)).toBeVisible();
  await expect(page.getByText("Letterhead", { exact: true })).toBeVisible();
  await expect(page.getByText("Signature", { exact: true })).toBeVisible();

  // Per-region downloads are present.
  await expect(page.getByRole("button", { name: "PNG" }).first()).toBeVisible();
});
