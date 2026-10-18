import { chromium } from '@playwright/test'
const browser = await chromium.launch()
try {
  for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
    const context = await browser.newContext({ viewport:{width,height}, timezoneId:'America/Sao_Paulo', deviceScaleFactor:1 })
    const page = await context.newPage()
    await page.clock.install({time:new Date('2026-10-19T18:30:00-03:00')})
    await page.goto('http://127.0.0.1:4173/')
    await page.getByRole('heading',{name:/Vamos evoluir/}).waitFor()
    await page.evaluate(()=>document.fonts.ready)
    await page.screenshot({path:`docs/evidencias/inicio-${name}.png`,animations:'disabled'})
    if(name==='mobile') {
      await page.getByRole('button',{name:'Iniciar treino',exact:true}).click()
      await page.clock.fastForward(1800000)
      await page.getByRole('spinbutton',{name:'Repetições',exact:true}).fill('6')
      await page.getByRole('spinbutton',{name:'RPE real',exact:true}).fill('7')
      await page.screenshot({path:'docs/evidencias/treino-mobile.png',animations:'disabled'})
    }
    await context.close()
  }
} finally { await browser.close() }
