import { expect, test } from 'claude-code/testing'

const props = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 3,
  bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

test('band warns only while a Fable model is active', async ($, on) => {
  let model = 'claude-fable-5-1'
  on('session.model', () => ({ value: model }))
  // Stands for the engine's own (empty) band beneath the plugin.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  const target = { plugin: 'model-band', surface: 'terminal', component: 'AbovePrompt', props } as const

  const fable = await $.ui.mount(target)
  expect(await fable.find({ type: 'Text', text: /Fable 5\.1 2×/ })).toBeDefined()
  await fable.unmount()

  model = 'claude-opus-5-5'
  const opus = await $.ui.mount(target)
  expect(await opus.find({ type: 'Text', text: /Fable/ })).toBeUndefined()
  await opus.unmount()
})
