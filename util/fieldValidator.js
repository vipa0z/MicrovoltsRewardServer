function validateItemStructure(entry) {
    const requiredFields = ['itemId', 'itemName', 'itemOption'];
    const entryKeys = Object.keys(entry);

    const missing = requiredFields.filter(field => !(field in entry));
    if (missing.length > 0) return { valid: false, error: `Missing required field(s): ${missing.join(', ')}` };

    const unknown = entryKeys.filter(key => !requiredFields.includes(key));
    if (unknown.length > 0) return { valid: false, error: `Unknown field(s): ${unknown.join(', ')}` };

    const itemId = entry.itemId;
    if (
        !(
            (typeof itemId === 'number' && Number.isInteger(itemId)) ||
            (Array.isArray(itemId) && itemId.every(id => typeof id === 'number' && Number.isInteger(id)))
        )
    ) return { valid: false, error: `Invalid itemId: must be an integer or array of integers.` };

    if (typeof entry.itemName !== 'string') return { valid: false, error: `Invalid itemName: must be a string.` };
    if (typeof entry.itemOption !== 'string') return { valid: false, error: `Invalid itemOption: must be a string.` };

    return { valid: true };
}

module.exports = { validateItemStructure };
