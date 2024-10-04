declare global {
    interface process {
        env: {
            [key: string]: string
        }
    }
}
