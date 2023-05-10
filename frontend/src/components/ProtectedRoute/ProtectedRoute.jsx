import React, { useEffect, useState } from 'react'
import { useMyContext } from '../../hooks/useMyContext';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ element: Element }) => {
    const { roomName } = useMyContext();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setIsLoading(true);
        if (!roomName) {
            navigate('/');
            return;
        }
        setIsLoading(false);
    }, [roomName, navigate]);
    return (
        isLoading ?
            (
                <Loader />
            ) : (
                <Element />
            )
    )
}

export default ProtectedRoute;