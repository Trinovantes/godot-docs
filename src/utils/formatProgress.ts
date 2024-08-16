export function padNum(num: number, maxVal: number, padStr = ' '): string {
    const digits = Math.ceil(Math.log10(maxVal))
    return num.toString().padStart(digits, padStr)
}

export function formatProgress(num: number, maxVal: number, padStr = ' '): string {
    const formatedNum = padNum(num, maxVal, padStr)
    return `${formatedNum}/${maxVal}`
}
