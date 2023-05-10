import { useContext } from "react"
import { Context } from "../context"


export const useMyContext = () => {
    return useContext(Context);
}