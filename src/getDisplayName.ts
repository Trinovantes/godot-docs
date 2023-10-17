export function getDisplayName(name: string): string {
    name = name.replace('.rst', '')

    switch (name) {
        case 'classes': return 'API Reference'
    }

    if (name.length <= 3) {
        name = name.toUpperCase()
    } else {
        name = name
            .split('_')
            .map((part) => {
                if (part.length > 3) {
                    return part[0].toUpperCase() + part.substring(1)
                } else {
                    return part
                }
            })
            .join(' ')
    }

    return name
}
