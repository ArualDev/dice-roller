export function lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
}

export function randomRange(min: number, max: number, integer = false) {
    const res = lerp(min, max, Math.random());
    return integer ? Math.floor(res) : res;
}

export function clamp(min: number, max: number, value: number) {
    return Math.max(Math.min(value, max), min);
}