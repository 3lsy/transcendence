import { useEffect, useState } from 'react'
// import { createWebSocket } from './websocket'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

interface HelloResponse { message: string }

export default function App() {
  const [hello, setHello] = useState<string>('')
  useEffect(() => {
    fetch('http://localhost:3600/api/hello')
      .then(res => res.json())
      .then((data: HelloResponse) => setHello(data.message))
      .catch(() => setHello('Error connecting'))
  }, [])

  return (
      <div className="w-full min-h-screen flex items-center justify-center bg-sky-100 dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-indigo-600">{hello || 'Loading...'}</h1>
      </div>
  )
}
