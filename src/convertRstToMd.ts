import { execSync } from 'node:child_process'

export function convertRstToMd(filePath: string) {
    const argv = [
        'pandoc',
        '--from=rst',
        '--to=html',
        filePath,
    ]

    const fileContents = execSync(argv.join(' ')).toString('utf-8')

    // fileContents = fileContents.replaceAll('::: {.note}', '::: info')
    // fileContents = fileContents.replaceAll('::: {.tip}', '::: tip')
    // fileContents = fileContents.replaceAll('::: {.warning}', '::: warning')
    // fileContents = fileContents.replaceAll('::: {.danger}', '::: danger')

    // fileContents = fileContents.replaceAll('::: {.admonition-title}\nNote\n:::', '')
    // fileContents = fileContents.replaceAll('::: {.admonition-title}\nTip\n:::', '')
    // fileContents = fileContents.replaceAll('::: {.admonition-title}\nWarning\n:::', '')
    // fileContents = fileContents.replaceAll('::: {.admonition-title}\nDanger\n:::', '')

    // fileContents = fileContents.replaceAll(/\s+::: {.tabs}/g, '\n::: tabs')
    // fileContents = fileContents.replaceAll(/\s+::: {.tab}\n/g, '\n== ')
    // fileContents = fileContents.replaceAll(/\s+:::/g, '\n:::')

    // if (filePath.includes('submitting_to_assetlib')) {
    //     console.log(fileContents)
    // }

    // TODO patch references links
    // TODO patch img links
    // TODO patch tables

    return fileContents
}
