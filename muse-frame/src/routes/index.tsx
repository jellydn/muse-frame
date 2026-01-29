import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div>
      <h1>Muse Frame</h1>
      <p>AI Personalized Portraits</p>
    </div>
  )
}
