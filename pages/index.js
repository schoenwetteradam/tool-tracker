import ToolChangeForm from '../components/ToolChangeForm'

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tool Change Tracker</h1>
      <ToolChangeForm />
    </main>
  )
}
