export function generatePixPayload(key: string, name: string, city: string, amount: number): string {
    const formatStr = (id: string, value: string) => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
    };

    const merchantAccountInfo = formatStr('00', 'br.gov.bcb.pix') + formatStr('01', key);
    
    const amountStr = amount.toFixed(2);
    const additionalDataFieldTemplate = formatStr('05', '***');
    
    // Remover acentos de nome e cidade
    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");
    const safeName = normalizeStr(name).substring(0, 25).trim();
    const safeCity = normalizeStr(city).substring(0, 15).trim();

    const elements = [
        formatStr('00', '01'), // Payload Format Indicator
        formatStr('26', merchantAccountInfo),
        formatStr('52', '0000'), // Merchant Category Code
        formatStr('53', '986'), // Transaction Currency (986 = BRL)
        formatStr('54', amountStr), // Transaction Amount
        formatStr('58', 'BR'), // Country Code
        formatStr('59', safeName), // Merchant Name (max 25)
        formatStr('60', safeCity), // Merchant City (max 15)
        formatStr('62', additionalDataFieldTemplate)
    ];

    let payload = elements.join('') + '6304';

    const crc = crc16(payload);
    return payload + crc;
}

function crc16(str: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
