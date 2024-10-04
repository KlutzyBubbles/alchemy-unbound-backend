export function undefinedErrorFormat(parameters: { [key: string]: unknown }): string[] {
    const result: string[] = [];
    for (const key of Object.keys(parameters)) {
        if (parameters[key] === undefined) {
            result.push(key);
        }
    }
    return result;
}

export function excludeProps<T extends object, K extends keyof T | 'createdAt' | 'updatedAt'>(object: T, exclude: K[]): Omit<T, K> {
    const newObject = structuredClone(object);
    for (const key of Object.keys(newObject) as K[]) {
        if (exclude.includes(key)) {
            delete newObject[key as keyof T];
        }
    }
    return newObject;
}
