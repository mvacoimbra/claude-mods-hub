import type { ClientModule } from 'claude-code'

export type DemoClientProps = { hint: string }

// A region drawn by a surface module rather than the hooks module: it hears the pointer itself,
// which no element does, and draws where it is.
const DemoClient: ClientModule<DemoClientProps, { x: number; y: number; over: boolean }> = (props, surface) => {
  const { Text } = surface.elements
  surface.onPointer(e => surface.setState({ x: Math.round(e.x), y: Math.round(e.y), over: e.type !== 'leave' }))
  const state = surface.state

  return <Text color={state?.over ? 'claude' : 'subtle'}>{state?.over ? `pointer at column ${state.x}, row ${state.y}` : props.hint}</Text>
}

export default DemoClient
