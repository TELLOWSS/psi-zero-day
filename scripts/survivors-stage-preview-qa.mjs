/** Navigate the real preflight tab before inspecting its selected map. */
export async function openSurvivorsStagePreview(page) {
  await page.locator('.survivors-ready-dialog').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '작전 구역', exact: true }).click();
  const image = page.locator('.survivors-stage-preview');
  await image.waitFor({ state: 'visible' });
  await image.evaluate(async element => { if (!element.complete || !element.naturalWidth) await element.decode(); });
  return image;
}
