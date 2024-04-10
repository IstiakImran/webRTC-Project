import { configureStore } from '@reduxjs/toolkit'
import { socketSlice } from '../Features/Socket/SocketSlice'

export const store = configureStore({
  reducer: {
    socket : socketSlice.reducer
  },
})