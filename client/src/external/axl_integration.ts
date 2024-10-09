import AxL from './axl';

export const axlHandshake = async () => {
    const axl = new AxL();
    const handshake = axl.handshake();
    return handshake;
}