import { createContext, useState } from "react"
import { io } from "socket.io-client";

export const Context = createContext({});
const socket = io('http://localhost:3000');

export const ContextProvider = ({ children }) => {
    const [roomName, setRoomName] = useState('');
    const [email, setEmail] = useState('');
    return (
        <Context.Provider value={{
            socket,
            roomName,
            setRoomName,
            email,
            setEmail,
        }}>
            {children}
        </Context.Provider>
    )
}