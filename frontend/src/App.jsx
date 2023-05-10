import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { ErrorPage, Home, Room } from './modules'
import { ProtectedRoute } from './components'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/room' element={<ProtectedRoute element={Room} />} />
        <Route path='*' element={<ErrorPage />} />
      </Routes>
    </div>
  )
}

export default App