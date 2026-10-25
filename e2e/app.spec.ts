import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function go(page: Page, name: string) {
  if (
    await page
      .getByRole("button", { name: "Voltar ao início", exact: true })
      .isVisible()
  ) {
    await page
      .getByRole("button", { name: "Voltar ao início", exact: true })
      .click();
    if (name === "Início") return;
  }
  if ((page.viewportSize()?.width ?? 1000) <= 720)
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name, exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-19T18:30:00-03:00") });
  await page.goto("/");
});
test("telas reais, perfil e ausência de dados fictícios", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /Vamos evoluir/ }),
  ).toBeVisible();
  await go(page, "Performance");
  await expect(
    page.getByText("Os seus dados vão contar essa história.").first(),
  ).toBeVisible();
  await go(page, "Configurações");
  await page
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("Caio atleta");
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil atualizado." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Vamos evoluir, Caio/ }),
  ).toBeVisible();
  await go(page, "Histórico");
  await expect(
    page.getByText("Sua história começa no primeiro treino"),
  ).toBeVisible();
});
test("treino inteiro disponível imediatamente e séries persistem", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  for (const name of [
    "Weighted Pull-up",
    "Remada apoiada",
    "Rosca bíceps",
    "Facepull",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(page.locator(".clocks,.rest-panel,.oapu-clock")).toHaveCount(0);
  const first = page.getByRole("region", {
    name: "Exercício: Weighted Pull-up",
    exact: true,
  });
  await first
    .getByRole("spinbutton", { name: "Lastro kg", exact: true })
    .fill("10");
  await first
    .getByRole("spinbutton", { name: "Repetições", exact: true })
    .fill("6");
  await first
    .getByRole("spinbutton", { name: "RPE real", exact: true })
    .fill("7");
  await first
    .getByRole("button", { name: "Concluir série 1", exact: true })
    .click();
  await expect(
    first.getByRole("heading", { name: "Série 2", exact: true }),
  ).toBeVisible();
  await first
    .getByRole("button", { name: "Selecionar série 1", exact: true })
    .click();
  await first
    .getByRole("spinbutton", { name: "Lastro kg", exact: true })
    .fill("12.5");
  await first
    .getByRole("button", { name: "Salvar correção", exact: true })
    .click();
  await page.locator(".optional-oapu>summary").click();
  await page
    .getByRole("textbox", { name: "Tipo de assistência" })
    .fill("Elástico leve");
  const oapu = page.locator(".oapu-card");
  await oapu
    .getByRole("spinbutton", { name: "Repetições", exact: true })
    .fill("2");
  await oapu
    .getByRole("spinbutton", { name: "Isometria (segundos)" })
    .fill("0");
  await oapu.getByRole("spinbutton", { name: "RPE do registro" }).fill("6");
  await page
    .getByRole("button", { name: "Registrar lado D", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Retomar treino", exact: true })
    .click();
  await expect(
    page.getByText("1/11 séries de força registradas", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finalizar sessão", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar término", exact: true })
    .click();
  await go(page, "Histórico");
  await page.locator(".history-item summary").click();
  await expect(page.getByText("12.5 kg · 6 reps · RPE 7")).toBeVisible();
  await expect(page.getByText(/OAPU D: 2 reps/)).toBeVisible();
});
test("check-in e backup exportável preservam observações", async ({ page }) => {
  await go(page, "Recuperação");
  await page
    .getByRole("spinbutton", { name: "Sono (horas)", exact: true })
    .fill("5.5");
  await page
    .getByRole("spinbutton", { name: "Estresse (0–10)", exact: true })
    .fill("5");
  await page
    .getByRole("spinbutton", { name: "Fadiga (0–10)", exact: true })
    .fill("3");
  await page
    .getByRole("spinbutton", { name: "Dor (0–10)", exact: true })
    .fill("4");
  await page
    .getByRole("textbox", { name: "Localização da dor", exact: true })
    .fill("Cotovelo");
  await page
    .getByRole("button", { name: "Salvar check-in", exact: true })
    .click();
  await expect(
    page.getByText("Progressão bloqueada para o exercício que provocar dor."),
  ).toBeVisible();
  await go(page, "Configurações");
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar JSON", exact: true })
    .click();
  expect((await dl).suggestedFilename()).toMatch(/hybrid-strength.*\.json/);
  await page.reload();
  await go(page, "Recuperação");
  await expect(
    page.getByRole("cell", { name: "Cotovelo", exact: true }),
  ).toBeVisible();
});
test("ABCDE livres, semana inteira e troca sem perder sessão", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-18T14:00:00-03:00"));
  await page.reload();
  await go(page, "Treino");
  await page
    .getByRole("button", { name: "Semana completa", exact: true })
    .click();
  for (const letter of "ABCDE")
    await expect(
      page.getByRole("heading", { name: "Treino " + letter, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Deadlift", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir Treino E", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Deadlift", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Treino", exact: true })
    .selectOption("2");
  await expect(
    page.getByRole("heading", { name: "Back Squat", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Treino", exact: true })
    .selectOption("5");
  await expect(
    page.getByRole("button", { name: "Finalizar sessão", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".clocks,.rest-panel,.oapu-clock")).toHaveCount(0);
  await page.clock.fastForward(90 * 60 * 1000);
  await expect(page.getByText(/80 minutos atingidos/)).toHaveCount(0);
});
test("sem overflow a 320 px e offline restaura a interface com os dados", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) =>
    errors.push(`${r.url()}: ${r.failure()?.errorText}`),
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(
    page.getByRole("heading", { name: /Vamos evoluir/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await go(page, "Configurações");
  await page
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("Caio offline");
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil atualizado." }),
  ).toBeVisible();
  await go(page, "Início");
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
    return !!reg.active;
  });
  await context.setOffline(true);
  await page.reload();
  await test.info().attach("offline-diagnostic", {
    body: JSON.stringify(
      {
        errors,
        url: page.url(),
        html: (await page.content()).slice(0, 2000),
        cache: await page.evaluate(async () => {
          const keys = await caches.keys();
          return Promise.all(
            keys.map(async (key) => ({
              key,
              urls: (await (await caches.open(key)).keys()).map((r) => r.url),
            })),
          );
        }),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await expect(
    page.getByRole("heading", { name: /Vamos evoluir/ }),
  ).toBeVisible();
  await go(page, "Performance");
  await expect(
    page.getByRole("heading", { name: "Força em perspectiva." }),
  ).toBeVisible();
  await go(page, "Configurações");
  await expect(
    page.getByRole("textbox", { name: "Nome", exact: true }),
  ).toHaveValue("Caio offline");
  await context.setOffline(false);
});
