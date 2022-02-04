export const throwServerError = (error: Error) => {
    throw new Error(error?.message || JSON.stringify(error))
}