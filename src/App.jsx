import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useApi() {
  const base = API
  return {
    async ping() {
      const r = await fetch(`${base}/test`)
      return r.json()
    },
    async register({ name, email, password, role, rate_per_min, bio }) {
      const r = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, rate_per_min, bio })
      })
      if (!r.ok) throw new Error('Register failed')
      return r.json()
    },
    async login({ email, password }) {
      const r = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!r.ok) throw new Error('Login failed')
      return r.json()
    },
    async listAstrologers() {
      const r = await fetch(`${base}/astrologers`)
      return r.json()
    },
    async createChat(astrologer_id, min_fee) {
      const r = await fetch(`${base}/chat/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ astrologer_id, min_fee })
      })
      if (!r.ok) throw new Error('Chat create failed')
      return r.json()
    },
    async sendMessage(chat_id, sender_id, content) {
      const r = await fetch(`${base}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, sender_id, content })
      })
      if (!r.ok) throw new Error('Send failed')
      return r.json()
    },
    async getMessages(chat_id) {
      const r = await fetch(`${base}/chat/${chat_id}/messages`)
      return r.json()
    }
  }
}

export default function App() {
  const api = useApi()
  const [view, setView] = useState('landing')
  const [auth, setAuth] = useState(() => {
    const s = localStorage.getItem('auth')
    return s ? JSON.parse(s) : null
  })
  const [astros, setAstros] = useState([])
  const [selected, setSelected] = useState(null)
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const isAstrologer = auth?.role === 'astrologer'

  useEffect(() => {
    api.ping().catch(() => {})
  }, [])

  useEffect(() => {
    if (auth) localStorage.setItem('auth', JSON.stringify(auth))
  }, [auth])

  useEffect(() => {
    if (view === 'browse') {
      api.listAstrologers().then(setAstros)
    }
  }, [view])

  async function handleRegister(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    if (payload.rate_per_min) payload.rate_per_min = parseFloat(payload.rate_per_min)
    const res = await api.register(payload)
    setAuth(res)
    setView('browse')
  }

  async function handleLogin(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    const res = await api.login(payload)
    setAuth(res)
    setView('browse')
  }

  async function startChat(a) {
    const res = await api.createChat(a.id, a.rate_per_min || 0)
    setChat(res.chat_id)
    setSelected(a)
    setView('chat')
  }

  async function send() {
    if (!text.trim()) return
    await api.sendMessage(chat, auth.user_id, text)
    setText('')
    const msgs = await api.getMessages(chat)
    setMessages(msgs)
  }

  useEffect(() => {
    let t
    if (view === 'chat' && chat) {
      const poll = async () => {
        const msgs = await api.getMessages(chat)
        setMessages(msgs)
        t = setTimeout(poll, 1500)
      }
      poll()
    }
    return () => clearTimeout(t)
  }, [view, chat])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">AstroConnect</h1>
        <div className="space-x-3">
          {!auth && (
            <>
              <button className="px-3 py-2 bg-purple-600 text-white rounded" onClick={() => setView('login')}>Login</button>
              <button className="px-3 py-2 bg-white border rounded" onClick={() => setView('register')}>Register</button>
            </>
          )}
          {auth && (
            <>
              <span className="text-sm">{auth.name} · {auth.role}</span>
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => { setAuth(null); localStorage.removeItem('auth'); setView('landing') }}>Logout</button>
            </>
          )}
        </div>
      </header>

      {view === 'landing' && (
        <section className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-4xl font-semibold mb-4">Chat, Audio & Video Guidance with Trusted Astrologers</h2>
          <p className="text-gray-600 mb-6">Sign up to connect, set a minimal session fee, and start chatting instantly — inspired by the best of AstroTalk.</p>
          <button className="px-5 py-3 bg-purple-600 text-white rounded" onClick={() => setView('browse')}>Browse Astrologers</button>
        </section>
      )}

      {view === 'login' && (
        <section className="max-w-md mx-auto p-6 bg-white rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Login</h3>
          <form onSubmit={handleLogin} className="space-y-3">
            <input className="w-full border px-3 py-2 rounded" name="email" placeholder="Email" required />
            <input className="w-full border px-3 py-2 rounded" name="password" type="password" placeholder="Password" required />
            <button className="w-full bg-purple-600 text-white py-2 rounded">Login</button>
          </form>
        </section>
      )}

      {view === 'register' && (
        <section className="max-w-md mx-auto p-6 bg-white rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Create Account</h3>
          <form onSubmit={handleRegister} className="space-y-3">
            <input className="w-full border px-3 py-2 rounded" name="name" placeholder="Full name" required />
            <input className="w-full border px-3 py-2 rounded" name="email" placeholder="Email" required />
            <input className="w-full border px-3 py-2 rounded" name="password" type="password" placeholder="Password" required />
            <select className="w-full border px-3 py-2 rounded" name="role" defaultValue="user">
              <option value="user">I'm a User</option>
              <option value="astrologer">I'm an Astrologer</option>
            </select>
            <input className="w-full border px-3 py-2 rounded" name="rate_per_min" placeholder="Rate per minute (astrologers)" />
            <textarea className="w-full border px-3 py-2 rounded" name="bio" placeholder="Bio (optional)" />
            <button className="w-full bg-purple-600 text-white py-2 rounded">Register</button>
          </form>
        </section>
      )}

      {view === 'browse' && (
        <section className="max-w-5xl mx-auto p-6">
          <h3 className="text-2xl font-semibold mb-4">Top Astrologers</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {astros.map(a => (
              <div key={a.id} className="bg-white rounded shadow p-4 flex flex-col">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{a.name}</div>
                  <div className="text-sm text-gray-600">{a.bio || 'Experienced guide'}</div>
                  <div className="mt-2 text-purple-700 font-medium">{a.rate_per_min ? `${a.rate_per_min}/min` : 'Contact for rate'}</div>
                </div>
                <button className="mt-4 px-3 py-2 bg-purple-600 text-white rounded" onClick={() => startChat(a)}>
                  Start Chat
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === 'chat' && (
        <section className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded shadow h-[60vh] flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-semibold">Chat with {selected?.name}</div>
              <button className="text-sm text-purple-700" onClick={() => setView('browse')}>Back</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[70%] px-3 py-2 rounded ${m.sender_id === auth?.user_id ? 'bg-purple-600 text-white ml-auto' : 'bg-gray-100'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input className="flex-1 border px-3 py-2 rounded" value={text} onChange={e => setText(e.target.value)} placeholder="Type your message" />
              <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={send}>Send</button>
            </div>
          </div>
        </section>
      )}

      <footer className="text-center text-xs text-gray-500 py-6">Demo build. Audio/Video uses signaling stubs ready for WebRTC integration.</footer>
    </div>
  )
}
