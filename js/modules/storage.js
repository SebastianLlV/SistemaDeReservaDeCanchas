const KEY = (iso) => `reservas: ${iso}`;

export function getReservedHours(iso) {
    try {
        const raw = localStorage.getItem(KEY(iso));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function addReservedHours(iso, hours = []) {
    const current = new Set(getReservedHours(iso));
    for (const h of hours) current.add(Number(h));
    const arr = [...current].sort((a, b) => a - b);
    localStorage.setItem(KEY(iso), JSON.stringify(arr));
    return arr;
}

export function forEachReservation(callback) {
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if(!k || !k.startsWith("reservas: ")) continue;
        const iso = k.slice('reservas: '.length);
        const hours = getReservedHours(iso);
        callback(iso, hours);
    }
}