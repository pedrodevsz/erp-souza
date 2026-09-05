import { DashboardContent } from './dashboard-content'

export function DashboardPage(props: Parameters<typeof DashboardContent>[0]) {
  return <DashboardContent {...props} />
}

export default DashboardPage
