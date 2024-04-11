import { createSlice } from '@reduxjs/toolkit'
import {io} from 'socket.io-client'

const initialState = {
  socket : io('https://obyoy-meet-backend.onrender.com'),
}

export const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {

  },
})

// Action creators are generated for each case reducer function

export default socketSlice.reducer