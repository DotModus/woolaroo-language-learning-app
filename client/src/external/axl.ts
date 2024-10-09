declare global {
    class AxL {
        handshake(): Promise<{[key: string]: any}>
    }
}


export const axlHandshake = async () => {
    const axl = new AxL();
    const handshake = axl.handshake();
    return handshake;
}