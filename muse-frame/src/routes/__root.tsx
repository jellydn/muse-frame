import { Outlet, createRootRoute } from '@tanstack/react-router'
import '../styles/global.css'

export const Route = createRootRoute({
  component: () => (
    <div>
      <Outlet />
    </div>
  ),
})
