function to12hHour (h24) {
    const isPM = h24 >= 12;
    let h = h24 % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;
}

export function formatRange(startHour, endHour) {
    return `${to12hHour(startHour)} - ${to12hHour(endHour)}`;
}

export function buildHourlySlotsTable({startHour = 8, endHour = 21, available = [], reserved = []}) {
    const avSet = new Set(available);
    const resSet = new Set(reserved);
    
    const out = [];
    for (let hour = startHour; hour < endHour; hour++) {
        out.push({
            startHour: hour,
            endHour: hour + 1,
            available: avSet.has(hour) && !resSet.has(hour) // If it's in available and not in reserved
        });
    }
    return out;
}